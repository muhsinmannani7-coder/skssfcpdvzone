import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program, type Member } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/shared/Toaster'
import {
  Search, CheckCircle2, AlertTriangle, Users,
  LogOut, Phone, Hash, Loader2,
  RefreshCw, Clock, X, Volume2, VolumeX, ShieldCheck, Share2
} from 'lucide-react'
import { clsx } from 'clsx'

// Sound effect generator using Web Audio API (no external audio files required!)
function playBeep(type: 'success' | 'duplicate' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08) // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } else if (type === 'duplicate') {
      osc.frequency.setValueAtTime(350, ctx.currentTime)
      osc.frequency.setValueAtTime(280, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else {
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch {
    // Audio might fail if user has not interacted with DOM yet
  }
}

interface MemberWithPos extends Member {
  member_positions?: Array<{
    id: string
    is_active: boolean
    committee: { name: string; level: string }
    position: { title: string }
    cluster?: { name: string } | null
    unit?: { name: string } | null
  }>
}

interface AttendanceItem {
  id: string
  member_id: string
  marked_at: string
  member?: {
    full_name: string
    mobile: string
  }
}

export default function OperatorAttendanceDashboard() {
  const { profile, signOut } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastMarkedInfo, setLastMarkedInfo] = useState<{
    memberId: string
    memberName: string
    mobile?: string
    membershipNumber?: string | null
    time: string
    status: 'success' | 'duplicate'
    message?: string
  } | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch active programs
  const { data: activePrograms = [], isLoading: loadingPrograms } = useQuery<Program[]>({
    queryKey: ['active-programs-operator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('program_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Program[]
    },
    refetchInterval: 20000,
  })

  // Set default active program
  useEffect(() => {
    if (activePrograms.length > 0 && !selectedProgramId) {
      setSelectedProgramId(activePrograms[0].id)
    }
  }, [activePrograms, selectedProgramId])

  const currentProgram = useMemo(() => {
    return activePrograms.find(p => p.id === selectedProgramId) || activePrograms[0] || null
  }, [activePrograms, selectedProgramId])

  // 2. Fetch all members with positions
  const { data: members = [] } = useQuery<MemberWithPos[]>({
    queryKey: ['members-operator-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id, full_name, mobile, membership_number, is_active,
          member_positions(
            id, is_active,
            committee:committees(name, level),
            position:positions(title),
            cluster:clusters(name),
            unit:units(name)
          )
        `)
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return (data ?? []) as unknown as MemberWithPos[]
    },
    staleTime: 1000 * 60 * 5,
  })

  // 3. Fetch attendance for current program
  const { data: programAttendance = [], refetch: refetchAttendance } = useQuery<AttendanceItem[]>({
    queryKey: ['program-attendance-operator', currentProgram?.id],
    enabled: !!currentProgram?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, member_id, marked_at, member:members(full_name, mobile)')
        .eq('program_id', currentProgram!.id)
        .order('marked_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as AttendanceItem[]
    },
    refetchInterval: 10000,
  })

  // Set of already marked member IDs
  const attendedSet = useMemo(() => {
    const map = new Map<string, string>()
    programAttendance.forEach(a => {
      map.set(a.member_id, a.marked_at)
    })
    return map
  }, [programAttendance])

  // Mark Attendance Mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!currentProgram) throw new Error('No active program selected')

      // Use RPC if available or insert directly
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('mark_attendance', {
        p_program_id: currentProgram.id,
        p_member_id: memberId,
      })

      if (rpcErr) {
        // Fallback to direct insert if RPC has issue
        const { error: insErr } = await supabase.from('attendance').insert({
          program_id: currentProgram.id,
          member_id: memberId,
        })
        if (insErr) {
          if (insErr.code === '23505') {
            return { success: false, duplicate: true, error: 'ATTENDANCE ALREADY MARKED' }
          }
          throw insErr
        }
        return { success: true }
      }

      return rpcRes as { success: boolean; error?: string; duplicate?: boolean }
    },
    onSuccess: (res, memberId) => {
      const member = members.find(m => m.id === memberId)
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

      if (res.duplicate || !res.success) {
        if (soundEnabled) playBeep('duplicate')
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
        setLastMarkedInfo({
          memberId,
          memberName: member?.full_name || 'Member',
          mobile: member?.mobile,
          membershipNumber: member?.membership_number,
          time: nowStr,
          status: 'duplicate',
          message: res.error || 'Attendance already marked for this member!',
        })
        toast.warning(`Already Marked: ${member?.full_name}`)
      } else {
        if (soundEnabled) playBeep('success')
        if (navigator.vibrate) navigator.vibrate([80])
        setLastMarkedInfo({
          memberId,
          memberName: member?.full_name || 'Member',
          mobile: member?.mobile,
          membershipNumber: member?.membership_number,
          time: nowStr,
          status: 'success',
        })
        toast.success(`Check-In Recorded: ${member?.full_name}`)
      }

      qc.invalidateQueries({ queryKey: ['program-attendance-operator', currentProgram?.id] })
    },
    onError: (err: Error) => {
      if (soundEnabled) playBeep('error')
      toast.error('Failed to mark attendance', err.message)
    },
  })

  // Fast filtered search results
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []

    return members
      .filter(m =>
        m.full_name.toLowerCase().includes(q) ||
        m.mobile.includes(q) ||
        (m.membership_number && m.membership_number.toLowerCase().includes(q))
      )
      .slice(0, 12)
  }, [members, search])

  const handleMark = (memberId: string) => {
    markAttendanceMutation.mutate(memberId)
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col font-sans">
      {/* Top Mobile-Friendly Header */}
      <header className="sticky top-0 z-30 bg-teal-800 text-white shadow-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">SKSSF ATTENDANCE</h1>
              <p className="text-[11px] text-teal-200 mt-0.5 leading-none">
                {profile?.full_name || 'Operator Terminal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={clsx(
                'p-2 rounded-lg text-xs font-medium transition-colors',
                soundEnabled ? 'bg-teal-700 text-teal-100' : 'bg-teal-900 text-teal-400'
              )}
              title={soundEnabled ? 'Mute Audio Beeps' : 'Enable Audio Beeps'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg bg-teal-900 text-teal-200 hover:bg-red-700 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* Active Program Header */}
        {loadingPrograms ? (
          <div className="card p-4 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600 mb-1" />
            <p className="text-xs text-surface-500">Checking for active events...</p>
          </div>
        ) : !currentProgram ? (
          <div className="card p-6 text-center border-2 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
            <h2 className="text-base font-bold text-surface-900">No Active Program</h2>
            <p className="text-xs text-surface-600 mt-1">
              There is currently no event marked as &quot;ACTIVE&quot; by the Zone Administrator.
              Attendance recording will open once the admin starts an event.
            </p>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['active-programs-operator'] })}
              className="btn btn-secondary mt-3 inline-flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Check Again
            </button>
          </div>
        ) : (
          <>
            {/* Active Event Banner & Stats */}
            <div className="card p-4 bg-gradient-to-br from-teal-700 to-teal-800 text-white shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
                      LIVE RECORDING
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mt-0.5 leading-snug">{currentProgram.name}</h2>
                  <p className="text-xs text-teal-200 mt-0.5">{currentProgram.venue}</p>
                </div>

                <div className="text-right bg-teal-900/60 px-3 py-2 rounded-xl backdrop-blur-xs flex-shrink-0">
                  <span className="text-[10px] text-teal-300 uppercase tracking-wider block">Checked In</span>
                  <span className="text-2xl font-black text-white leading-none">
                    {programAttendance.length}
                  </span>
                </div>
              </div>

              {activePrograms.length > 1 && (
                <div className="mt-3 pt-2 border-t border-teal-600/50 flex items-center gap-2">
                  <span className="text-xs text-teal-200">Switch:</span>
                  <select
                    className="bg-teal-900 text-white text-xs rounded-lg px-2 py-1 border border-teal-600"
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                  >
                    {activePrograms.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Last Action Notification Banner */}
            {lastMarkedInfo && (
              <div
                className={clsx(
                  'card p-3 border-2 animate-bounce-in flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                  lastMarkedInfo.status === 'success'
                    ? 'border-green-400 bg-green-50 text-green-900'
                    : 'border-amber-400 bg-amber-50 text-amber-900'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {lastMarkedInfo.status === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">
                      {lastMarkedInfo.status === 'success' ? 'ATTENDANCE MARKED!' : 'ALREADY MARKED!'}
                    </p>
                    <p className="text-xs opacity-90 truncate">
                      {lastMarkedInfo.memberName} • {lastMarkedInfo.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {lastMarkedInfo.status === 'success' && lastMarkedInfo.mobile && currentProgram && (
                    <button
                      onClick={() => {
                        const clean = (lastMarkedInfo.mobile || '').replace(/\D/g, '')
                        const phone = clean.length === 10 ? `91${clean}` : clean
                        const msg = `*SKSSF ചപ്പാരപ്പടവ് മേഖല*\n━━━━━━━━━━━━━━━━━━━━\nപ്രിയ *${lastMarkedInfo.memberName}*, 🌹\n${lastMarkedInfo.membershipNumber ? `🆔 മെമ്പർഷിപ്പ് നമ്പർ: *${lastMarkedInfo.membershipNumber}*\n` : ''}\nഇന്ന് നടന്ന *${currentProgram.name}* മീറ്റിംഗിൽ പങ്കെടുത്തതിന് ഹൃദയം നിറഞ്ഞ നന്ദി രേഖപ്പെടുത്തുന്നു.\n\n📅 *തീയതി:* ${new Date(currentProgram.program_date).toLocaleDateString('en-GB')}\n⏰ *സമയം:* ${currentProgram.start_time || lastMarkedInfo.time}\n📍 *സ്ഥലം:* ${currentProgram.venue}\n\n_"വിദ്യാർത്ഥി നന്മ, സമൂഹ പുരോഗതി"_\n*SKSSF ചപ്പാരപ്പടവ് മേഖല കമ്മിറ്റി*\n━━━━━━━━━━━━━━━━━━━━`
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp നന്ദി സന്ദേശം</span>
                    </button>
                  )}
                  <button
                    onClick={() => setLastMarkedInfo(null)}
                    className="p-1 rounded-md opacity-60 hover:opacity-100"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Prominent High-Contrast Mobile Search Bar */}
            <div className="card p-3 shadow-md border-2 border-teal-500/30">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-700" />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  className="w-full pl-11 pr-10 py-3.5 bg-surface-50 border-2 border-surface-300 rounded-xl text-base font-semibold text-surface-900 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all"
                  placeholder="Enter Member Name or Mobile..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch('')
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results List */}
            {search.trim() && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-surface-500 uppercase px-1">
                  Matching Members ({searchResults.length})
                </p>

                {searchResults.length === 0 ? (
                  <div className="card p-6 text-center text-surface-500">
                    <p className="text-sm font-medium">No members found matching &quot;{search}&quot;</p>
                    <p className="text-xs text-surface-400 mt-1">Check spelling or search by 10-digit mobile number</p>
                  </div>
                ) : (
                  searchResults.map((m) => {
                    const isAttended = attendedSet.has(m.id)
                    const markedTime = attendedSet.get(m.id)
                    const posInfo = m.member_positions?.[0]

                    return (
                      <div
                        key={m.id}
                        className={clsx(
                          'card p-4 border transition-all flex items-center justify-between gap-3',
                          isAttended
                            ? 'border-green-300 bg-green-50/40'
                            : 'border-surface-200 bg-white hover:border-teal-400 shadow-xs'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-surface-900 truncate">
                              {m.full_name}
                            </h3>
                            {isAttended && (
                              <span className="badge badge-green text-[10px] py-0.5">
                                Present
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-surface-400" />
                              {m.mobile}
                            </span>
                            {m.membership_number && (
                              <span className="flex items-center gap-1 font-mono">
                                <Hash className="w-3 h-3 text-surface-400" />
                                {m.membership_number}
                              </span>
                            )}
                          </div>

                          {posInfo && (
                            <div className="text-xs text-teal-800 font-medium mt-1 truncate">
                              {posInfo.position?.title} • {posInfo.committee?.name}
                            </div>
                          )}

                          {isAttended && markedTime && (
                            <div className="text-[11px] text-green-700 font-semibold mt-1">
                              Marked at: {new Date(markedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div>
                          {isAttended ? (
                            <button
                              onClick={() => handleMark(m.id)}
                              className="px-3 py-2 rounded-xl bg-green-100 text-green-800 text-xs font-bold border border-green-300 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span>Recorded</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMark(m.id)}
                              disabled={markAttendanceMutation.isPending}
                              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
                            >
                              {markAttendanceMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              <span>Mark</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Recent Check-Ins Stream (When not actively searching) */}
            {!search.trim() && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-surface-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recent Check-Ins ({programAttendance.length})
                  </h3>
                  <button
                    onClick={() => refetchAttendance()}
                    className="text-xs text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {programAttendance.length === 0 ? (
                  <div className="card p-8 text-center text-surface-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Ready to record attendance</p>
                    <p className="text-xs mt-1">Search member by name or mobile number above.</p>
                  </div>
                ) : (
                  <div className="card divide-y divide-surface-100 overflow-hidden shadow-xs">
                    {programAttendance.slice(0, 10).map((att) => (
                      <div key={att.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[11px]">
                            {att.member?.full_name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <p className="font-bold text-surface-900 leading-tight">
                              {att.member?.full_name || 'Member'}
                            </p>
                            <p className="text-surface-500 text-[11px]">
                              {att.member?.mobile || ''}
                            </p>
                          </div>
                        </div>

                        <span className="font-mono text-surface-500 bg-surface-50 px-2 py-0.5 rounded text-[11px]">
                          {new Date(att.marked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

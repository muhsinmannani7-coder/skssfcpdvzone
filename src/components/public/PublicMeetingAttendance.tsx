import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Shield, CheckCircle, AlertCircle, Phone, Award,
  MapPin, Calendar, Clock, Share2, RefreshCw,
  Lock, Check, CheckCircle2, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'

interface MemberWithPositions {
  id: string
  full_name: string
  mobile: string
  membership_number?: string | null
  positions: Array<{
    title: string
    committee_name: string
    committee_level: 'zone' | 'cluster' | 'unit'
    unit_name?: string
    cluster_name?: string
  }>
}

// Crisp, positive Web Audio chime on success (works without external audio assets)
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.connect(gain)
    gain.connect(ctx.destination)

    // C5 -> E5 -> G5 chord arpeggio
    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.setValueAtTime(659.25, now + 0.08)
    osc.frequency.setValueAtTime(783.99, now + 0.16)
    osc.frequency.setValueAtTime(1046.50, now + 0.24) // C6

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.start(now)
    osc.stop(now + 0.6)
  } catch {
    // Ignore if audio context blocked by browser policy
  }
}

export default function PublicMeetingAttendance() {
  const { id: programId } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const [mobile, setMobile] = useState('')
  const [searching, setSearching] = useState(false)
  const [member, setMember] = useState<MemberWithPositions | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [alreadyMarked, setAlreadyMarked] = useState<boolean | null>(null)
  const [markedTime, setMarkedTime] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<{ name: string } | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch Program Info
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['public-program', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID required')
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()
      if (error) throw error
      return data as Program
    },
    enabled: !!programId,
    refetchInterval: 10000, // keep updated if admin closes or reopens
  })

  // 2. Fetch live attendance count
  const { data: attendanceCount = 0 } = useQuery({
    queryKey: ['public-attendance-count', programId],
    queryFn: async () => {
      if (!programId) return 0
      const { count } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('program_id', programId)
      return count ?? 0
    },
    enabled: !!programId,
    refetchInterval: 5000,
  })

  // Lookup member by mobile
  const handleSearchMember = async (mobileNumber: string) => {
    const clean = mobileNumber.trim().replace(/\D/g, '')
    if (clean.length < 10) return

    setSearching(true)
    setNotFound(false)
    setMember(null)
    setAlreadyMarked(null)

    try {
      // Find member with complete positions mapping
      const { data: memberData, error: memberErr } = await supabase
        .from('members')
        .select(`
          id, full_name, mobile, membership_number,
          member_positions (
            positions (title),
            committees (name, level),
            clusters (name),
            units (name, cluster_id, clusters (name))
          )
        `)
        .eq('mobile', clean)
        .eq('is_active', true)
        .maybeSingle()

      if (memberErr || !memberData) {
        setNotFound(true)
        setSearching(false)
        return
      }

      // Check if already marked for this program
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('marked_at')
        .eq('program_id', programId!)
        .eq('member_id', memberData.id)
        .maybeSingle()

      if (existingAttendance) {
        setAlreadyMarked(true)
        setMarkedTime(existingAttendance.marked_at)
      } else {
        setAlreadyMarked(false)
      }

      // Map positions with clear zone, cluster, and unit level metadata
      interface RawMP {
        positions?: { title: string } | null
        committees?: { name: string; level: 'zone' | 'cluster' | 'unit' } | null
        clusters?: { name: string } | null
        units?: { name: string; clusters?: { name: string } | null } | null
      }
      const rawPositions = (memberData.member_positions as unknown as RawMP[]) || []
      const positions = rawPositions.map(mp => {
        const level = mp.committees?.level ?? 'unit'
        const clusterName = mp.clusters?.name || mp.units?.clusters?.name
        return {
          title: mp.positions?.title ?? 'Member',
          committee_name: mp.committees?.name ?? '',
          committee_level: level,
          unit_name: mp.units?.name,
          cluster_name: clusterName,
        }
      })

      setMember({
        id: memberData.id,
        full_name: memberData.full_name,
        mobile: memberData.mobile,
        membership_number: memberData.membership_number,
        positions,
      })
    } catch {
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

  // Auto search on typing 10 digits
  const handleMobileChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10)
    setMobile(clean)
    setNotFound(false)
    setMember(null)
    setAlreadyMarked(null)

    if (clean.length === 10) {
      handleSearchMember(clean)
    }
  }

  // Confirm attendance mutation
  const confirmMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!programId) throw new Error('Missing program ID')

      // Use RPC if available
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('public_record_attendance', {
          p_program_id: programId,
          p_member_id: memberId,
        })

      if (!rpcError && rpcData) {
        if (!rpcData.success) {
          throw new Error(rpcData.error || 'Attendance could not be recorded')
        }
        return rpcData
      }

      // Fallback direct insert
      const { data: insertData, error: insertError } = await supabase
        .from('attendance')
        .insert({
          program_id: programId,
          member_id: memberId,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.message.includes('unique') || insertError.code === '23505') {
          throw new Error('Already marked attendance for this meeting')
        }
        throw insertError
      }
      return insertData
    },
    onSuccess: () => {
      playSuccessChime()
      setSuccessResult({ name: member?.full_name || 'Member' })
      qc.invalidateQueries({ queryKey: ['public-attendance-count', programId] })

      // Auto countdown 1 second for rapid next-person check-in
      setCountdown(1)
    },
  })

  // Handle countdown timer to reset input
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1200)
      return () => clearTimeout(timer)
    } else {
      // Rapid reset for next attendee
      handleResetForNext()
    }
  }, [countdown])

  const handleResetForNext = () => {
    setSuccessResult(null)
    setCountdown(null)
    setMember(null)
    setMobile('')
    setNotFound(false)
    setAlreadyMarked(null)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  // WhatsApp share message
  const shareOnWhatsApp = () => {
    if (!program) return
    const url = window.location.href
    const text = `*SKSSF CHAPPARAPPADAVU ZONE*\n📢 *MEETING ATTENDANCE*\n\n📌 *${program.name}*\n📍 *Venue:* ${program.venue}\n📅 *Date:* ${format(new Date(program.program_date), 'dd MMM yyyy')}\n\n👉 യോഗത്തിൽ പങ്കെടുത്തവർ താഴെ പറയുന്ന ലിങ്കിൽ കയറി മൊബൈൽ നമ്പർ നൽകി ഹാജർ രേഖപ്പെടുത്തുക:\n${url}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (programLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">Loading meeting portal...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center text-white">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Meeting Not Found</h2>
          <p className="text-slate-400 text-sm mt-2">
            The meeting link you opened does not exist or has been removed.
          </p>
          <Link to="/" className="inline-block mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col items-center justify-start p-4 sm:p-6">
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-4 my-auto py-6">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 mb-2 border border-emerald-400/30">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            SKSSF
          </h1>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Chapparappadavu Zone Committee
          </p>
        </div>

        {/* Meeting Details Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            {program.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                🔴 LIVE ATTENDANCE
              </span>
            ) : program.status === 'upcoming' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⏳ UPCOMING
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                🔒 ATTENDANCE CLOSED
              </span>
            )}

            <span className="text-xs font-semibold text-slate-300 bg-black/30 px-3 py-1 rounded-full border border-white/10">
              👥 {attendanceCount} Marked
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mt-2 leading-snug">
            {program.name}
          </h2>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-300 border-t border-white/10 pt-3">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>{format(new Date(program.program_date), 'dd MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{program.venue}</span>
            </div>
            {program.start_time && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Time: {program.start_time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Handling: If program is NOT active */}
        {program.status !== 'active' ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {program.status === 'upcoming'
                ? 'Attendance Has Not Started Yet'
                : 'Attendance is Closed'}
            </h3>
            <p className="text-sm text-slate-400">
              {program.status === 'upcoming'
                ? 'ഈ യോഗത്തിന്റെ ഹാജർ അഡ്മിൻ ആരംഭിച്ച ഉടൻ ഇവിടെ രേഖപ്പെടുത്താം. ദയവായി കാത്തിരിക്കുക.'
                : 'ഈ മീറ്റിംഗിന്റെ ഹാജർ രേഖപ്പെടുത്തൽ അഡ്മിൻ ക്ലോസ് ചെയ്തിരിക്കുന്നു. കൂടുതൽ വിവരങ്ങൾക്ക് സംഘാടകരുമായി ബന്ധപ്പെടുക.'}
            </p>
          </div>
        ) : successResult ? (
          /* Success Card */
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 border border-emerald-400/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto shadow-xl animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                Attendance Recorded!
              </p>
              <h3 className="text-2xl font-black text-white mt-1">
                {successResult.name}
              </h3>
              <p className="text-emerald-100 text-sm mt-1">
                ഹാജർ വിജയകരമായി രേഖപ്പെടുത്തി! (+1 Point)
              </p>
            </div>

            <div className="pt-2 border-t border-white/20">
              <button
                onClick={handleResetForNext}
                className="w-full py-3.5 bg-white text-emerald-800 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-50 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>അടുത്തയാൾക്ക് നൽകുക (Next Person)</span>
                {countdown !== null && (
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                    {countdown}
                  </span>
                )}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Live Attendance Form */
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5">
            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-1.5 flex items-center justify-between">
                <span>മൊബൈൽ നമ്പർ നൽകുക (Mobile Number)</span>
                <span className="text-xs text-slate-400 font-normal">10 Digits</span>
              </label>

              {/* Input + OK Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    ref={inputRef}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={mobile}
                    onChange={e => handleMobileChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && mobile.length >= 10) {
                        handleSearchMember(mobile)
                      }
                    }}
                    placeholder="10 അക്ക മൊബൈൽ നമ്പർ നൽകുക"
                    autoFocus
                    maxLength={10}
                    className="w-full bg-black/40 border-2 border-white/20 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 rounded-xl pl-11 pr-14 py-3.5 text-lg font-bold text-white placeholder-slate-500 outline-none transition tracking-wider"
                  />
                  {mobile.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobile('')
                        setMember(null)
                        setNotFound(false)
                        setAlreadyMarked(null)
                        inputRef.current?.focus()
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-md transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSearchMember(mobile)}
                  disabled={searching || mobile.length < 10}
                  className="px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 min-w-[80px]"
                >
                  {searching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>OK</span>}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-1.5">
                രജിസ്റ്റർ ചെയ്ത 10 അക്ക മൊബൈൽ നമ്പർ അടിച്ച് <strong>OK</strong> നൽകുക.
              </p>
            </div>

            {/* Searching indicator */}
            {searching && (
              <div className="flex items-center justify-center gap-2 py-4 text-emerald-300 text-sm font-medium animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>മെമ്പർ വിവരങ്ങൾ പരിശോധിക്കുന്നു...</span>
              </div>
            )}

            {/* Not found state */}
            {notFound && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-center space-y-1 animate-slide-up">
                <p className="font-bold text-red-300 text-sm">
                  ഈ മൊബൈൽ നമ്പർ കണ്ടെത്തിയില്ല
                </p>
                <p className="text-xs text-red-200">
                  മെമ്പർഷിപ്പ് ലിസ്റ്റിൽ ഈ നമ്പർ രജിസ്റ്റർ ചെയ്തിട്ടില്ല. ദയവായി നമ്പർ ശരിയാണോ എന്ന് പരിശോധിക്കുക അല്ലെങ്കിൽ അഡ്മിനുമായി ബന്ധപ്പെടുക.
                </p>
              </div>
            )}

            {/* Member Details Found */}
            {member && (
              <div className="bg-white/10 border border-emerald-500/30 rounded-2xl p-5 space-y-4 animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Member Verified ✓
                    </span>
                    <h3 className="text-xl font-black text-white leading-tight mt-0.5">
                      {member.full_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1 font-mono">
                      <span>📱 {member.mobile}</span>
                      {member.membership_number && (
                        <span>🆔 {member.membership_number}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categorized Positions: Zone, Cluster, Unit */}
                {member.positions.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      വഹിക്കുന്ന സ്ഥാനങ്ങൾ (Positions):
                    </p>

                    <div className="space-y-1.5">
                      {/* Zone Positions */}
                      {member.positions.filter(p => p.committee_level === 'zone').length > 0 && (
                        <div className="space-y-1">
                          {member.positions.filter(p => p.committee_level === 'zone').map((pos, idx) => (
                            <div
                              key={idx}
                              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <Award className="w-3.5 h-3.5 text-amber-400" />
                                <span>{pos.title}</span>
                              </div>
                              <span className="text-[10px] uppercase font-black bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded">
                                മേഖല (ZONE)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cluster Positions */}
                      {member.positions.filter(p => p.committee_level === 'cluster').length > 0 && (
                        <div className="space-y-1">
                          {member.positions.filter(p => p.committee_level === 'cluster').map((pos, idx) => (
                            <div
                              key={idx}
                              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/30 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <Award className="w-3.5 h-3.5 text-purple-400" />
                                <span>{pos.title} {pos.cluster_name ? `(${pos.cluster_name})` : ''}</span>
                              </div>
                              <span className="text-[10px] uppercase font-black bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                                ക്ലസ്റ്റർ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Unit Positions */}
                      {member.positions.filter(p => p.committee_level === 'unit').length > 0 && (
                        <div className="space-y-1">
                          {member.positions.filter(p => p.committee_level === 'unit').map((pos, idx) => (
                            <div
                              key={idx}
                              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-teal-500/20 text-teal-200 border border-teal-500/30 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <Award className="w-3.5 h-3.5 text-teal-400" />
                                <span>{pos.title} {pos.unit_name ? `(${pos.unit_name})` : ''}</span>
                              </div>
                              <span className="text-[10px] uppercase font-black bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded">
                                യൂണിറ്റ്
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Already marked vs Confirm button */}
                {alreadyMarked ? (
                  <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-3.5 text-center text-amber-200 space-y-0.5">
                    <p className="font-bold text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      ഹാജർ ഇതിനകം രേഖപ്പെടുത്തിയിട്ടുണ്ട്!
                    </p>
                    {markedTime && (
                      <p className="text-xs text-amber-300 opacity-80">
                        Marked at: {format(new Date(markedTime), 'hh:mm a, dd MMM')}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => confirmMutation.mutate(member.id)}
                    disabled={confirmMutation.isPending}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg rounded-xl shadow-xl shadow-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2 border border-emerald-300/30"
                  >
                    {confirmMutation.isPending ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span>ഹാജർ കൺഫോം ചെയ്യുക (CONFIRM)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Share Button */}
        <div className="pt-2">
          <button
            onClick={shareOnWhatsApp}
            className="w-full py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>വാട്‌സാപ്പിൽ ഈ മീറ്റിംഗ് ലിങ്ക് ഷെയർ ചെയ്യുക</span>
          </button>
        </div>

        {/* Admin Link at Bottom */}
        <div className="text-center pt-2">
          <Link
            to="/admin/login"
            className="text-xs text-slate-400 hover:text-white transition underline"
          >
            Admin Panel Login →
          </Link>
        </div>
      </div>
    </div>
  )
}

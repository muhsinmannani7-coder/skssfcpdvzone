import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Shield, CheckCircle, AlertCircle, Phone, Award,
  MapPin, Calendar, Clock, Share2, RefreshCw,
  Lock, Check, CheckCircle2, ChevronRight, Wifi, WifiOff,
  CloudUpload, LayoutList
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

interface QueuedItem {
  memberId: string
  fullName: string
  mobile: string
  timestamp: string
}

// Crisp Web Audio chime on success
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

    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.setValueAtTime(659.25, now + 0.08)
    osc.frequency.setValueAtTime(783.99, now + 0.16)
    osc.frequency.setValueAtTime(1046.50, now + 0.24)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.start(now)
    osc.stop(now + 0.6)
  } catch {
    // Audio context may be restricted before interaction
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
  const [successResult, setSuccessResult] = useState<{ name: string; offline?: boolean } | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [syncingQueue, setSyncingQueue] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for online/offline events for low-network handling
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 1. Fetch Program Info (by ID or find active)
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['public-program', programId || 'active'],
    queryFn: async () => {
      if (programId) {
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .eq('id', programId)
          .single()
        if (error) throw error
        return data as Program
      }

      // If no programId in URL, automatically fetch current live meeting
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Program | null
    },
    refetchInterval: 15000,
  })

  const activeProgramId = programId || program?.id

  // 2. Offline Queue Management
  const getQueueKey = useCallback(() => `skssf_offline_queue_${activeProgramId || 'default'}`, [activeProgramId])
  const getMarkedKey = useCallback(() => `skssf_marked_local_${activeProgramId || 'default'}`, [activeProgramId])

  const [pendingQueue, setPendingQueue] = useState<QueuedItem[]>(() => {
    try {
      const saved = localStorage.getItem(`skssf_offline_queue_${activeProgramId || 'default'}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Keep queue synced with localStorage
  useEffect(() => {
    if (!activeProgramId) return
    try {
      const saved = localStorage.getItem(getQueueKey())
      setPendingQueue(saved ? JSON.parse(saved) : [])
    } catch {
      setPendingQueue([])
    }
  }, [activeProgramId, getQueueKey])

  // 3. Pre-cache entire Member Directory in localStorage for 0ms Instant Lookups
  const { data: cachedMembers = [] } = useQuery({
    queryKey: ['members-offline-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq('is_active', true)

      if (!error && data) {
        try {
          localStorage.setItem('skssf_members_directory_cache', JSON.stringify(data))
        } catch {
          // ignore localStorage quota
        }
        return data
      }
      return []
    },
    initialData: () => {
      try {
        const saved = localStorage.getItem('skssf_members_directory_cache')
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  })

  // 4. Track marked attendee IDs (server + local offline marked)
  const { data: markedAttendeeIds = new Set<string>() } = useQuery({
    queryKey: ['public-marked-ids', activeProgramId],
    queryFn: async () => {
      if (!activeProgramId) return new Set<string>()
      const { data } = await supabase
        .from('attendance')
        .select('member_id')
        .eq('program_id', activeProgramId)
      const ids = new Set((data || []).map(r => r.member_id))

      // Also merge locally marked ids
      try {
        const local = JSON.parse(localStorage.getItem(getMarkedKey()) || '[]')
        local.forEach((id: string) => ids.add(id))
      } catch {
        // ignore
      }
      return ids
    },
    enabled: !!activeProgramId,
    refetchInterval: 10000,
  })

  // 5. Fetch live attendance count
  const { data: attendanceCount = 0 } = useQuery({
    queryKey: ['public-attendance-count', activeProgramId],
    queryFn: async () => {
      if (!activeProgramId) return 0
      const { count } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('program_id', activeProgramId)
      return (count ?? 0) + pendingQueue.length
    },
    enabled: !!activeProgramId,
    refetchInterval: 6000,
  })

  // 6. Background Queue Flusher (Syncs queued offline attendance to Supabase)
  const flushOfflineQueue = useCallback(async () => {
    if (!activeProgramId || !navigator.onLine || syncingQueue) return
    const queueKey = getQueueKey()
    let queue: QueuedItem[] = []
    try {
      queue = JSON.parse(localStorage.getItem(queueKey) || '[]')
    } catch {
      return
    }

    if (queue.length === 0) return

    setSyncingQueue(true)
    const remaining: QueuedItem[] = []

    for (const item of queue) {
      try {
        const { error } = await supabase
          .from('attendance')
          .insert({
            program_id: activeProgramId,
            member_id: item.memberId,
          })
        if (error && !error.message.includes('unique') && error.code !== '23505') {
          // Keep for next retry
          remaining.push(item)
        }
      } catch {
        remaining.push(item)
      }
    }

    try {
      localStorage.setItem(queueKey, JSON.stringify(remaining))
      setPendingQueue(remaining)
    } catch {
      // ignore
    }

    setSyncingQueue(false)
    qc.invalidateQueries({ queryKey: ['public-attendance-count', activeProgramId] })
    qc.invalidateQueries({ queryKey: ['public-marked-ids', activeProgramId] })
  }, [activeProgramId, getQueueKey, syncingQueue, qc])

  // Run queue sync every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      flushOfflineQueue()
    }, 5000)
    return () => clearInterval(interval)
  }, [flushOfflineQueue])

  // Helper to map positions
  interface RawMP {
    positions?: { title: string } | null
    committees?: { name: string; level: 'zone' | 'cluster' | 'unit' } | null
    clusters?: { name: string } | null
    units?: { name: string; clusters?: { name: string } | null } | null
  }

  const formatMemberData = (raw: {
    id: string
    full_name: string
    mobile: string
    membership_number?: string | null
    member_positions?: unknown
  }): MemberWithPositions => {
    const rawPositions = (raw.member_positions as RawMP[]) || []
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

    return {
      id: raw.id,
      full_name: raw.full_name,
      mobile: raw.mobile,
      membership_number: raw.membership_number,
      positions,
    }
  }

  // 7. Instant Member Search (Checks local cache first for 0ms response, then fallback to network)
  const handleSearchMember = async (mobileNumber: string) => {
    const clean = mobileNumber.trim().replace(/\D/g, '')
    if (clean.length < 10) return

    setSearching(true)
    setNotFound(false)
    setMember(null)
    setAlreadyMarked(null)

    // Check local cache first (Instant 0ms lookup!)
    const localMatch = cachedMembers.find((m: { mobile: string }) => m.mobile.replace(/\D/g, '') === clean)
    if (localMatch) {
      const formatted = formatMemberData(localMatch)
      setMember(formatted)
      const isMarked = markedAttendeeIds.has(formatted.id)
      setAlreadyMarked(isMarked)
      setSearching(false)
      return
    }

    // Fallback: network search if not in local cache
    try {
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

      const formatted = formatMemberData(memberData)
      setMember(formatted)

      if (activeProgramId) {
        const isMarked = markedAttendeeIds.has(formatted.id)
        if (isMarked) {
          setAlreadyMarked(true)
        } else {
          // Double check server directly
          const { data: existingAttendance } = await supabase
            .from('attendance')
            .select('marked_at')
            .eq('program_id', activeProgramId)
            .eq('member_id', formatted.id)
            .maybeSingle()

          if (existingAttendance) {
            setAlreadyMarked(true)
            setMarkedTime(existingAttendance.marked_at)
          } else {
            setAlreadyMarked(false)
          }
        }
      }
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

  // 8. Resilient Confirm Mutation (Optimistic + Offline Queue Fallback)
  const confirmMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!activeProgramId) throw new Error('Missing program ID')

      // Mark locally immediately in marked set to prevent double clicks
      markedAttendeeIds.add(memberId)
      try {
        const localMarkedKey = getMarkedKey()
        const localList = JSON.parse(localStorage.getItem(localMarkedKey) || '[]')
        if (!localList.includes(memberId)) {
          localList.push(memberId)
          localStorage.setItem(localMarkedKey, JSON.stringify(localList))
        }
      } catch {
        // ignore
      }

      // If offline or low network: save to queue directly
      if (!navigator.onLine) {
        const queueKey = getQueueKey()
        const currentQueue: QueuedItem[] = JSON.parse(localStorage.getItem(queueKey) || '[]')
        currentQueue.push({
          memberId,
          fullName: member?.full_name || 'Member',
          mobile: member?.mobile || '',
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(queueKey, JSON.stringify(currentQueue))
        setPendingQueue(currentQueue)
        return { success: true, offline: true }
      }

      // Online: Try Supabase insert with 3-second timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)

      try {
        // Fallback or direct insert
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            program_id: activeProgramId,
            member_id: memberId,
          })
          .select()
          .single()

        clearTimeout(timeoutId)

        if (error) {
          if (error.message.includes('unique') || error.code === '23505') {
            throw new Error('Already marked attendance for this meeting')
          }
          throw error
        }

        return { success: true, data, offline: false }
      } catch (err: unknown) {
        clearTimeout(timeoutId)
        const errorMsg = (err as Error)?.message || ''
        if (errorMsg.includes('Already marked')) {
          throw err
        }

        // On network timeout or network failure, queue offline safely
        const queueKey = getQueueKey()
        const currentQueue: QueuedItem[] = JSON.parse(localStorage.getItem(queueKey) || '[]')
        currentQueue.push({
          memberId,
          fullName: member?.full_name || 'Member',
          mobile: member?.mobile || '',
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(queueKey, JSON.stringify(currentQueue))
        setPendingQueue(currentQueue)
        return { success: true, offline: true }
      }
    },
    onSuccess: (result) => {
      playSuccessChime()
      setSuccessResult({
        name: member?.full_name || 'Member',
        offline: result?.offline ?? false,
      })
      qc.invalidateQueries({ queryKey: ['public-attendance-count', activeProgramId] })
      qc.invalidateQueries({ queryKey: ['public-marked-ids', activeProgramId] })

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

  // Share Public Board Link only (Never shares the desk entry link)
  const sharePublicBoardWhatsApp = () => {
    if (!program) return
    const boardUrl = `${window.location.origin}/board/${program.id}`
    const text = `*SKSSF ചപ്പാരപ്പടവ് മേഖല*\n📋 *ഹാജർ പട്ടിക (LIVE ATTENDANCE BOARD)*\n\n📌 *${program.name}*\n📍 ${program.venue}\n📅 ${format(new Date(program.program_date), 'dd MMM yyyy')}\n\n👉 ആരൊക്കെ ഹാജരായി എന്ന് തത്സമയം കാണാൻ താഴെ കാണുന്ന ലിങ്കിൽ ക്ലിക്ക് ചെയ്യുക:\n${boardUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (programLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">ലോഡിംഗ്... ദയവായി കാത്തിരിക്കുക</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center text-white space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">നിലവിൽ ലൈവ് മീറ്റിംഗ് ലഭ്യമല്ല</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            സജീവമായ മീറ്റിംഗുകൾ ഒന്നും കണ്ടെത്തിയില്ല. അഡ്മിൻ മീറ്റിംഗ് ആരംഭിച്ച് ലിങ്ക് നൽകിയ ശേഷം ഡെസ്കിൽ ഹാജർ രേഖപ്പെടുത്താവുന്നതാണ്.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-4 h-4" /> റീഫ്രഷ് ചെയ്യുക
            </button>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition w-full sm:w-auto justify-center"
            >
              <Lock className="w-4 h-4" /> Admin Login
            </Link>
          </div>
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

      <div className="relative w-full max-w-lg space-y-4 my-auto py-4">
        {/* Top Restricted Committee Header Banner */}
        <div className="bg-rose-950/80 border border-rose-500/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3 text-rose-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-rose-300 leading-tight">
                കമ്മിറ്റി രജിസ്ട്രേഷൻ ഡെസ്ക്
              </p>
              <p className="text-[11px] text-rose-200/80 mt-0.5">
                ഹാജർ രേഖപ്പെടുത്താൻ നിയോഗിച്ച വളണ്ടിയർമാർക്ക് മാത്രം
              </p>
            </div>
          </div>

          {/* Network Status Badge */}
          <div className="flex-shrink-0">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>ഓൺലൈൻ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40 animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>ഓഫ്‌ലൈൻ മോഡ്</span>
              </span>
            )}
          </div>
        </div>

        {/* Pending Sync Badge (If items queued offline) */}
        {pendingQueue.length > 0 && (
          <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-amber-200">
            <span className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-amber-400 animate-bounce" />
              <span><strong>{pendingQueue.length}</strong> ഹാജർ ഓഫ്‌ലൈനായി സേവ് ചെയ്തു.</span>
            </span>
            <button
              onClick={flushOfflineQueue}
              disabled={syncingQueue}
              className="text-[11px] font-bold underline hover:text-white"
            >
              {syncingQueue ? 'സിങ്ക് ചെയ്യുന്നു...' : 'ഇപ്പോൾ സിങ്ക് ചെയ്യുക'}
            </button>
          </div>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 mb-1 border border-emerald-400/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            SKSSF
          </h1>
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
            ചപ്പാരപ്പടവ് മേഖല മീറ്റിംഗ് ഹാജർ
          </p>
        </div>

        {/* Meeting Details Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            {program.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                🔴 ലൈവ് മീറ്റിംഗ്
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

          <h2 className="text-lg sm:text-xl font-bold text-white mt-2 leading-snug">
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
                <span>സമയം: {program.start_time}</span>
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
                ? 'ഹാജർ രേഖപ്പെടുത്തൽ ആരംഭിച്ചിട്ടില്ല'
                : 'ഹാജർ രേഖപ്പെടുത്തൽ പൂർത്തിയായി (Closed)'}
            </h3>
            <p className="text-sm text-slate-400">
              {program.status === 'upcoming'
                ? 'അഡ്മിൻ മീറ്റിംഗ് ആരംഭിച്ച ഉടൻ ഇവിടെ ഹാജർ രേഖപ്പെടുത്താം. ദയവായി കാത്തിരിക്കുക.'
                : 'ഈ മീറ്റിംഗിന്റെ സമയം അവസാനിച്ചു. പുതിയ ഹാജർ രേഖപ്പെടുത്താൻ കഴിയില്ല.'}
            </p>
          </div>
        ) : (
          /* Active Attendance Form */
          <div className="space-y-4">
            {/* SUCCESS BANNER */}
            {successResult && (
              <div className="bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl p-5 text-center text-white space-y-3 animate-scale-up shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/50">
                  <Check className="w-10 h-10 text-white stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-300">
                    ഹാജർ രേഖപ്പെടുത്തി!
                  </h3>
                  <p className="text-base font-semibold text-white mt-1">
                    {successResult.name}
                  </p>
                  {successResult.offline ? (
                    <p className="text-xs text-amber-300 font-medium mt-1">
                      (ഓഫ്‌ലൈനായി സേവ് ചെയ്തു. നെറ്റ്‌വർക്ക് ലഭിക്കുമ്പോൾ തനിയെ ക്ലൗഡിലേക്ക് അപ്‌ലോഡ് ആകും)
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-200 font-medium mt-1">
                      ക്ലൗഡിൽ തത്സമയം അപ്‌ഡേറ്റ് ആയി
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleResetForNext}
                    className="w-full py-3 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>അടുത്ത വ്യക്തിയുടെ നമ്പർ അടിക്കുക</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* MAIN INPUT CARD */}
            {!successResult && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>മൊബൈൽ നമ്പർ നൽകുക (Mobile Number)</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {mobile.length}/10
                    </span>
                  </label>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone className="w-5 h-5 text-emerald-400" />
                    </div>
                    <input
                      ref={inputRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      autoFocus
                      value={mobile}
                      onChange={e => handleMobileChange(e.target.value)}
                      placeholder="10 അക്ക മൊബൈൽ നമ്പർ"
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border-2 border-white/20 focus:border-emerald-400 rounded-xl text-xl sm:text-2xl font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                    />
                    {searching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* NOT FOUND ALERT */}
                {notFound && (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3.5 text-center text-red-200 text-xs space-y-1 animate-shake">
                    <p className="font-bold">ഈ നമ്പറിലുള്ള വ്യക്തിയെ കണ്ടെത്തിയില്ല!</p>
                    <p className="text-slate-300 text-[11px]">
                      ദയവായി നമ്പർ ശരിയാണോ എന്ന് പരിശോധിക്കുക. പേര് മെമ്പർഷിപ്പ് ലിസ്റ്റിൽ ഉണ്ടെന്ന് ഉറപ്പുവരുത്തുക.
                    </p>
                  </div>
                )}

                {/* MEMBER DETAILS CARD */}
                {member && (
                  <div className="bg-gradient-to-br from-white/15 to-white/5 border-2 border-emerald-400/50 rounded-2xl p-4 sm:p-5 space-y-4 animate-scale-up">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                          അംഗത്തിന്റെ വിവരങ്ങൾ
                        </span>
                        <h3 className="text-xl font-black text-white leading-tight">
                          {member.full_name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 font-mono">
                          📱 {member.mobile}
                        </p>
                      </div>

                      {member.membership_number && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            മെമ്പർഷിപ്പ്
                          </span>
                          <p className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                            {member.membership_number}
                          </p>
                        </div>
                      )}
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
          </div>
        )}

        {/* View Public Board Option (Safe for everyone) */}
        <div className="pt-2 space-y-2">
          <a
            href={`/board/${program.id}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <LayoutList className="w-4 h-4 text-emerald-400" />
            <span>തത്സമയ ഹാജർ പട്ടിക കാണുക (View Attendance Board)</span>
          </a>

          <button
            onClick={sharePublicBoardWhatsApp}
            className="w-full py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>ഹാജർ പട്ടിക ബോർഡ് WhatsApp ൽ ഷെയർ ചെയ്യുക</span>
          </button>
        </div>

        {/* Admin Link at Bottom */}
        <div className="text-center pt-2">
          <Link
            to="/admin/login"
            className="text-xs text-slate-500 hover:text-slate-300 transition underline"
          >
            Admin Panel Login →
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Shield, CheckCircle, AlertCircle, Phone, Award,
  MapPin, Calendar, Clock, Share2, RefreshCw,
  Lock, Check, CheckCircle2, Wifi, WifiOff,
  CloudUpload, LayoutList, Building2, Users, Search, X,
  ArrowRight, ChevronDown, CheckCheck, Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { STATIC_DIRECTORY } from '@/data/staticDirectory'

// Official WhatsApp Logo Component
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}


// Malayalam Translations for Clusters
const CLUSTER_MALAYALAM: Record<string, string> = {
  'PADAPPENGAD CLUSTER': 'പടപ്പേങ്ങാട് ക്ലസ്റ്റർ',
  'KUTTAPARAMB CLUSTER': 'കുട്ടപ്പറമ്പ് ക്ലസ്റ്റർ',
  'PERUMALABAD CLUSTER': 'പെരുമാളാബാദ് ക്ലസ്റ്റർ',
  'PAD': 'പടപ്പേങ്ങാട്',
  'KUT': 'കുട്ടപ്പറമ്പ്',
  'PER': 'പെരുമാളാബാദ്',
}

// Office Bearer Position Config with Malayalam & Styling
const POSITION_CONFIG: Record<string, { ml: string; badge: string; icon: string }> = {
  'PRESIDENT': {
    ml: 'പ്രസിഡന്റ്',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: '👑',
  },
  'GENERAL SECRETARY': {
    ml: 'ജനറൽ സെക്രട്ടറി',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: '⚡',
  },
  'TREASURER': {
    ml: 'ട്രഷറർ',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: '💼',
  },
  'WORKING SECRETARY': {
    ml: 'വർക്കിംഗ് സെക്രട്ടറി',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: '📝',
  },
}

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

interface SuccessInfo {
  member: {
    id: string
    full_name: string
    mobile: string
    membership_number?: string | null
    positionTitle?: string
    unitName?: string
    clusterName?: string
  }
  markedTime: string
  offline: boolean
}

interface RawMP {
  id?: string
  unit_id?: string | null
  cluster_id?: string | null
  positions?: unknown
  committees?: unknown
  clusters?: unknown
  units?: unknown
}

const getTitle = (p: unknown): string => {
  if (!p) return 'Member'
  if (Array.isArray(p)) return p[0]?.title || 'Member'
  return (p as { title?: string }).title || 'Member'
}

const getSortOrder = (p: unknown): number => {
  if (!p) return 99
  if (Array.isArray(p)) return p[0]?.sort_order ?? 99
  return (p as { sort_order?: number }).sort_order ?? 99
}

const getCommitteeName = (c: unknown): string => {
  if (!c) return ''
  if (Array.isArray(c)) return c[0]?.name || ''
  return (c as { name?: string }).name || ''
}

const getCommitteeLevel = (c: unknown): 'zone' | 'cluster' | 'unit' => {
  if (!c) return 'unit'
  if (Array.isArray(c)) return (c[0]?.level as 'zone' | 'cluster' | 'unit') || 'unit'
  return (c as { level?: 'zone' | 'cluster' | 'unit' }).level || 'unit'
}

const getClusterName = (cl: unknown, u: unknown): string | undefined => {
  if (cl) {
    if (Array.isArray(cl) && cl[0]?.name) return cl[0].name
    if ((cl as { name?: string })?.name) return (cl as { name?: string }).name
  }
  if (u) {
    const unitObj = Array.isArray(u) ? u[0] : (u as { clusters?: { name?: string } | Array<{ name?: string }> })
    if (unitObj?.clusters) {
      if (Array.isArray(unitObj.clusters)) return unitObj.clusters[0]?.name
      return (unitObj.clusters as { name?: string }).name
    }
  }
  return undefined
}

const getUnitName = (u: unknown): string | undefined => {
  if (!u) return undefined
  if (Array.isArray(u)) return u[0]?.name
  return (u as { name?: string })?.name
}

interface RawMember {
  id: string
  full_name: string
  mobile: string
  membership_number?: string | null
  member_positions?: RawMP[]
}

interface RawUnit {
  id: string
  name: string
  cluster_id: string
  sort_order: number
}

interface RawCluster {
  id: string
  name: string
  code: string
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

  // Mode Selection: 'mobile' (number entry) or 'unit' (16 units & clusters)
  const [entryMode, setEntryMode] = useState<'mobile' | 'unit'>('mobile')

  // Mobile mode state
  const [mobile, setMobile] = useState('')
  const [searching, setSearching] = useState(false)
  const [member, setMember] = useState<MemberWithPositions | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [alreadyMarked, setAlreadyMarked] = useState<boolean | null>(null)
  const [markedTime, setMarkedTime] = useState<string | null>(null)

  // Unit mode state
  const [selectedClusterId, setSelectedClusterId] = useState<string>('all')
  const [clusterViewMode, setClusterViewMode] = useState<'units' | 'leaders'>('units')
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [unitSearch, setUnitSearch] = useState<string>('')
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState<boolean>(false)

  // Success state with WhatsApp flow
  const [successResult, setSuccessResult] = useState<SuccessInfo | null>(null)
  const [whatsAppSent, setWhatsAppSent] = useState<boolean>(false)

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [syncingQueue, setSyncingQueue] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Listen for online/offline events
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  // 3. Pre-cache Entire Hierarchy Directory (Clusters, Units, Members) for 0ms Instant Response
  const { data: directoryData = STATIC_DIRECTORY as unknown as {
    clusters: RawCluster[]
    units: RawUnit[]
    members: RawMember[]
  } } = useQuery<{
    clusters: RawCluster[]
    units: RawUnit[]
    members: RawMember[]
  }>({
    queryKey: ['public-full-directory'],
    queryFn: async () => {
      const [clustersRes, unitsRes, membersRes] = await Promise.all([
        supabase.from('clusters').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('units').select('id, name, cluster_id, sort_order').eq('is_active', true).order('sort_order'),
        supabase.from('members').select(`
          id, full_name, mobile, membership_number,
          member_positions (
            id, unit_id, cluster_id,
            positions (id, title, sort_order),
            committees (id, name, level),
            clusters (id, name, code),
            units (id, name, cluster_id)
          )
        `).eq('is_active', true)
      ])

      const result = {
        clusters: (clustersRes.data && clustersRes.data.length > 0 ? clustersRes.data : STATIC_DIRECTORY.clusters) as RawCluster[],
        units: (unitsRes.data && unitsRes.data.length > 0 ? unitsRes.data : STATIC_DIRECTORY.units) as RawUnit[],
        members: (membersRes.data && membersRes.data.length > 0 ? membersRes.data : STATIC_DIRECTORY.members) as unknown as RawMember[],
      }

      try {
        localStorage.setItem('skssf_full_directory_cache', JSON.stringify(result))
      } catch {
        // ignore storage quota
      }

      return result
    },
    initialData: () => {
      try {
        const saved = localStorage.getItem('skssf_full_directory_cache')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed?.units?.length > 0 && parsed?.members?.length > 0) {
            return parsed
          }
        }
      } catch {
        // ignore storage error
      }
      return STATIC_DIRECTORY as unknown as {
        clusters: RawCluster[]
        units: RawUnit[]
        members: RawMember[]
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    refetchOnMount: true,
  })

  // Auto-select first unit when directory loads
  useEffect(() => {
    if (directoryData.units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(directoryData.units[0].id)
    }
  }, [directoryData.units, selectedUnitId])

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
    refetchInterval: 8000,
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

  useEffect(() => {
    const interval = setInterval(() => {
      flushOfflineQueue()
    }, 5000)
    return () => clearInterval(interval)
  }, [flushOfflineQueue])

  // Helper to map positions from raw member data
  const formatMemberData = useCallback((raw: RawMember): MemberWithPositions => {
    const rawPositions = (raw.member_positions as RawMP[]) || []
    const positions = rawPositions.map(mp => {
      const level = getCommitteeLevel(mp.committees)
      const clusterName = getClusterName(mp.clusters, mp.units)
      return {
        title: getTitle(mp.positions),
        committee_name: getCommitteeName(mp.committees),
        committee_level: level,
        unit_name: getUnitName(mp.units),
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
  }, [])

  // 7. Instant Member Search by Mobile (0ms Local directory cache lookup)
  const handleSearchMember = async (mobileNumber: string) => {
    const clean = mobileNumber.trim().replace(/\D/g, '')
    if (clean.length < 10) return

    setSearching(true)
    setNotFound(false)
    setMember(null)
    setAlreadyMarked(null)

    // Check directory cache first (Instant 0ms lookup!)
    const localMatch = directoryData.members.find(m => m.mobile.replace(/\D/g, '') === clean)
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

      const formatted = formatMemberData(memberData as unknown as RawMember)
      setMember(formatted)

      if (activeProgramId) {
        const isMarked = markedAttendeeIds.has(formatted.id)
        if (isMarked) {
          setAlreadyMarked(true)
        } else {
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
  interface ConfirmPayload {
    member: {
      id: string
      full_name: string
      mobile: string
      membership_number?: string | null
      positionTitle?: string
      unitName?: string
      clusterName?: string
    }
  }

  const confirmMutation = useMutation({
    mutationFn: async ({ member: target }: ConfirmPayload) => {
      if (!activeProgramId) throw new Error('Missing program ID')
      const memberId = target.id

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
          fullName: target.full_name || 'Member',
          mobile: target.mobile || '',
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(queueKey, JSON.stringify(currentQueue))
        setPendingQueue(currentQueue)
        return { success: true, offline: true, member: target }
      }

      // Online: Try Supabase insert with 3.5s timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)

      try {
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

        return { success: true, data, offline: false, member: target }
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
          fullName: target.full_name || 'Member',
          mobile: target.mobile || '',
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(queueKey, JSON.stringify(currentQueue))
        setPendingQueue(currentQueue)
        return { success: true, offline: true, member: target }
      }
    },
    onSuccess: (result, variables) => {
      playSuccessChime()
      setWhatsAppSent(false)
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

      setSuccessResult({
        member: variables.member,
        markedTime: nowStr,
        offline: result?.offline ?? false,
      })

      qc.invalidateQueries({ queryKey: ['public-attendance-count', activeProgramId] })
      qc.invalidateQueries({ queryKey: ['public-marked-ids', activeProgramId] })
    },
  })

  // WhatsApp Thank You Message Action
  const sendWhatsAppThankYou = (info: SuccessInfo['member'], markedAtTime?: string) => {
    if (!program) return

    const clean = info.mobile.replace(/\D/g, '')
    const phone = clean.length === 10 ? `91${clean}` : clean

    const dateFormatted = format(new Date(program.program_date), 'dd MMMM yyyy')
    const timeFormatted = program.start_time || markedAtTime || ''

    const lines = [
      `*SKSSF ചപ്പാരപ്പടവ് മേഖല*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `പ്രിയ *${info.full_name}*, 🌹`,
      info.membership_number ? `🆔 മെമ്പർഷിപ്പ് നമ്പർ: *${info.membership_number}*` : null,
      info.positionTitle ? `📋 സ്ഥാനം: *${info.positionTitle}*` : null,
      ``,
      `ഇന്ന് നടന്ന *${program.name}* മീറ്റിംഗിൽ പങ്കെടുത്തതിന് ഹൃദയം നിറഞ്ഞ നന്ദി രേഖപ്പെടുത്തുന്നു.`,
      ``,
      `📅 *തീയതി:* ${dateFormatted}`,
      timeFormatted ? `⏰ *സമയം:* ${timeFormatted}` : null,
      program.venue ? `📍 *സ്ഥലം:* ${program.venue}` : null,
      markedAtTime ? `\n_ഹാജർ രേഖപ്പെടുത്തിയ സമയം: ${markedAtTime}_` : null,
      ``,
      `_"വിദ്യാർത്ഥി നന്മ, സമൂഹ പുരോഗതി"_`,
      `*SKSSF ചപ്പാരപ്പടവ് മേഖല കമ്മിറ്റി*`,
      `━━━━━━━━━━━━━━━━━━━━`
    ].filter(line => line !== null).join('\n')

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`
    window.open(url, '_blank')
    setWhatsAppSent(true)
  }

  // Reset desk for next attendee (Dismisses success modal)
  const handleResetForNext = () => {
    setSuccessResult(null)
    setWhatsAppSent(false)
    setMember(null)
    setMobile('')
    setNotFound(false)
    setAlreadyMarked(null)

    if (entryMode === 'mobile') {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 60)
    }
  }

  // Filter units based on selected cluster
  const filteredUnits = useMemo(() => {
    if (!directoryData.units) return []
    let list = directoryData.units
    if (selectedClusterId !== 'all') {
      list = list.filter(u => u.cluster_id === selectedClusterId)
    }
    if (unitSearch.trim()) {
      const q = unitSearch.trim().toLowerCase()
      list = list.filter(u => u.name.toLowerCase().includes(q))
    }
    return list
  }, [directoryData.units, selectedClusterId, unitSearch])

  // Get current active unit
  const activeUnit = useMemo(() => {
    return directoryData.units.find(u => u.id === selectedUnitId) || filteredUnits[0] || directoryData.units[0] || null
  }, [directoryData.units, selectedUnitId, filteredUnits])

  // Get 4 leaders of a unit
  const getUnitLeaders = useCallback((unitId: string) => {
    if (!directoryData?.members) return []
    const unitObj = directoryData.units.find(u => u.id === unitId)
    const clusterObj = directoryData.clusters.find(c => c.id === unitObj?.cluster_id)

    const list: Array<{
      member: {
        id: string
        full_name: string
        mobile: string
        membership_number?: string | null
      }
      position: {
        title: string
        sort_order: number
      }
      unitName?: string
      clusterName?: string
    }> = []

    for (const m of directoryData.members) {
      for (const mp of (m.member_positions || [])) {
        if (mp.unit_id === unitId) {
          list.push({
            member: {
              id: m.id,
              full_name: m.full_name,
              mobile: m.mobile,
              membership_number: m.membership_number,
            },
            position: {
              title: getTitle(mp.positions),
              sort_order: getSortOrder(mp.positions),
            },
            unitName: unitObj?.name,
            clusterName: clusterObj?.name,
          })
        }
      }
    }

    return list.sort((a, b) => a.position.sort_order - b.position.sort_order)
  }, [directoryData])

  // Get 4 leaders of a cluster
  const getClusterLeaders = useCallback((clusterId: string) => {
    if (!directoryData?.members) return []
    const clusterObj = directoryData.clusters.find(c => c.id === clusterId)

    const list: Array<{
      member: {
        id: string
        full_name: string
        mobile: string
        membership_number?: string | null
      }
      position: {
        title: string
        sort_order: number
      }
      clusterName?: string
    }> = []

    for (const m of directoryData.members) {
      for (const mp of (m.member_positions || [])) {
        const commLevel = getCommitteeLevel(mp.committees)
        if (mp.cluster_id === clusterId && (!mp.unit_id || commLevel === 'cluster')) {
          list.push({
            member: {
              id: m.id,
              full_name: m.full_name,
              mobile: m.mobile,
              membership_number: m.membership_number,
            },
            position: {
              title: getTitle(mp.positions),
              sort_order: getSortOrder(mp.positions),
            },
            clusterName: clusterObj?.name,
          })
        }
      }
    }

    return list.sort((a, b) => a.position.sort_order - b.position.sort_order)
  }, [directoryData])

  // Count attendance for a specific unit
  const getUnitAttendanceCount = useCallback((unitId: string) => {
    const leaders = getUnitLeaders(unitId)
    const present = leaders.filter(l => markedAttendeeIds.has(l.member.id)).length
    return { present, total: leaders.length }
  }, [getUnitLeaders, markedAttendeeIds])

  // Share Public Board Link only (Never shares the desk entry link)
  const sharePublicBoardWhatsApp = () => {
    if (!program) return
    const boardUrl = `${window.location.origin}/board/${program.id}`
    const text = `*SKSSF ചപ്പാരപ്പടവ് മേഖല*\n📋 *ഹാജർ പട്ടിക (LIVE ATTENDANCE BOARD)*\n\n📌 *${program.name}*\n📍 ${program.venue}\n📅 ${format(new Date(program.program_date), 'dd MMM yyyy')}\n\n👉 ആരൊക്കെ ഹാജരായി എന്ന് തത്സമയം കാണാൻ താഴെ കാണുന്ന ലിങ്കിൽ ക്ലിക്ക് ചെയ്യുക:\n${boardUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (programLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">ലോഡിംഗ്... ദയവായി കാത്തിരിക്കുക</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center text-white space-y-4 shadow-2xl">
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition w-full sm:w-auto justify-center border border-slate-700"
            >
              <Lock className="w-4 h-4" /> Admin Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Active unit leaders list
  const currentUnitLeaders = activeUnit ? getUnitLeaders(activeUnit.id) : []
  const currentClusterLeaders = selectedClusterId !== 'all' ? getClusterLeaders(selectedClusterId) : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col items-center justify-start p-3 sm:p-6">
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-4 my-auto py-2 sm:py-4">
        {/* Top Header Banner */}
        <div className="bg-rose-950/80 border border-rose-500/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3 text-rose-200 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="truncate">
              <p className="text-xs font-black uppercase tracking-wider text-rose-300 leading-tight">
                കമ്മിറ്റി രജിസ്ട്രേഷൻ ഡെസ്ക്
              </p>
              <p className="text-[11px] text-rose-200/80 mt-0.5 truncate">
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
                <span>ഓഫ്‌ലൈൻ</span>
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

            <span className="text-xs font-semibold text-slate-300 bg-black/40 px-3 py-1 rounded-full border border-white/10">
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

        {/* If Meeting Not Active */}
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
          /* ACTIVE ATTENDANCE SYSTEM */
          <div className="space-y-4">
            {/* 1. SUCCESS & WHATSAPP CONFIRMATION VIEW (When an attendee is marked) */}
            {successResult ? (
              <div className="bg-gradient-to-br from-emerald-950/90 via-slate-900/90 to-teal-950/90 border-2 border-emerald-400 rounded-3xl p-5 sm:p-6 text-white space-y-4 animate-scale-up shadow-2xl backdrop-blur-xl">
                {/* Top Success Badge */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/40 ring-4 ring-emerald-400/20 animate-bounce">
                    <Check className="w-10 h-10 text-white stroke-[3.5]" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      <Sparkles className="w-3.5 h-3.5" />
                      ഹാജർ രേഖപ്പെടുത്തി!
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5 leading-tight">
                      {successResult.member.full_name}
                    </h3>
                    {successResult.member.positionTitle && (
                      <p className="text-xs font-bold text-emerald-300 mt-0.5">
                        {successResult.member.positionTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attendee & Program Details Card */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400 font-medium">മെമ്പർഷിപ്പ് നമ്പർ:</span>
                    <span className="font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {successResult.member.membership_number || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-slate-400 font-medium">മൊബൈൽ നമ്പർ:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      📱 {successResult.member.mobile}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">ഹാജരായ സമയം:</span>
                    <span className="text-slate-200 font-semibold">
                      ⏰ {successResult.markedTime}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Message Action Box */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#25D366]/20 flex items-center justify-center flex-shrink-0 text-[#25D366] mt-0.5">
                      <WhatsAppIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                        WhatsApp നന്ദി സന്ദേശം
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        മീറ്റിംഗിൽ പങ്കെടുത്തതിന് നന്ദി അറിയിച്ചുകൊണ്ടുള്ള മെസ്സേജ് അംഗത്തിന്റെ WhatsApp ലേക്ക് ഇപ്പോൾ അയക്കാം:
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp Action Button */}
                  <button
                    onClick={() => sendWhatsAppThankYou(successResult.member, successResult.markedTime)}
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-black text-sm rounded-xl shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2.5 transition-all"
                  >
                    <WhatsAppIcon className="w-5 h-5 fill-current" />
                    <span>WhatsApp ൽ നന്ദി സന്ദേശം അയക്കുക</span>
                  </button>

                  {/* Feedback after clicking send */}
                  {whatsAppSent && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl py-2 px-3 text-center text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5 animate-fade-in">
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                      <span>WhatsApp തുറന്നു! സന്ദേശം അയക്കാവുന്നതാണ്.</span>
                    </div>
                  )}
                </div>

                {/* Skip / Next Person Button (വേണമെങ്കിൽ സ്കിപ്പ് ചെയ്യാം / അടുത്ത ആൾ) */}
                <div className="pt-1">
                  <button
                    onClick={handleResetForNext}
                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white font-bold text-sm rounded-xl border border-white/15 flex items-center justify-center gap-2 transition"
                  >
                    <span>{whatsAppSent ? 'അടുത്ത ആളുടെ ഹാജർ രേഖപ്പെടുത്തുക' : 'ഒഴിവാക്കുക / അടുത്ത ആൾ (Skip / Next)'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            ) : (
              /* 2. MAIN ATTENDANCE ENTRY FORM */
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
                {/* 2A. SEGMENTED TABS: Mobile Number vs Unit / Cluster */}
                <div>
                  <div className="grid grid-cols-2 p-1 bg-black/50 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setEntryMode('mobile')}
                      className={clsx(
                        'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all',
                        entryMode === 'mobile'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/30'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>മൊബൈൽ നമ്പർ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntryMode('unit')}
                      className={clsx(
                        'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all',
                        entryMode === 'unit'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/30'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>യൂണിറ്റ് / ക്ലസ്റ്റർ (16)</span>
                    </button>
                  </div>
                </div>

                {/* 2B. MODE 1: MOBILE NUMBER ENTRY */}
                {entryMode === 'mobile' && (
                  <div className="space-y-4 animate-fade-in">
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
                          className="w-full pl-12 pr-4 py-4 bg-black/40 border-2 border-white/20 focus:border-emerald-400 rounded-2xl text-xl sm:text-2xl font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
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
                      <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 text-center text-red-200 text-xs space-y-1 animate-shake">
                        <p className="font-bold text-sm">ഈ നമ്പറിലുള്ള വ്യക്തിയെ കണ്ടെത്തിയില്ല!</p>
                        <p className="text-slate-300 text-[11px]">
                          ദയവായി നമ്പർ ശരിയാണോ എന്ന് പരിശോധിക്കുക, അല്ലെങ്കിൽ &quot;യൂണിറ്റ് / ക്ലസ്റ്റർ&quot; ഓപ്ഷൻ വഴി പേര് തിരഞ്ഞെടുക്കുക.
                        </p>
                      </div>
                    )}

                    {/* MEMBER CARD */}
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

                        {/* Positions List */}
                        {member.positions.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-white/10">
                            {member.positions.map((pos, idx) => (
                              <div
                                key={idx}
                                className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-white/10 text-slate-200 border border-white/15 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{pos.title} {pos.unit_name ? `(${pos.unit_name})` : pos.cluster_name ? `(${pos.cluster_name})` : ''}</span>
                                </div>
                                <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                                  {pos.committee_level}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Already marked vs Confirm button */}
                        {alreadyMarked ? (
                          <div className="space-y-2">
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

                            {/* WhatsApp send button for already marked member */}
                            <button
                              onClick={() => sendWhatsAppThankYou({
                                id: member.id,
                                full_name: member.full_name,
                                mobile: member.mobile,
                                membership_number: member.membership_number,
                                positionTitle: member.positions[0]?.title || 'മെമ്പർ',
                              })}
                              className="w-full py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                            >
                              <WhatsAppIcon className="w-4 h-4 fill-current" />
                              <span>WhatsApp നന്ദി സന്ദേശം അയക്കുക</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => confirmMutation.mutate({
                              member: {
                                id: member.id,
                                full_name: member.full_name,
                                mobile: member.mobile,
                                membership_number: member.membership_number,
                                positionTitle: member.positions[0]?.title ? `${member.positions[0].title} - ${member.positions[0].unit_name || member.positions[0].cluster_name || 'മേഖല'}` : 'മെമ്പർ',
                              }
                            })}
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

                {/* 2C. MODE 2: UNIT & CLUSTER SELECTION (16 Units & Cluster Committees) */}
                {entryMode === 'unit' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Cluster Filter Buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                          1. ക്ലസ്റ്റർ തിരഞ്ഞെടുക്കുക (Cluster)
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClusterId('all')
                            setClusterViewMode('units')
                          }}
                          className={clsx(
                            'py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center border',
                            selectedClusterId === 'all'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                          )}
                        >
                          എല്ലാം (16)
                        </button>

                        {directoryData.clusters.map(cl => (
                          <button
                            key={cl.id}
                            type="button"
                            onClick={() => {
                              setSelectedClusterId(cl.id)
                              // Auto select first unit in this cluster
                              const firstUnit = directoryData.units.find(u => u.cluster_id === cl.id)
                              if (firstUnit) setSelectedUnitId(firstUnit.id)
                            }}
                            className={clsx(
                              'py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center border truncate',
                              selectedClusterId === cl.id
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            )}
                            title={cl.name}
                          >
                            {CLUSTER_MALAYALAM[cl.code] || cl.name.replace(' CLUSTER', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* If a specific cluster is selected: Option to view Cluster Officers or Unit Committees */}
                    {selectedClusterId !== 'all' && (
                      <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => setClusterViewMode('units')}
                          className={clsx(
                            'flex-1 py-1.5 rounded-lg font-bold transition',
                            clusterViewMode === 'units'
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : 'text-slate-400 hover:text-white'
                          )}
                        >
                          🏢 യൂണിറ്റുകൾ
                        </button>
                        <button
                          type="button"
                          onClick={() => setClusterViewMode('leaders')}
                          className={clsx(
                            'flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5',
                            clusterViewMode === 'leaders'
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : 'text-slate-400 hover:text-white'
                          )}
                        >
                          👑 ക്ലസ്റ്റർ ഭാരവാഹികൾ (4)
                        </button>
                      </div>
                    )}

                    {/* VIEW A: CLUSTER LEADERS (When 'leaders' tab is selected) */}
                    {selectedClusterId !== 'all' && clusterViewMode === 'leaders' && (
                      <div className="space-y-3 pt-1">
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
                          <span className="text-xs font-black text-amber-300 uppercase">
                            {directoryData.clusters.find(c => c.id === selectedClusterId)?.name} ഭാരവാഹികൾ
                          </span>
                          <span className="text-[11px] font-bold text-amber-200">
                            4 പേർ
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {currentClusterLeaders.map(({ member: lMember, position }) => {
                            const isMarked = markedAttendeeIds.has(lMember.id)
                            const posCfg = POSITION_CONFIG[position.title] || {
                              ml: position.title,
                              badge: 'bg-white/10 text-slate-200 border-white/20',
                              icon: '🎖️',
                            }

                            return (
                              <div
                                key={lMember.id}
                                className={clsx(
                                  'p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                                  isMarked
                                    ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm'
                                    : 'bg-black/40 border-white/10 hover:border-emerald-400/50 hover:bg-black/60 shadow-md'
                                )}
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={clsx('text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1', posCfg.badge)}>
                                      <span>{posCfg.icon}</span>
                                      <span>{posCfg.ml}</span>
                                    </span>
                                    {lMember.membership_number && (
                                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                                        ID: {lMember.membership_number}
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-base font-black text-white truncate">
                                    {lMember.full_name}
                                  </h4>

                                  <p className="text-xs text-slate-400 font-mono">
                                    📱 {lMember.mobile}
                                  </p>
                                </div>

                                <div className="flex-shrink-0 flex items-center gap-2">
                                  {isMarked ? (
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>ഹാജരായി</span>
                                      </span>
                                      <button
                                        onClick={() => sendWhatsAppThankYou({
                                          id: lMember.id,
                                          full_name: lMember.full_name,
                                          mobile: lMember.mobile,
                                          membership_number: lMember.membership_number,
                                          positionTitle: `${posCfg.ml} - ക്ലസ്റ്റർ`,
                                        })}
                                        title="WhatsApp നന്ദി സന്ദേശം അയക്കുക"
                                        className="p-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 transition"
                                      >
                                        <WhatsAppIcon className="w-4 h-4 fill-current" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => confirmMutation.mutate({
                                        member: {
                                          id: lMember.id,
                                          full_name: lMember.full_name,
                                          mobile: lMember.mobile,
                                          membership_number: lMember.membership_number,
                                          positionTitle: `${posCfg.ml} - ${directoryData.clusters.find(c => c.id === selectedClusterId)?.name || 'ക്ലസ്റ്റർ'}`,
                                        }
                                      })}
                                      disabled={confirmMutation.isPending}
                                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-400/30"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>ഹാജർ രേഖപ്പെടുത്തുക</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* VIEW B: 16 UNITS SELECTOR & UNIT LEADERS */}
                    {clusterViewMode === 'units' && (
                      <div className="space-y-4">
                        {/* 16 Units Selection Dropdown Box */}
                        <div ref={dropdownRef} className="relative">
                          <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                            2. 16 യൂണിറ്റുകളിൽ ഒന്ന് തിരഞ്ഞെടുക്കുക (Select Unit)
                          </label>

                          {/* Selected Unit Box Trigger */}
                          <button
                            type="button"
                            onClick={() => setIsUnitDropdownOpen(prev => !prev)}
                            className="w-full p-3.5 bg-black/40 border-2 border-white/20 hover:border-emerald-400/60 rounded-2xl flex items-center justify-between text-left transition shadow-inner group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                                {activeUnit ? 'SELECTED UNIT' : 'SELECT UNIT'}
                              </span>
                              <h3 className="text-base sm:text-lg font-black text-white truncate">
                                {activeUnit ? activeUnit.name : 'Select Unit from List'}
                              </h3>
                              {activeUnit && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {getUnitAttendanceCount(activeUnit.id).present} / 4 ഭാരവാഹികൾ ഹാജരായി
                                </p>
                              )}
                            </div>

                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 group-hover:text-emerald-300 flex-shrink-0 transition">
                              <ChevronDown className={clsx('w-5 h-5 transition-transform duration-200', isUnitDropdownOpen && 'rotate-180')} />
                            </div>
                          </button>

                          {/* Searchable Dropdown Menu */}
                          {isUnitDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border-2 border-emerald-500/40 rounded-2xl p-2.5 shadow-2xl z-40 backdrop-blur-2xl max-h-80 overflow-y-auto animate-scale-up space-y-2">
                              {/* Search Box inside Dropdown */}
                              <div className="relative">
                                <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={unitSearch}
                                  onChange={e => setUnitSearch(e.target.value)}
                                  placeholder="യൂണിറ്റ് സെർച്ച് ചെയ്യുക (Search unit)..."
                                  className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                                  autoFocus
                                />
                                {unitSearch && (
                                  <button
                                    onClick={() => setUnitSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Unit list */}
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {filteredUnits.map(unit => {
                                  const stats = getUnitAttendanceCount(unit.id)
                                  const isSelected = activeUnit?.id === unit.id
                                  const clusterObj = directoryData.clusters.find(c => c.id === unit.cluster_id)

                                  return (
                                    <button
                                      key={unit.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedUnitId(unit.id)
                                        setIsUnitDropdownOpen(false)
                                        setUnitSearch('')
                                      }}
                                      className={clsx(
                                        'w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-2 border',
                                        isSelected
                                          ? 'bg-emerald-600/30 border-emerald-400 text-white'
                                          : 'bg-white/5 border-transparent text-slate-200 hover:bg-white/10'
                                      )}
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-black text-white truncate">
                                            {unit.name}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                                          {clusterObj?.name || 'ക്ലസ്റ്റർ'}
                                        </span>
                                      </div>

                                      <div className="flex-shrink-0 text-right">
                                        <span className={clsx(
                                          'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                                          stats.present === 4
                                            ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                                            : stats.present > 0
                                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                                            : 'bg-white/5 text-slate-400 border-white/10'
                                        )}>
                                          {stats.present}/4 Marked
                                        </span>
                                      </div>
                                    </button>
                                  )
                                })}

                                {filteredUnits.length === 0 && (
                                  <div className="p-4 text-center text-xs text-slate-400">
                                    യൂണിറ്റുകൾ ഒന്നും കണ്ടെത്തിയില്ല
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Unit Chips under Selected Cluster */}
                        {directoryData.units.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                            {(selectedClusterId === 'all'
                              ? directoryData.units
                              : directoryData.units.filter(u => u.cluster_id === selectedClusterId)
                            ).map(u => {
                              const isSelected = activeUnit?.id === u.id
                              const count = getUnitAttendanceCount(u.id)
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => setSelectedUnitId(u.id)}
                                  className={clsx(
                                    'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border flex items-center gap-1.5 flex-shrink-0',
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60'
                                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                  )}
                                >
                                  <span>{u.name.replace(' UNIT', '')}</span>
                                  {count.present > 0 && (
                                    <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.2 rounded-full text-emerald-300">
                                      {count.present}/4
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* THE 4 LEADERS OF THE SELECTED UNIT */}
                        {activeUnit && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between pb-1 border-b border-white/10">
                              <span className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                <span>{activeUnit.name} - ഭാരവാഹികൾ (4 പേർ)</span>
                              </span>
                              <span className="text-xs font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                                {getUnitAttendanceCount(activeUnit.id).present} / 4 ഹാജരായി
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {currentUnitLeaders.map(({ member: lMember, position }) => {
                                const isMarked = markedAttendeeIds.has(lMember.id)
                                const posCfg = POSITION_CONFIG[position.title] || {
                                  ml: position.title,
                                  badge: 'bg-white/10 text-slate-200 border-white/20',
                                  icon: '🎖️',
                                }

                                return (
                                  <div
                                    key={lMember.id}
                                    className={clsx(
                                      'p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                                      isMarked
                                        ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm'
                                        : 'bg-black/40 border-white/10 hover:border-emerald-400/50 hover:bg-black/60 shadow-md'
                                    )}
                                  >
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={clsx('text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1', posCfg.badge)}>
                                          <span>{posCfg.icon}</span>
                                          <span>{posCfg.ml}</span>
                                        </span>
                                        {lMember.membership_number && (
                                          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                                            ID: {lMember.membership_number}
                                          </span>
                                        )}
                                      </div>

                                      <h4 className="text-base font-black text-white truncate">
                                        {lMember.full_name}
                                      </h4>

                                      <p className="text-xs text-slate-400 font-mono">
                                        📱 {lMember.mobile}
                                      </p>
                                    </div>

                                    <div className="flex-shrink-0 flex items-center gap-2">
                                      {isMarked ? (
                                        <div className="flex items-center gap-2">
                                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                                            <Check className="w-3.5 h-3.5" />
                                            <span>ഹാജരായി</span>
                                          </span>
                                          <button
                                            onClick={() => sendWhatsAppThankYou({
                                              id: lMember.id,
                                              full_name: lMember.full_name,
                                              mobile: lMember.mobile,
                                              membership_number: lMember.membership_number,
                                              positionTitle: `${posCfg.ml} - ${activeUnit.name}`,
                                            })}
                                            title="WhatsApp നന്ദി സന്ദേശം അയക്കുക"
                                            className="p-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 transition"
                                          >
                                            <WhatsAppIcon className="w-4 h-4 fill-current" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => confirmMutation.mutate({
                                            member: {
                                              id: lMember.id,
                                              full_name: lMember.full_name,
                                              mobile: lMember.mobile,
                                              membership_number: lMember.membership_number,
                                              positionTitle: `${posCfg.ml} - ${activeUnit.name}`,
                                            }
                                          })}
                                          disabled={confirmMutation.isPending}
                                          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-400/30"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          <span>ഹാജർ രേഖപ്പെടുത്തുക</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Public Live Attendance Board */}
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

        {/* Admin Login Link at Bottom */}
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

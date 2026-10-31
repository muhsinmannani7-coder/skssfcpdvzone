import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import {
  X, Users, Building2, Shield, Award, Clock,
  Share2, Copy, ExternalLink, Monitor, Square,
  RotateCcw, Search, Volume2, VolumeX, CheckCircle2,
  Calendar, MapPin, Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'

interface UnitStat {
  unitId: string
  unitName: string
  clusterCode: string
  clusterName: string
  totalOfficers: number
  presentOfficers: number
  points: number
  presentMemberNames: string[]
  absentMemberNames: string[]
}

interface AttendeeFeedItem {
  attendanceId: string
  memberId: string
  fullName: string
  mobile: string
  membershipNumber?: string | null
  markedAt: string
  zoneTitle?: string
  clusterTitle?: string
  unitTitle?: string
  unitName?: string
  clusterName?: string
}

interface ZoneLeaderStatus {
  memberId: string
  fullName: string
  mobile: string
  title: string
  isPresent: boolean
  markedAt?: string
}

function playAttendanceBell() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.setValueAtTime(880, now + 0.1) // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.2) // D6

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.start(now)
    osc.stop(now + 0.6)
  } catch {
    // Audio context may be restricted
  }
}

export default function LiveAttendanceMonitorModal({
  program,
  onClose,
}: {
  program: Program
  onClose: () => void
}) {
  const toast = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'feed' | 'units' | 'zone' | 'clusters'>('feed')
  const [search, setSearch] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Realtime subscription to attendance inserts
  useEffect(() => {
    const channel = supabase
      .channel(`live-monitor-${program.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `program_id=eq.${program.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['monitor-live-data', program.id] })
          qc.invalidateQueries({ queryKey: ['programs'] })
          qc.invalidateQueries({ queryKey: ['attendance-count', program.id] })
          if (soundEnabled) {
            playAttendanceBell()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [program.id, soundEnabled, qc])

  // Fetch comprehensive live data
  const { data: monitorData, isLoading } = useQuery({
    queryKey: ['monitor-live-data', program.id],
    queryFn: async () => {
      // 1. Fetch attendance records
      const { data: attendanceList, error: attErr } = await supabase
        .from('attendance')
        .select('id, member_id, marked_at')
        .eq('program_id', program.id)
        .order('marked_at', { ascending: false })

      if (attErr) throw attErr

      const attendanceMap = new Map<string, { id: string; markedAt: string }>()
      for (const a of attendanceList || []) {
        const att = a as { id: string; member_id: string; marked_at: string }
        attendanceMap.set(att.member_id, { id: att.id, markedAt: att.marked_at })
      }

      // 2. Fetch units and clusters
      const { data: units } = await supabase
        .from('units')
        .select('id, name, cluster_id, clusters(name, code)')
        .eq('is_active', true)
        .order('sort_order')

      // 3. Fetch members with their positions
      const { data: memberPositions } = await supabase
        .from('member_positions')
        .select(`
          member_id, unit_id, cluster_id,
          committees (name, level),
          positions (title),
          clusters (name),
          units (name, clusters (name)),
          members (id, full_name, mobile, membership_number)
        `)
        .eq('is_active', true)

      // Build Member Info Map
      interface MemberInfo {
        id: string
        fullName: string
        mobile: string
        membershipNumber?: string | null
        zoneTitle?: string
        clusterTitle?: string
        unitTitle?: string
        unitId?: string
        unitName?: string
        clusterName?: string
      }

      const memberInfoMap = new Map<string, MemberInfo>()
      const unitOfficersMap = new Map<string, { id: string; name: string }[]>()
      const zoneLeadersList: ZoneLeaderStatus[] = []

      for (const mp of memberPositions || []) {
        const m = mp.members as unknown as { id: string; full_name: string; mobile: string; membership_number?: string | null } | null
        if (!m) continue

        const pos = mp.positions as unknown as { title: string } | null
        const comm = mp.committees as unknown as { level: 'zone' | 'cluster' | 'unit'; name: string } | null
        const u = mp.units as unknown as { name: string; clusters?: { name: string } | null } | null
        const cl = mp.clusters as unknown as { name: string } | null

        let info = memberInfoMap.get(m.id)
        if (!info) {
          info = {
            id: m.id,
            fullName: m.full_name,
            mobile: m.mobile,
            membershipNumber: m.membership_number,
          }
          memberInfoMap.set(m.id, info)
        }

        if (comm?.level === 'zone') {
          info.zoneTitle = pos?.title || 'Zone Leader'
          if (!zoneLeadersList.some(z => z.memberId === m.id)) {
            const att = attendanceMap.get(m.id)
            zoneLeadersList.push({
              memberId: m.id,
              fullName: m.full_name,
              mobile: m.mobile,
              title: pos?.title || 'Zone Leader',
              isPresent: !!att,
              markedAt: att?.markedAt,
            })
          }
        } else if (comm?.level === 'cluster') {
          info.clusterTitle = pos?.title || 'Cluster Officer'
          info.clusterName = cl?.name || u?.clusters?.name
        } else if (comm?.level === 'unit') {
          info.unitTitle = pos?.title || 'Unit Officer'
          info.unitName = u?.name
          info.unitId = mp.unit_id || undefined
          info.clusterName = u?.clusters?.name

          if (mp.unit_id) {
            const existingList = unitOfficersMap.get(mp.unit_id) || []
            if (!existingList.some(officer => officer.id === m.id)) {
              existingList.push({ id: m.id, name: m.full_name })
              unitOfficersMap.set(mp.unit_id, existingList)
            }
          }
        }
      }

      // 4. Build Attendee Feed Items
      const attendeeFeed: AttendeeFeedItem[] = []
      for (const rawAtt of attendanceList || []) {
        const att = rawAtt as { id: string; member_id: string; marked_at: string }
        const info = memberInfoMap.get(att.member_id)
        if (info) {
          attendeeFeed.push({
            attendanceId: att.id,
            memberId: att.member_id,
            fullName: info.fullName,
            mobile: info.mobile,
            membershipNumber: info.membershipNumber,
            markedAt: att.marked_at,
            zoneTitle: info.zoneTitle,
            clusterTitle: info.clusterTitle,
            unitTitle: info.unitTitle,
            unitName: info.unitName,
            clusterName: info.clusterName,
          })
        }
      }

      // 5. Build Unit Stats (16 Units)
      const unitStats: UnitStat[] = (units || []).map(u => {
        const cl = u.clusters as unknown as { name: string; code: string } | null
        const officers = unitOfficersMap.get(u.id) || []
        const presentNames: string[] = []
        const absentNames: string[] = []

        for (const off of officers) {
          if (attendanceMap.has(off.id)) {
            presentNames.push(off.name)
          } else {
            absentNames.push(off.name)
          }
        }

        const presentCount = presentNames.length

        return {
          unitId: u.id,
          unitName: u.name,
          clusterCode: cl?.code || 'ZONE',
          clusterName: cl?.name || '',
          totalOfficers: 4, // 4 officers per unit
          presentOfficers: presentCount,
          points: presentCount, // 1 point per officer present
          presentMemberNames: presentNames,
          absentMemberNames: absentNames,
        }
      })

      // 6. Cluster Stats
      const clusterMap = new Map<string, { code: string; name: string; presentCount: number; unitsCount: number; totalOfficers: number }>()
      for (const u of unitStats) {
        if (!clusterMap.has(u.clusterCode)) {
          clusterMap.set(u.clusterCode, {
            code: u.clusterCode,
            name: u.clusterName,
            presentCount: 0,
            unitsCount: 0,
            totalOfficers: 0,
          })
        }
        const c = clusterMap.get(u.clusterCode)!
        c.presentCount += u.presentOfficers
        c.totalOfficers += u.totalOfficers
        c.unitsCount += 1
      }

      const clusterStats = Array.from(clusterMap.values())

      // 7. Zone count
      const zonePresentCount = zoneLeadersList.filter(z => z.isPresent).length

      return {
        totalPresent: attendanceList?.length ?? 0,
        totalMembers: 92,
        zonePresentCount,
        zoneTotal: 28,
        zoneLeadersList: zoneLeadersList.sort((a, b) => (b.isPresent ? 1 : 0) - (a.isPresent ? 1 : 0)),
        attendeeFeed,
        unitStats,
        clusterStats,
      }
    },
    refetchInterval: 6000,
  })

  // Program status toggle mutations
  const closeProgram = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('close_program', { p_program_id: program.id })
      if (error || !data?.success) {
        const { error: directErr } = await supabase
          .from('programs')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('id', program.id)
        if (directErr) throw directErr
      }
    },
    onSuccess: () => {
      toast.success('Attendance paused / closed')
      qc.invalidateQueries({ queryKey: ['programs'] })
      qc.invalidateQueries({ queryKey: ['monitor-live-data', program.id] })
    },
    onError: (e: Error) => toast.error('Failed to close attendance', e.message),
  })

  const reopenProgram = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reopen_program', { p_program_id: program.id })
      if (error || !data?.success) {
        const { error: directErr } = await supabase
          .from('programs')
          .update({ status: 'active', closed_at: null })
          .eq('id', program.id)
        if (directErr) throw directErr
      }
    },
    onSuccess: () => {
      toast.success('Attendance re-opened & is LIVE!')
      qc.invalidateQueries({ queryKey: ['programs'] })
      qc.invalidateQueries({ queryKey: ['monitor-live-data', program.id] })
    },
    onError: (e: Error) => toast.error('Failed to re-open attendance', e.message),
  })

  const copyLink = () => {
    const url = `${window.location.origin}/attend/${program.id}`
    navigator.clipboard.writeText(url)
    toast.success('Attendance link copied to clipboard!')
  }

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/attend/${program.id}`
    const text = `*SKSSF ചപ്പാരപ്പടവ് മേഖല*\n📢 *മീറ്റിംഗ് ഹാജർ രേഖപ്പെടുത്തൽ*\n\n📌 *${program.name}*\n📍 *സ്ഥലം:* ${program.venue}\n📅 *തീയതി:* ${format(new Date(program.program_date), 'dd MMM yyyy')}\n\n👉 യോഗത്തിൽ പങ്കെടുത്തവർ താഴെ നൽകിയ ലിങ്കിൽ മൊബൈൽ നമ്പർ നൽകി ഹാജർ കൺഫോം ചെയ്യുക:\n${url}\n\n(പ്രത്യേക പാസ്‌വേർഡ് ആവശ്യമില്ല. മൊബൈൽ നമ്പർ അടിച്ച് കൺഫോം ചെയ്യുക)`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Filtered attendees
  const filteredFeed = (monitorData?.attendeeFeed || []).filter(item => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.fullName.toLowerCase().includes(q) ||
      item.mobile.includes(q) ||
      (item.unitName && item.unitName.toLowerCase().includes(q)) ||
      (item.membershipNumber && item.membershipNumber.toLowerCase().includes(q))
    )
  })

  const percent = monitorData ? Math.round((monitorData.totalPresent / monitorData.totalMembers) * 100) : 0
  const isProgramActive = program.status === 'active'

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-white">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Live Attendance Console
                </span>
                <span
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black',
                    isProgramActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  )}
                >
                  <span className={clsx('w-2 h-2 rounded-full', isProgramActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400')} />
                  {isProgramActive ? 'LIVE ACTIVE' : 'CLOSED / PAUSED'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                {program.name}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {program.venue}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  {format(new Date(program.program_date), 'dd MMM yyyy')}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={clsx(
                'btn btn-sm transition text-xs font-semibold py-2 px-3 rounded-xl border',
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              )}
              title={soundEnabled ? 'Arrival chime is ON' : 'Arrival chime is MUTED'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={copyLink}
              className="btn bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-3 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copy Link</span>
            </button>

            <button
              onClick={shareWhatsApp}
              className="btn bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => window.open(`/admin/projector/${program.id}`, '_blank')}
              className="btn bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              title="Open Fullscreen Projector for TV / Hall Display"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Projector Mode</span>
            </button>

            {isProgramActive ? (
              <button
                onClick={() => closeProgram.mutate()}
                disabled={closeProgram.isPending}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Close Link</span>
              </button>
            ) : (
              <button
                onClick={() => reopenProgram.mutate()}
                disabled={reopenProgram.isPending}
                className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Open Link</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800">
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Present (ആകെ ഹാജർ)
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-white">
                {monitorData?.totalPresent ?? 0}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 92</span>
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {percent}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Zone Leaders (മേഖല 28)
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-400">
                {monitorData?.zonePresentCount ?? 0}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 28</span>
              </span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                {monitorData?.zonePresentCount ?? 0} Pts
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">1 point per attending leader</p>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Units (16 യൂണിറ്റുകൾ)
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-teal-400">
                {(monitorData?.unitStats || []).filter(u => u.presentOfficers > 0).length}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 16</span>
              </span>
              <span className="text-xs font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md">
                4 Officers / Unit
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Units with attendance registered</p>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Points (പോയിന്റുകൾ)
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-400">
                {monitorData?.totalPresent ?? 0}
              </span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                +1 Pt / Member
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Credited to individuals & units</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'feed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Attendees Feed (തത്സമയം)</span>
              {monitorData && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {monitorData.totalPresent}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('units')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'units'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>16 Units Breakdown (യൂണിറ്റ് കണക്ക്)</span>
            </button>

            <button
              onClick={() => setActiveTab('zone')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'zone'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Zone Leaders 28 (മേഖല)</span>
            </button>

            <button
              onClick={() => setActiveTab('clusters')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'clusters'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Award className="w-3.5 h-3.5" />
              <span>3 Clusters (ക്ലസ്റ്റർ)</span>
            </button>
          </div>

          {/* Search box */}
          {activeTab === 'feed' && (
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search attendee by name/unit..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/50">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Connecting to live meeting attendance...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: LIVE ATTENDEES STREAM */}
              {activeTab === 'feed' && (
                <div className="space-y-2.5">
                  {filteredFeed.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 space-y-2">
                      <Users className="w-12 h-12 mx-auto opacity-20" />
                      <p className="text-base font-semibold text-slate-400">
                        {search ? 'No attendees match your search' : 'No attendees marked yet'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Share the attendance link via WhatsApp. As soon as members punch their mobile number and confirm, their card will appear here live!
                      </p>
                      <button
                        onClick={shareWhatsApp}
                        className="mt-3 btn bg-[#25D366] text-white text-xs font-bold py-2 px-4 rounded-xl inline-flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp Now</span>
                      </button>
                    </div>
                  ) : (
                    filteredFeed.map((item, idx) => (
                      <div
                        key={item.attendanceId}
                        className={clsx(
                          'p-3.5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                          idx === 0
                            ? 'bg-gradient-to-r from-emerald-950/60 to-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black',
                            idx === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm sm:text-base">
                                {item.fullName}
                              </h4>
                              {idx === 0 && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                                  LATEST
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                              <span className="text-slate-400 font-mono">📱 {item.mobile}</span>
                              {item.membershipNumber && (
                                <span className="text-slate-400 font-mono">🆔 {item.membershipNumber}</span>
                              )}
                              {item.unitName && (
                                <span className="text-emerald-400 font-medium">📍 {item.unitName}</span>
                              )}
                              {item.clusterName && (
                                <span className="text-slate-400">({item.clusterName})</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Positions & Timing */}
                        <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5 text-right">
                          <div className="flex flex-wrap gap-1">
                            {item.zoneTitle && (
                              <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                🌟 {item.zoneTitle} (Zone)
                              </span>
                            )}
                            {item.clusterTitle && (
                              <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                🏢 {item.clusterTitle}
                              </span>
                            )}
                            {item.unitTitle && (
                              <span className="badge bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                📍 {item.unitTitle}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {format(new Date(item.markedAt), 'hh:mm:ss a')}
                            </span>
                            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                              +1 Point
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: 16 UNITS BREAKDOWN */}
              {activeTab === 'units' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(monitorData?.unitStats || []).map(u => {
                    const uPercent = Math.round((u.presentOfficers / u.totalOfficers) * 100)
                    const isAllPresent = u.presentOfficers === u.totalOfficers

                    return (
                      <div
                        key={u.unitId}
                        className={clsx(
                          'p-4 rounded-2xl border transition-all',
                          isAllPresent
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                            : u.presentOfficers > 0
                            ? 'bg-slate-800/70 border-slate-700'
                            : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {u.clusterCode} CLUSTER
                            </span>
                            <h4 className="text-base font-bold text-white mt-0.5">
                              {u.unitName}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className={clsx(
                              'text-sm font-black px-2.5 py-1 rounded-lg inline-block',
                              isAllPresent
                                ? 'bg-emerald-500 text-slate-950'
                                : u.presentOfficers > 0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            )}>
                              {u.presentOfficers} / {u.totalOfficers}
                            </span>
                            <p className="text-[10px] text-emerald-400 font-bold mt-1">
                              {u.points} Unit Points
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full transition-all duration-500',
                                isAllPresent ? 'bg-emerald-400' : 'bg-teal-500'
                              )}
                              style={{ width: `${uPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Present Names */}
                        {u.presentMemberNames.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                            {u.presentMemberNames.map((name, i) => (
                              <span
                                key={i}
                                className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>{name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* TAB 3: ZONE LEADERS (28) */}
              {activeTab === 'zone' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
                    <div>
                      <h4 className="font-bold text-white text-sm">Zone Committee Attendance (മേഖല കമ്മിറ്റി)</h4>
                      <p className="text-xs text-slate-400">28 Zone Office Bearers & Working Committee Members</p>
                    </div>
                    <span className="text-sm font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                      {monitorData?.zonePresentCount} / {monitorData?.zoneTotal} Present
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {(monitorData?.zoneLeadersList || []).map(z => (
                      <div
                        key={z.memberId}
                        className={clsx(
                          'p-3 rounded-xl border flex items-center justify-between gap-2 transition',
                          z.isPresent
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-800/40 border-slate-800 opacity-60'
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{z.fullName}</p>
                          <p className="text-[10px] text-amber-300 truncate">{z.title}</p>
                        </div>
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
                            z.isPresent
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          )}
                        >
                          {z.isPresent ? '✓ Present (+1 Pt)' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: 3 CLUSTERS */}
              {activeTab === 'clusters' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(monitorData?.clusterStats || []).map(c => {
                    const cPercent = c.totalOfficers > 0 ? Math.round((c.presentCount / c.totalOfficers) * 100) : 0
                    return (
                      <div
                        key={c.code}
                        className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="badge badge-purple text-xs font-bold">{c.code} CLUSTER</span>
                          <span className="text-xs text-slate-400 font-semibold">{c.unitsCount} Units</span>
                        </div>

                        <h4 className="text-lg font-black text-white">{c.name}</h4>

                        <div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black text-emerald-400">{c.presentCount}</span>
                            <span className="text-xs text-slate-400">/ {c.totalOfficers} Officers</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                              style={{ width: `${cPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                          <span>Total Cluster Points:</span>
                          <span className="font-bold text-white">{c.presentCount} Points</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-updating via Supabase Realtime • Chapparappadavu Zone</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/attend/${program.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 underline"
            >
              Open Member Check-in Link <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Shield, Users, Building2, MapPin,
  Calendar, Maximize2, Minimize2, ArrowLeft, RefreshCw
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
}

interface RecentAttendee {
  id: string
  name: string
  unitName?: string
  positionTitle?: string
  markedAt: string
}

export default function LiveMeetingProjector() {
  const { id: programId } = useParams<{ id: string }>()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const qc = useQueryClient()

  // Realtime subscription for projector
  useEffect(() => {
    if (!programId) return
    const channel = supabase
      .channel(`projector-realtime-${programId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `program_id=eq.${programId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['projector-live-data', programId] })
          qc.invalidateQueries({ queryKey: ['projector-program', programId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [programId, qc])

  // 1. Fetch program info
  const { data: program } = useQuery({
    queryKey: ['projector-program', programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId!)
        .single()
      if (error) throw error
      return data as Program
    },
    enabled: !!programId,
    refetchInterval: 5000,
  })

  // 2. Fetch full attendance records & unit standings
  const { data: liveData } = useQuery({
    queryKey: ['projector-live-data', programId],
    queryFn: async () => {
      if (!programId) return null

      // Fetch all attendance for this program
      const { data: attendanceList, error: attErr } = await supabase
        .from('attendance')
        .select('id, member_id, marked_at')
        .eq('program_id', programId)
        .order('marked_at', { ascending: false })

      if (attErr) throw attErr

      const presentMemberIds = new Set((attendanceList || []).map(a => a.member_id))
      const totalPresent = presentMemberIds.size

      // Fetch units & clusters
      const { data: units } = await supabase
        .from('units')
        .select('id, name, cluster_id, clusters(name, code)')
        .eq('is_active', true)
        .order('sort_order')

      // Fetch member positions
      const { data: memberPositions } = await supabase
        .from('member_positions')
        .select(`
          member_id, unit_id,
          committees (name, level),
          positions (title),
          members (full_name)
        `)
        .eq('is_active', true)

      // Unit calculations
      const unitMap = new Map<string, UnitStat>()
      for (const u of units || []) {
        const cl = u.clusters as unknown as { name: string; code: string } | null
        unitMap.set(u.id, {
          unitId: u.id,
          unitName: u.name,
          clusterCode: cl?.code || 'ZONE',
          clusterName: cl?.name || '',
          totalOfficers: 4, // 4 officers per unit
          presentOfficers: 0,
        })
      }

      // Zone points & calculate attendance
      let zonePresentCount = 0
      const recentAttendees: RecentAttendee[] = []

      // Map member details for recent ticker
      const memberInfoMap = new Map<string, { name: string; unitName?: string; positionTitle?: string }>()

      for (const mp of memberPositions || []) {
        const m = mp.members as unknown as { full_name: string } | null
        const pos = mp.positions as unknown as { title: string } | null
        const comm = mp.committees as unknown as { level: string } | null

        if (m) {
          memberInfoMap.set(mp.member_id, {
            name: m.full_name,
            positionTitle: pos?.title,
          })
        }

        if (presentMemberIds.has(mp.member_id)) {
          if (comm?.level === 'zone') {
            zonePresentCount++
          } else if (mp.unit_id && unitMap.has(mp.unit_id)) {
            const stat = unitMap.get(mp.unit_id)!
            stat.presentOfficers++
          }
        }
      }

      // Build recent attendees list (top 6)
      for (const att of (attendanceList || []).slice(0, 6)) {
        const info = memberInfoMap.get(att.member_id)
        recentAttendees.push({
          id: att.id,
          name: info?.name || 'Member',
          positionTitle: info?.positionTitle,
          markedAt: att.marked_at,
        })
      }

      const unitStats = Array.from(unitMap.values())

      return {
        totalPresent,
        zonePresentCount,
        recentAttendees,
        unitStats,
      }
    },
    enabled: !!programId,
    refetchInterval: 3000, // fast live refresh for projector
  })

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const totalMembers = 92 // 92 total distinct members in Chapparappadavu Zone
  const percent = liveData ? Math.round((liveData.totalPresent / totalMembers) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top Bar Header */}
      <header className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/programs"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Back to Programs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-white">
                SKSSF CHAPPARAPPADAVU ZONE
              </h1>
              <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase mt-1">
                Live Attendance & Leaderboard Display
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE ATTENDANCE ACTIVE</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* Program Banner */}
      {program && (
        <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 border-b border-emerald-500/20 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{program.name}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {program.venue}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {format(new Date(program.program_date), 'dd MMMM yyyy')}
              </span>
            </div>
          </div>

          {/* Quick share URL */}
          <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Member Attendance Link:
              </p>
              <p className="text-xs font-mono font-bold text-emerald-400">
                {window.location.origin}/attend/{program.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: Big Counters & Recent Attendees (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Big Attendance Counter Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Attendance
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-6xl font-black tracking-tight text-white">
                    {liveData?.totalPresent ?? 0}
                  </span>
                  <span className="text-xl font-bold text-slate-400">
                    / {totalMembers}
                  </span>
                </div>
              </div>

              {/* Circular Percentage */}
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center relative bg-slate-950/60">
                <div
                  className="absolute inset-0 rounded-full border-4 border-emerald-400 transition-all duration-700"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                    transform: `rotate(${Math.min(360, (percent / 100) * 360)}deg)`
                  }}
                />
                <span className="text-2xl font-black text-emerald-400">
                  {percent}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Mini Stat Pills */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800">
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Zone Leaders</p>
                <p className="text-xl font-black text-amber-400 mt-0.5">
                  {liveData?.zonePresentCount ?? 0} <span className="text-xs text-slate-500 font-normal">/ 28</span>
                </p>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Units Active</p>
                <p className="text-xl font-black text-teal-400 mt-0.5">
                  {(liveData?.unitStats || []).filter(u => u.presentOfficers > 0).length} <span className="text-xs text-slate-500 font-normal">/ 16</span>
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Attendee Ticker */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Live Check-ins
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">Auto-updating</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {!liveData?.recentAttendees || liveData.recentAttendees.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-8">
                  <Users className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">Waiting for attendees to check in...</p>
                </div>
              ) : (
                liveData.recentAttendees.map(att => (
                  <div
                    key={att.id}
                    className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between gap-3 animate-slide-up"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{att.name}</p>
                      {att.positionTitle && (
                        <p className="text-xs text-emerald-400 truncate">{att.positionTitle}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap bg-black/40 px-2 py-1 rounded">
                      {format(new Date(att.markedAt), 'hh:mm:ss a')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 16 Units Leaderboard Grid (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              16 Units Attendance Status
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4 Officers / Unit
            </span>
          </div>

          {/* Unit Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(liveData?.unitStats || []).map(u => {
              const uPercent = Math.round((u.presentOfficers / u.totalOfficers) * 100)
              const isFull = u.presentOfficers === u.totalOfficers

              return (
                <div
                  key={u.unitId}
                  className={clsx(
                    'rounded-2xl p-3.5 border transition-all duration-300',
                    isFull
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : u.presentOfficers > 0
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800/80 opacity-70'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {u.clusterCode} CLUSTER
                      </p>
                      <h4 className="font-bold text-sm text-white truncate">{u.unitName}</h4>
                    </div>
                    <span
                      className={clsx(
                        'text-xs font-black px-2 py-0.5 rounded-md',
                        isFull
                          ? 'bg-emerald-500 text-slate-950'
                          : u.presentOfficers > 0
                          ? 'bg-slate-700 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      )}
                    >
                      {u.presentOfficers}/{u.totalOfficers}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-500',
                          isFull ? 'bg-emerald-400' : 'bg-teal-500'
                        )}
                        style={{ width: `${uPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

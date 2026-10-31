import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Shield, Users, Building2, MapPin,
  Calendar, Maximize2, Minimize2, ArrowLeft, RefreshCw,
  Palette, Sun, Moon, Sparkles, Check
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

export type ProjectorTheme = 'dark' | 'light' | 'emerald' | 'navy'

export default function LiveMeetingProjector() {
  const { id: programId } = useParams<{ id: string }>()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const qc = useQueryClient()

  // Theme State (persisted in localStorage)
  const [theme, setTheme] = useState<ProjectorTheme>(() => {
    return (localStorage.getItem('skssf_projector_theme') as ProjectorTheme) || 'dark'
  })

  const changeTheme = (newTheme: ProjectorTheme) => {
    setTheme(newTheme)
    localStorage.setItem('skssf_projector_theme', newTheme)
    setShowThemeMenu(false)
  }

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
      const { data: positions } = await supabase
        .from('member_positions')
        .select(`
          member_id,
          unit_id,
          committee_id,
          committees(level),
          positions(title),
          members(full_name)
        `)
        .eq('is_active', true)

      // Calculate unit officer presence
      const unitMap = new Map<string, UnitStat>()
      for (const u of units || []) {
        const c = u.clusters as unknown as { name: string; code: string } | null
        unitMap.set(u.id, {
          unitId: u.id,
          unitName: u.name,
          clusterCode: c?.code || 'CL',
          clusterName: c?.name || 'Cluster',
          totalOfficers: 4,
          presentOfficers: 0,
        })
      }

      let zonePresentCount = 0
      const recentAttendees: RecentAttendee[] = []
      const memberInfoMap = new Map<string, { name: string; positionTitle?: string }>()

      for (const mp of positions || []) {
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
    refetchInterval: 3000,
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

  const totalMembers = 92
  const percent = liveData ? Math.round((liveData.totalPresent / totalMembers) * 100) : 0

  // Theme-specific styles definition
  const themes = {
    dark: {
      name: 'Midnight Dark',
      icon: Moon,
      root: 'bg-slate-950 text-white',
      header: 'bg-slate-900/90 border-slate-800 text-white',
      banner: 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-emerald-500/20 text-white',
      card: 'bg-slate-900 border-slate-800/80 shadow-2xl text-white',
      cardBorder: 'border-slate-800',
      cardSub: 'bg-black/30 border-white/5',
      textPrimary: 'text-white',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
      progressTrack: 'bg-slate-800',
      checkinItem: 'bg-slate-800/80 border-slate-700/60 text-white',
      unitCardDefault: 'bg-slate-800/80 border-slate-700 text-white',
      unitCardFull: 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-500/10 text-white',
      unitCardEmpty: 'bg-slate-900/60 border-slate-800/80 opacity-70 text-slate-300',
      button: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
    },
    light: {
      name: 'Daylight White',
      icon: Sun,
      root: 'bg-slate-100 text-slate-900',
      header: 'bg-white/95 border-slate-200 text-slate-900 shadow-sm',
      banner: 'bg-gradient-to-r from-emerald-50 via-white to-slate-50 border-emerald-200 text-slate-900',
      card: 'bg-white border-slate-200 shadow-xl text-slate-900',
      cardBorder: 'border-slate-200',
      cardSub: 'bg-slate-50 border-slate-200',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-500',
      progressTrack: 'bg-slate-200',
      checkinItem: 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100/80',
      unitCardDefault: 'bg-white border-slate-200 text-slate-900 shadow-sm',
      unitCardFull: 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm shadow-emerald-500/10',
      unitCardEmpty: 'bg-slate-50 border-slate-200 opacity-80 text-slate-600',
      button: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm',
    },
    emerald: {
      name: 'Emerald Islamic',
      icon: Sparkles,
      root: 'bg-[#062419] text-white',
      header: 'bg-[#083324]/95 border-emerald-800/60 text-white',
      banner: 'bg-gradient-to-r from-[#0a402d] to-[#083324] border-emerald-700/40 text-white',
      card: 'bg-[#0a3828] border-emerald-800/70 shadow-2xl text-white',
      cardBorder: 'border-emerald-800/70',
      cardSub: 'bg-black/30 border-emerald-700/30',
      textPrimary: 'text-white',
      textSecondary: 'text-emerald-100',
      textMuted: 'text-emerald-300/80',
      progressTrack: 'bg-[#062419]',
      checkinItem: 'bg-[#0d4532] border-emerald-700/50 text-white',
      unitCardDefault: 'bg-[#0d4532] border-emerald-700/60 text-white',
      unitCardFull: 'bg-emerald-600/30 border-emerald-400 shadow-emerald-400/20 text-white',
      unitCardEmpty: 'bg-[#083324]/60 border-emerald-900/60 opacity-70 text-emerald-200',
      button: 'bg-[#083324] hover:bg-[#0d4532] text-emerald-100 border-emerald-700',
    },
    navy: {
      name: 'Royal Sapphire',
      icon: Shield,
      root: 'bg-[#070e20] text-white',
      header: 'bg-[#0c1836]/95 border-blue-900/60 text-white',
      banner: 'bg-gradient-to-r from-[#0f214a] to-[#0c1836] border-blue-800/40 text-white',
      card: 'bg-[#0d1c3e] border-blue-800/60 shadow-2xl text-white',
      cardBorder: 'border-blue-800/60',
      cardSub: 'bg-black/30 border-blue-800/30',
      textPrimary: 'text-white',
      textSecondary: 'text-blue-100',
      textMuted: 'text-blue-300/80',
      progressTrack: 'bg-[#070e20]',
      checkinItem: 'bg-[#13254f] border-blue-700/50 text-white',
      unitCardDefault: 'bg-[#13254f] border-blue-700/60 text-white',
      unitCardFull: 'bg-cyan-950/40 border-cyan-400 shadow-cyan-400/20 text-white',
      unitCardEmpty: 'bg-[#0c1836]/60 border-blue-900/60 opacity-70 text-blue-200',
      button: 'bg-[#0c1836] hover:bg-[#13254f] text-blue-100 border-blue-700',
    },
  }

  const currentTheme = themes[theme]

  return (
    <div className={clsx('min-h-screen flex flex-col font-sans select-none transition-colors duration-300', currentTheme.root)}>
      {/* Top Bar Header */}
      <header className={clsx('px-6 py-3.5 border-b flex items-center justify-between backdrop-blur transition-colors duration-300', currentTheme.header)}>
        <div className="flex items-center gap-4">
          <Link
            to="/admin/programs"
            className={clsx('p-2 rounded-xl transition border', currentTheme.button)}
            title="Back to Programs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={clsx('text-lg font-black tracking-tight leading-none', currentTheme.textPrimary)}>
                SKSSF CHAPPARAPPADAVU ZONE
              </h1>
              <p className="text-xs font-semibold text-emerald-500 tracking-wider uppercase mt-1">
                Live Projector Display & Leaderboard
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE ACTIVE</span>
          </div>

          {/* 🎨 THEME SELECTOR BUTTON & MENU */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(p => !p)}
              className={clsx(
                'px-3 py-2 rounded-xl transition flex items-center gap-2 text-xs font-bold border shadow-sm',
                currentTheme.button
              )}
              title="Change Projector Theme"
            >
              <Palette className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">Theme: {currentTheme.name}</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up text-slate-800 dark:text-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 tracking-wider">
                  Select Display Theme
                </p>

                {/* Dark */}
                <button
                  onClick={() => changeTheme('dark')}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition',
                    theme === 'dark' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>🌙 Midnight Dark</span>
                  </span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                {/* Light */}
                <button
                  onClick={() => changeTheme('light')}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition',
                    theme === 'light' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>☀️ Daylight White</span>
                  </span>
                  {theme === 'light' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                {/* Emerald */}
                <button
                  onClick={() => changeTheme('emerald')}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition',
                    theme === 'emerald' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>🌿 Emerald Green</span>
                  </span>
                  {theme === 'emerald' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                {/* Navy */}
                <button
                  onClick={() => changeTheme('navy')}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition',
                    theme === 'navy' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>🔷 Royal Sapphire</span>
                  </span>
                  {theme === 'navy' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={clsx('p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold border shadow-sm', currentTheme.button)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* Program Banner */}
      {program && (
        <div className={clsx('border-b px-6 py-3 flex flex-wrap items-center justify-between gap-4 transition-colors', currentTheme.banner)}>
          <div>
            <h2 className={clsx('text-xl sm:text-2xl font-black leading-tight', currentTheme.textPrimary)}>{program.name}</h2>
            <div className={clsx('flex items-center gap-4 text-xs mt-1', currentTheme.textMuted)}>
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                {program.venue}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                {format(new Date(program.program_date), 'dd MMMM yyyy')}
              </span>
            </div>
          </div>

          {/* Public Board URL Display */}
          <div className={clsx('border rounded-xl px-4 py-2 flex items-center gap-3', currentTheme.cardSub)}>
            <div className="text-right">
              <p className={clsx('text-[10px] uppercase font-bold tracking-wider', currentTheme.textMuted)}>
                Live Attendance Board:
              </p>
              <p className="text-xs font-mono font-bold text-emerald-500">
                {window.location.origin}/board/{program.id}
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
          <div className={clsx('rounded-3xl p-6 border transition-colors', currentTheme.card)}>
            <div className="flex items-center justify-between">
              <div>
                <p className={clsx('text-xs font-bold uppercase tracking-wider', currentTheme.textMuted)}>
                  Total Attendance
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={clsx('text-6xl font-black tracking-tight', currentTheme.textPrimary)}>
                    {liveData?.totalPresent ?? 0}
                  </span>
                  <span className={clsx('text-xl font-bold', currentTheme.textMuted)}>
                    / {totalMembers}
                  </span>
                </div>
              </div>

              {/* Circular Percentage */}
              <div className={clsx('w-24 h-24 rounded-full border-4 flex items-center justify-center relative shadow-inner', currentTheme.progressTrack, currentTheme.cardBorder)}>
                <span className="text-2xl font-black text-emerald-500">
                  {percent}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className={clsx('h-3.5 rounded-full overflow-hidden shadow-inner', currentTheme.progressTrack)}>
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Mini Stat Pills */}
            <div className={clsx('grid grid-cols-2 gap-3 mt-5 pt-4 border-t', currentTheme.cardBorder)}>
              <div className={clsx('rounded-xl p-3 border', currentTheme.cardSub)}>
                <p className={clsx('text-[11px] font-bold uppercase', currentTheme.textMuted)}>Zone Leaders</p>
                <p className="text-2xl font-black text-amber-500 mt-0.5">
                  {liveData?.zonePresentCount ?? 0} <span className={clsx('text-xs font-normal', currentTheme.textMuted)}>/ 28</span>
                </p>
              </div>
              <div className={clsx('rounded-xl p-3 border', currentTheme.cardSub)}>
                <p className={clsx('text-[11px] font-bold uppercase', currentTheme.textMuted)}>Units Active</p>
                <p className="text-2xl font-black text-teal-500 mt-0.5">
                  {(liveData?.unitStats || []).filter(u => u.presentOfficers > 0).length} <span className={clsx('text-xs font-normal', currentTheme.textMuted)}>/ 16</span>
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Attendee Ticker */}
          <div className={clsx('flex-1 rounded-3xl p-5 flex flex-col border transition-colors', currentTheme.card)}>
            <div className={clsx('flex items-center justify-between mb-3 pb-2 border-b', currentTheme.cardBorder)}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                Live Check-ins
              </h3>
              <span className={clsx('text-[11px] font-semibold', currentTheme.textMuted)}>Auto-updating</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {!liveData?.recentAttendees || liveData.recentAttendees.length === 0 ? (
                <div className={clsx('h-full flex flex-col items-center justify-center text-center py-8', currentTheme.textMuted)}>
                  <Users className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">Waiting for attendees to check in...</p>
                </div>
              ) : (
                liveData.recentAttendees.map(att => (
                  <div
                    key={att.id}
                    className={clsx('rounded-xl p-3 flex items-center justify-between gap-3 border transition-colors animate-slide-up', currentTheme.checkinItem)}
                  >
                    <div className="min-w-0">
                      <p className={clsx('font-bold text-sm truncate', currentTheme.textPrimary)}>{att.name}</p>
                      {att.positionTitle && (
                        <p className="text-xs text-emerald-500 truncate">{att.positionTitle}</p>
                      )}
                    </div>
                    <span className={clsx('text-[11px] font-mono whitespace-nowrap px-2 py-1 rounded border', currentTheme.cardSub, currentTheme.textMuted)}>
                      {format(new Date(att.markedAt), 'hh:mm:ss a')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 16 Units Leaderboard Grid (7 cols) */}
        <div className={clsx('lg:col-span-7 rounded-3xl p-6 flex flex-col border shadow-2xl overflow-hidden transition-colors', currentTheme.card)}>
          <div className={clsx('flex items-center justify-between mb-4 pb-3 border-b', currentTheme.cardBorder)}>
            <h3 className={clsx('text-base font-black tracking-tight flex items-center gap-2', currentTheme.textPrimary)}>
              <Building2 className="w-5 h-5 text-indigo-500" />
              16 Units Attendance Status
            </h3>
            <span className={clsx('text-xs font-bold uppercase tracking-wider', currentTheme.textMuted)}>
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
                      ? currentTheme.unitCardFull
                      : u.presentOfficers > 0
                      ? currentTheme.unitCardDefault
                      : currentTheme.unitCardEmpty
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={clsx('text-[10px] font-bold uppercase tracking-wider', currentTheme.textMuted)}>
                        {u.clusterCode} CLUSTER
                      </p>
                      <h4 className={clsx('font-bold text-sm truncate', currentTheme.textPrimary)}>{u.unitName}</h4>
                    </div>
                    <span
                      className={clsx(
                        'text-xs font-black px-2 py-0.5 rounded-md',
                        isFull
                          ? 'bg-emerald-500 text-white'
                          : u.presentOfficers > 0
                          ? 'bg-emerald-500/20 text-emerald-600 font-bold'
                          : 'bg-black/10 dark:bg-white/10 text-slate-400'
                      )}
                    >
                      {u.presentOfficers}/{u.totalOfficers}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className={clsx('h-1.5 rounded-full overflow-hidden', currentTheme.progressTrack)}>
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-500',
                          isFull ? 'bg-emerald-500' : 'bg-teal-500'
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

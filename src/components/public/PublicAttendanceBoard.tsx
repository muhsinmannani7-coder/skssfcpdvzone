import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Shield, Users, MapPin, Calendar, Clock,
  RefreshCw, AlertCircle, Lock,
  Star, Layers, Trophy, Sun, Moon, Palette, Check, Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'

interface AttendeeRecord {
  attendanceId: string
  memberId: string
  fullName: string
  mobile: string
  membershipNumber: string | null
  markedAt: string
  zonePositions: string[]
  clusterPositions: { title: string; clusterName: string }[]
  unitPositions: { title: string; unitName: string; clusterName: string }[]
}

interface ZonePointsSummary {
  zonePresent: number
  clusterWise: {
    clusterId: string
    clusterName: string
    presentCount: number
    totalOfficers: number
  }[]
}

export type BoardTheme = 'dark' | 'light' | 'emerald'

export default function PublicAttendanceBoard() {
  const { id: programId } = useParams<{ id: string }>()

  // Theme State
  const [theme, setTheme] = useState<BoardTheme>(() => {
    return (localStorage.getItem('skssf_board_theme') as BoardTheme) || 'dark'
  })
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  const changeTheme = (newTheme: BoardTheme) => {
    setTheme(newTheme)
    localStorage.setItem('skssf_board_theme', newTheme)
    setShowThemeMenu(false)
  }

  // Fetch program info
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['board-program', programId],
    queryFn: async () => {
      if (!programId) return null
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()
      if (error) throw error
      return data as Program
    },
    enabled: !!programId,
    refetchInterval: 15000,
  })

  // Fetch all attendance for this program with member + positions
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ['board-attendees', programId],
    queryFn: async () => {
      if (!programId) return []

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          marked_at,
          members (
            id,
            full_name,
            mobile,
            membership_number,
            member_positions (
              positions ( title ),
              committees ( name, level ),
              clusters ( name ),
              units ( name, clusters ( name ) )
            )
          )
        `)
        .eq('program_id', programId)
        .order('marked_at', { ascending: false })

      if (error) throw error
      if (!data) return []

      interface RawPos {
        positions?: { title: string } | null
        committees?: { name: string; level: 'zone' | 'cluster' | 'unit' } | null
        clusters?: { name: string } | null
        units?: { name: string; clusters?: { name: string } | null } | null
      }

      // Map to structured attendee records
      return data.map(row => {
        const m = (row.members as unknown) as {
          id: string
          full_name: string
          mobile: string
          membership_number: string | null
          member_positions?: RawPos[]
        } | null

        if (!m) return null

        const rawPositions = m.member_positions || []
        const zonePositions: string[] = []
        const clusterPositions: { title: string; clusterName: string }[] = []
        const unitPositions: { title: string; unitName: string; clusterName: string }[] = []

        for (const mp of rawPositions) {
          const title = mp.positions?.title || 'Member'
          const level = mp.committees?.level || 'unit'
          const clusterName = mp.clusters?.name || mp.units?.clusters?.name || ''
          const unitName = mp.units?.name || ''

          if (level === 'zone') {
            zonePositions.push(title)
          } else if (level === 'cluster') {
            clusterPositions.push({ title, clusterName })
          } else if (level === 'unit') {
            unitPositions.push({ title, unitName, clusterName })
          }
        }

        return {
          attendanceId: row.id,
          memberId: m.id,
          fullName: m.full_name,
          mobile: m.mobile,
          membershipNumber: m.membership_number,
          markedAt: row.marked_at,
          zonePositions,
          clusterPositions,
          unitPositions,
        } as AttendeeRecord
      }).filter(Boolean) as AttendeeRecord[]
    },
    enabled: !!programId,
    refetchInterval: 5000,
  })

  // Fetch cluster wise and zone wise point summary
  const { data: pointsSummary } = useQuery({
    queryKey: ['board-points-summary', programId],
    queryFn: async () => {
      if (!programId) return null

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('member_id')
        .eq('program_id', programId)

      const presentMemberIds = new Set((attendanceData || []).map(a => a.member_id))

      const { data: clusters } = await supabase
        .from('clusters')
        .select('id, name')
        .order('name')

      const { data: memberPositions } = await supabase
        .from('member_positions')
        .select(`
          member_id,
          cluster_id,
          unit_id,
          committees ( level )
        `)
        .eq('is_active', true)

      let zonePresent = 0
      const clusterPresentCounts = new Map<string, Set<string>>()
      for (const c of clusters || []) {
        clusterPresentCounts.set(c.id, new Set())
      }

      for (const mp of memberPositions || []) {
        if (presentMemberIds.has(mp.member_id)) {
          const c = (mp.committees as unknown) as { level: string } | null
          if (c?.level === 'zone') {
            zonePresent++
          }
          if (mp.cluster_id && clusterPresentCounts.has(mp.cluster_id)) {
            clusterPresentCounts.get(mp.cluster_id)!.add(mp.member_id)
          }
        }
      }

      const clusterWise = (clusters || []).map(c => ({
        clusterId: c.id,
        clusterName: c.name,
        presentCount: clusterPresentCounts.get(c.id)?.size || 0,
        totalOfficers: 4 * 5 + 4,
      }))

      return {
        zonePresent,
        clusterWise,
      } as ZonePointsSummary
    },
    enabled: !!programId,
    refetchInterval: 6000,
  })

  const [searchQuery, setSearchQuery] = useState('')

  const filteredAttendees = attendees.filter(a => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.mobile.includes(q) ||
      (a.membershipNumber && a.membershipNumber.toLowerCase().includes(q)) ||
      a.zonePositions.some(p => p.toLowerCase().includes(q)) ||
      a.clusterPositions.some(p => p.title.toLowerCase().includes(q) || p.clusterName.toLowerCase().includes(q)) ||
      a.unitPositions.some(p => p.title.toLowerCase().includes(q) || p.unitName.toLowerCase().includes(q))
    )
  })

  if (programLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">Loading attendance board...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center text-white space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">Meeting Not Found</h2>
          <p className="text-slate-400 text-sm">This meeting link is invalid or the meeting has been removed.</p>
          <Link to="/admin/login" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 underline">
            <Lock className="w-4 h-4" /> Admin Panel
          </Link>
        </div>
      </div>
    )
  }

  const totalAttendees = attendees.length
  const hasZoneOfficers = attendees.some(a => a.zonePositions.length > 0)

  // Theme styles
  const themes = {
    dark: {
      root: 'bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white',
      card: 'bg-white/10 backdrop-blur-xl border border-white/15 text-white',
      cardSub: 'bg-black/20 border border-white/10 text-white',
      textPrimary: 'text-white',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
      badgeLive: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      input: 'bg-black/30 border-white/20 text-white placeholder-slate-400',
      attendeeRow: 'hover:bg-white/5 border-white/5',
      themeBtn: 'bg-white/10 hover:bg-white/20 text-white border-white/20',
    },
    light: {
      root: 'bg-slate-100 text-slate-900',
      card: 'bg-white border border-slate-200 shadow-xl text-slate-900',
      cardSub: 'bg-slate-50 border border-slate-200 text-slate-900',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-500',
      badgeLive: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500',
      attendeeRow: 'hover:bg-slate-50 border-slate-100',
      themeBtn: 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm',
    },
    emerald: {
      root: 'bg-[#062419] text-white',
      card: 'bg-[#0a3828] border border-emerald-700/60 shadow-2xl text-white',
      cardSub: 'bg-[#083324] border border-emerald-800 text-white',
      textPrimary: 'text-white',
      textSecondary: 'text-emerald-100',
      textMuted: 'text-emerald-300/80',
      badgeLive: 'bg-emerald-500/30 text-emerald-300 border-emerald-400/40',
      input: 'bg-black/30 border-emerald-700/60 text-white placeholder-emerald-300/50',
      attendeeRow: 'hover:bg-white/5 border-emerald-800/40',
      themeBtn: 'bg-[#083324] hover:bg-[#0d4532] text-emerald-100 border-emerald-700',
    },
  }

  const currentTheme = themes[theme]

  return (
    <div className={clsx('min-h-screen transition-colors duration-300', currentTheme.root)}>
      <div className="relative max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Top Header Bar with Theme Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={clsx('text-base font-black tracking-tight leading-none', currentTheme.textPrimary)}>SKSSF</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                ചപ്പാരപ്പടവ് മേഖല
              </p>
            </div>
          </div>

          {/* Theme Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={clsx('px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5', currentTheme.themeBtn)}
            >
              <Palette className="w-3.5 h-3.5 text-emerald-500" />
              <span className="capitalize">{theme} Theme</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-scale-up text-slate-800 dark:text-slate-100">
                <button
                  onClick={() => changeTheme('dark')}
                  className={clsx('w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition', theme === 'dark' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>🌙 Dark</span>
                  </span>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>

                <button
                  onClick={() => changeTheme('light')}
                  className={clsx('w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition', theme === 'light' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>☀️ Light</span>
                  </span>
                  {theme === 'light' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>

                <button
                  onClick={() => changeTheme('emerald')}
                  className={clsx('w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition', theme === 'emerald' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🌿 Emerald</span>
                  </span>
                  {theme === 'emerald' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meeting Info Card */}
        <div className={clsx('rounded-2xl p-5 shadow-xl transition-colors', currentTheme.card)}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {program.status === 'active' ? (
                <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', currentTheme.badgeLive)}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  🔴 LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-500 border border-slate-500/30">
                  🔒 CLOSED
                </span>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Users className="w-3.5 h-3.5" />
              {totalAttendees} ഹാജരായി
            </span>
          </div>

          <h2 className={clsx('text-xl font-black leading-snug', currentTheme.textPrimary)}>{program.name}</h2>

          <div className={clsx('grid grid-cols-2 gap-2 mt-3 text-xs border-t pt-3', currentTheme.textSecondary)}>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>{format(new Date(program.program_date), 'dd MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">{program.venue}</span>
            </div>
            {program.start_time && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Clock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>സമയം: {program.start_time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Points Summary Card */}
        {pointsSummary && (
          <div className={clsx('rounded-2xl p-5 shadow-xl space-y-4 transition-colors', currentTheme.card)}>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className={clsx('font-black text-base', currentTheme.textPrimary)}>Points & Statistics</h3>
            </div>

            {/* Zone level */}
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-200">Zone Leaders</span>
              </div>
              <span className="text-sm font-black text-amber-600 dark:text-amber-300">
                {pointsSummary.zonePresent} Present
              </span>
            </div>

            {/* Cluster-wise breakdown */}
            {pointsSummary.clusterWise.length > 0 && (
              <div className="space-y-2">
                <p className={clsx('text-[11px] font-bold uppercase tracking-wider flex items-center gap-1', currentTheme.textMuted)}>
                  <Layers className="w-3.5 h-3.5" /> Cluster-wise Attendance
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pointsSummary.clusterWise.map(c => (
                    <div key={c.clusterId} className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-purple-700 dark:text-purple-200 truncate">{c.clusterName}</p>
                      </div>
                      <span className="text-xs font-black text-purple-600 dark:text-purple-300 whitespace-nowrap bg-purple-500/20 px-2 py-0.5 rounded">
                        {c.presentCount} Present
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zone Officers Highlight */}
        {hasZoneOfficers && (
          <div className={clsx('rounded-2xl p-4 shadow-xl space-y-3 transition-colors', currentTheme.card)}>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" />
              ഹാജരായ മേഖല ഭാരവാഹികൾ (Zone Leaders Present)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attendees
                .filter(a => a.zonePositions.length > 0)
                .map(a => (
                  <div key={a.attendanceId} className="flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                    <div className="min-w-0">
                      <p className={clsx('font-bold text-xs truncate', currentTheme.textPrimary)}>{a.fullName}</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">{a.zonePositions.join(', ')}</p>
                    </div>
                    <span className={clsx('text-[10px] font-mono whitespace-nowrap', currentTheme.textMuted)}>
                      {format(new Date(a.markedAt), 'hh:mm a')}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Full Attendance List */}
        <div className={clsx('rounded-2xl overflow-hidden shadow-xl border transition-colors', currentTheme.card)}>
          <div className={clsx('p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3', currentTheme.cardSub)}>
            <div>
              <h3 className={clsx('font-black text-base', currentTheme.textPrimary)}>
                ഹാജർ പട്ടിക ({totalAttendees})
              </h3>
              <p className={clsx('text-xs mt-0.5', currentTheme.textMuted)}>
                തത്സമയ ഹാജർ നില (Real-time live board)
              </p>
            </div>

            <input
              type="text"
              placeholder="പേര്, നമ്പർ, ശാഖ തിരയുക..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={clsx('px-3 py-2 rounded-xl text-xs focus:outline-none transition border', currentTheme.input)}
            />
          </div>

          {attendeesLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
              <p className="text-xs">ഹാജർ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു...</p>
            </div>
          ) : attendees.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className={clsx('font-medium text-sm', currentTheme.textMuted)}>
                ഇതുവരെ ആരും ഹാജർ രേഖപ്പെടുത്തിയിട്ടില്ല
              </p>
              <p className={clsx('text-xs', currentTheme.textMuted)}>
                (കമ്മിറ്റി ഡെസ്കിൽ ഹാജർ രേഖപ്പെടുത്തുമ്പോൾ ഇവിടെ തത്സമയം കാണാം)
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/5">
              {filteredAttendees.map((attendee, index) => (
                <div
                  key={attendee.attendanceId}
                  className={clsx('px-4 py-3.5 flex items-start gap-3 transition', currentTheme.attendeeRow)}
                >
                  {/* Counter */}
                  <span className={clsx('w-6 text-xs font-mono font-bold pt-0.5', currentTheme.textMuted)}>
                    {totalAttendees - index}
                  </span>

                  {/* Member details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={clsx('font-bold text-sm truncate', currentTheme.textPrimary)}>
                          {attendee.fullName}
                        </span>
                        <span className={clsx('text-xs font-mono', currentTheme.textMuted)}>📱 {attendee.mobile}</span>
                        {attendee.membershipNumber && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                            🆔 {attendee.membershipNumber}
                          </span>
                        )}
                      </div>

                      <span className={clsx('text-[11px] font-mono whitespace-nowrap', currentTheme.textMuted)}>
                        {format(new Date(attendee.markedAt), 'hh:mm a')}
                      </span>
                    </div>

                    {/* Positions Badges */}
                    {(attendee.zonePositions.length > 0 || attendee.clusterPositions.length > 0 || attendee.unitPositions.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {attendee.zonePositions.map((title, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md"
                          >
                            മേഖല: {title}
                          </span>
                        ))}

                        {attendee.clusterPositions.map((pos, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md"
                          >
                            ക്ലസ്റ്റർ: {pos.title} ({pos.clusterName})
                          </span>
                        ))}

                        {attendee.unitPositions.map((pos, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-md"
                          >
                            ശാഖ: {pos.title} ({pos.unitName})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-6 space-y-1">
          <p className={clsx('text-xs font-semibold', currentTheme.textMuted)}>
            SKSSF Chapparappadavu Zone — Attendance Board
          </p>
          <Link to="/admin/login" className={clsx('text-xs underline transition', currentTheme.textMuted)}>
            Admin Panel Login →
          </Link>
        </div>
      </div>
    </div>
  )
}

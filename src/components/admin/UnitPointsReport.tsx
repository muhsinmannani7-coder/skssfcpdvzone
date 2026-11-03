import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  BarChart3, Download, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Minus,
} from 'lucide-react'
import { clsx } from 'clsx'
import { exportUnitReportToExcel, type UnitReportExportData } from '@/utils/exportExcel'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawProgram {
  id: string
  name: string
  program_date: string
  status: string
}

interface RawUnit {
  id: string
  name: string
  cluster_id: string | null
  clusters: { id: string; name: string; code: string } | null
}

interface RawMemberPosition {
  member_id: string
  unit_id: string | null
  members: { id: string; full_name: string } | null
}

interface RawAttendance {
  program_id: string
  member_id: string
}

// Per-unit per-meeting data
interface MeetingCell {
  pointsEarned: number
  maxPoints: number
  absentMembers: string[]
}

interface UnitRow {
  rank: number
  unitId: string
  unitName: string
  clusterName: string
  clusterCode: string
  clusterId: string
  meetings: Record<string, MeetingCell> // keyed by program_id
  totalPoints: number
  maxTotalPoints: number
  attendancePercent: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UnitPointsReport() {
  const [selectedClusterId, setSelectedClusterId] = useState<string>('all')
  const [includedStatus, setIncludedStatus] = useState<'completed' | 'all'>('completed')
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: programs = [], isLoading: programsLoading } = useQuery<RawProgram[]>({
    queryKey: ['unit-report-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, program_date, status')
        .order('program_date', { ascending: true })
      if (error) throw error
      return data as RawProgram[]
    },
  })

  const { data: units = [], isLoading: unitsLoading } = useQuery<RawUnit[]>({
    queryKey: ['unit-report-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, name, cluster_id, clusters(id, name, code)')
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as unknown as RawUnit[]
    },
  })

  const { data: memberPositions = [], isLoading: positionsLoading } = useQuery<RawMemberPosition[]>({
    queryKey: ['unit-report-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_positions')
        .select('member_id, unit_id, members(id, full_name)')
        .eq('is_active', true)
        .not('unit_id', 'is', null)
      if (error) throw error
      return (data ?? []) as unknown as RawMemberPosition[]
    },
  })

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<RawAttendance[]>({
    queryKey: ['unit-report-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('program_id, member_id')
      if (error) throw error
      return data as RawAttendance[]
    },
  })

  const isLoading = programsLoading || unitsLoading || positionsLoading || attendanceLoading

  // ── Derived data ───────────────────────────────────────────────────────────

  const filteredPrograms = useMemo(() => {
    return programs.filter(p =>
      includedStatus === 'all' ? true : p.status !== 'upcoming'
    )
  }, [programs, includedStatus])

  // Unique clusters for filter tabs
  const clusters = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; code: string }>()
    for (const u of units) {
      if (u.clusters && u.cluster_id && !seen.has(u.cluster_id)) {
        seen.set(u.cluster_id, {
          id: u.cluster_id,
          name: u.clusters.name,
          code: u.clusters.code,
        })
      }
    }
    return Array.from(seen.values())
  }, [units])

  // Build per-unit members map: unitId → Set<memberId>
  const unitMembersMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const mp of memberPositions) {
      if (!mp.unit_id) continue
      if (!map.has(mp.unit_id)) map.set(mp.unit_id, new Set())
      map.get(mp.unit_id)!.add(mp.member_id)
    }
    return map
  }, [memberPositions])

  // Build per-unit member names map: unitId → Map<memberId, name>
  const unitMemberNamesMap = useMemo(() => {
    const map = new Map<string, Map<string, string>>()
    for (const mp of memberPositions) {
      if (!mp.unit_id || !mp.members) continue
      if (!map.has(mp.unit_id)) map.set(mp.unit_id, new Map())
      const m = mp.members as { id: string; full_name: string }
      map.get(mp.unit_id)!.set(mp.member_id, m.full_name)
    }
    return map
  }, [memberPositions])

  // Build attendance set: Set<"programId::memberId">
  const attendanceSet = useMemo(() => {
    const s = new Set<string>()
    for (const att of attendance) {
      s.add(`${att.program_id}::${att.member_id}`)
    }
    return s
  }, [attendance])

  // Compute unit rows
  const unitRows = useMemo<UnitRow[]>(() => {
    const rawRows = units.map(u => {
      const cl = u.clusters
      const unitMembers = unitMembersMap.get(u.id) ?? new Set<string>()
      const uniqueMembers = Array.from(unitMembers) // de-duped by the Set itself
      const memberNames = unitMemberNamesMap.get(u.id) ?? new Map<string, string>()

      const meetings: Record<string, MeetingCell> = {}
      let totalPoints = 0
      let maxTotalPoints = 0

      for (const prog of filteredPrograms) {
        const maxPts = uniqueMembers.length
        const presentSet = new Set<string>()
        for (const memberId of uniqueMembers) {
          if (attendanceSet.has(`${prog.id}::${memberId}`)) {
            presentSet.add(memberId)
          }
        }
        const pts = presentSet.size
        const absentMembers = uniqueMembers
          .filter(mid => !presentSet.has(mid))
          .map(mid => memberNames.get(mid) ?? mid)

        meetings[prog.id] = { pointsEarned: pts, maxPoints: maxPts, absentMembers }
        totalPoints += pts
        maxTotalPoints += maxPts
      }

      const attendancePercent = maxTotalPoints > 0
        ? Math.round((totalPoints / maxTotalPoints) * 100)
        : 0

      return {
        unitId: u.id,
        unitName: u.name,
        clusterName: cl?.name ?? '',
        clusterCode: cl?.code ?? '',
        clusterId: u.cluster_id ?? '',
        meetings,
        totalPoints,
        maxTotalPoints,
        attendancePercent,
      }
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.attendancePercent - a.attendancePercent)

    let currentRank = 1
    let prevPoints: number | null = null
    return rawRows.map((row, idx) => {
      if (idx === 0) {
        currentRank = 1
        prevPoints = row.totalPoints
      } else if (row.totalPoints !== prevPoints) {
        currentRank++
        prevPoints = row.totalPoints
      }
      return {
        ...row,
        rank: currentRank,
      }
    })
  }, [units, filteredPrograms, unitMembersMap, unitMemberNamesMap, attendanceSet])

  // Apply cluster filter
  const displayedRows = useMemo(() => {
    if (selectedClusterId === 'all') return unitRows
    return unitRows.filter(r => r.clusterId === selectedClusterId)
  }, [unitRows, selectedClusterId])

  // ── Summary stats ──────────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const totalMeetings = filteredPrograms.length
    const totalPoints = unitRows.reduce((s, r) => s + r.totalPoints, 0)
    const fullAttendance = unitRows.filter(r => r.attendancePercent === 100).length
    const zeroAttendance = unitRows.filter(r => r.totalPoints === 0).length
    return { totalMeetings, totalPoints, fullAttendance, zeroAttendance }
  }, [filteredPrograms, unitRows])

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const exportData: UnitReportExportData[] = displayedRows.map(row => ({
      rank: row.rank,
      unitName: row.unitName,
      clusterName: row.clusterName,
      meetings: filteredPrograms.map(prog => ({
        name: prog.name,
        date: prog.program_date,
        pointsEarned: row.meetings[prog.id]?.pointsEarned ?? 0,
        maxPoints: row.meetings[prog.id]?.maxPoints ?? 0,
      })),
      totalPoints: row.totalPoints,
      maxTotalPoints: row.maxTotalPoints,
      attendancePercent: row.attendancePercent,
      absentMembersPerMeeting: filteredPrograms.map(prog => ({
        meetingName: prog.name,
        absentMembers: row.meetings[prog.id]?.absentMembers ?? [],
      })),
    }))
    exportUnitReportToExcel(exportData)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            ശാഖ പോയിന്റ് റിപ്പോർട്ട് | Unit Points Report
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Meeting-wise attendance points for every unit (ശാഖ) committee
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status filter */}
          <select
            value={includedStatus}
            onChange={e => setIncludedStatus(e.target.value as 'completed' | 'all')}
            className="input py-2 text-sm bg-white border-surface-300 font-semibold"
          >
            <option value="completed">Completed Meetings</option>
            <option value="all">All Meetings</option>
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={isLoading || displayedRows.length === 0}
            className="btn btn-primary text-xs font-bold py-2.5 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Meetings"
          value={summaryStats.totalMeetings}
          colorClass="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          label="Total Points Given"
          value={summaryStats.totalPoints}
          colorClass="bg-primary-50 text-primary-700"
        />
        <SummaryCard
          label="Units — Full Attendance"
          value={summaryStats.fullAttendance}
          colorClass="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          label="Units — No Attendance"
          value={summaryStats.zeroAttendance}
          colorClass="bg-red-50 text-red-700"
        />
      </div>

      {/* Cluster Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedClusterId('all')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition',
            selectedClusterId === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          )}
        >
          All Clusters
        </button>
        {clusters.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClusterId(c.id)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition',
              selectedClusterId === c.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            )}
          >
            {c.code} — {c.name}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card py-16 text-center text-surface-400">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading unit report data…</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="card py-12 text-center text-surface-400 text-sm">
          No meetings found for the selected filter.
        </div>
      ) : (
        <div className="card overflow-hidden shadow-sm">
          <div className="p-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-surface-900 text-sm">
                Unit-wise Points ({displayedRows.length} Units × {filteredPrograms.length} Meetings)
              </h3>
              <p className="text-xs text-surface-500">
                Each unique unit member present = 1 point. Click a row to see absent members.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  {/* Sticky unit name column */}
                  <th className="sticky left-0 z-10 bg-surface-50 text-left px-4 py-3 font-bold text-surface-700 whitespace-nowrap min-w-[180px]">
                    Unit (ശാഖ)
                  </th>
                  <th className="text-left px-3 py-3 font-bold text-surface-700 whitespace-nowrap">
                    Cluster
                  </th>
                  {filteredPrograms.map(prog => (
                    <th
                      key={prog.id}
                      className="text-center px-2 py-3 font-bold text-surface-700 whitespace-nowrap min-w-[80px]"
                      title={`${prog.name} — ${prog.program_date}`}
                    >
                      <span className="block truncate max-w-[72px]">{prog.name}</span>
                      <span className="block text-[10px] text-surface-400 font-normal">{prog.program_date}</span>
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 font-bold text-surface-900 whitespace-nowrap">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-surface-700 whitespace-nowrap">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map(row => {
                  const isExpanded = expandedUnitId === row.unitId
                  return (
                    <>
                      <tr
                        key={row.unitId}
                        onClick={() => setExpandedUnitId(isExpanded ? null : row.unitId)}
                        className={clsx(
                          'border-b border-surface-100 cursor-pointer hover:bg-surface-50 transition',
                          isExpanded && 'bg-primary-50/30'
                        )}
                      >
                        {/* Sticky unit name */}
                        <td className={clsx(
                          'sticky left-0 z-10 px-4 py-3 font-bold text-surface-900 whitespace-nowrap',
                          isExpanded ? 'bg-primary-50' : 'bg-white'
                        )}>
                          <div className="flex items-center gap-1.5">
                            {row.totalPoints > 0 && row.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black text-[10px] flex-shrink-0" title="Rank 1 (ഫസ്റ്റ്)">
                                🥇
                              </span>
                            ) : row.totalPoints > 0 && row.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-slate-900 font-black text-[10px] flex-shrink-0" title="Rank 2 (സെക്കൻഡ്)">
                                🥈
                              </span>
                            ) : row.totalPoints > 0 && row.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white font-black text-[10px] flex-shrink-0" title="Rank 3 (തേർഡ്)">
                                🥉
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-surface-400 w-5 text-center flex-shrink-0">
                                #{row.rank}
                              </span>
                            )}
                            {isExpanded
                              ? <ChevronUp className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                              : <ChevronDown className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                            }
                            <span>{row.unitName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-surface-500 whitespace-nowrap">
                          <span className="badge badge-purple text-[10px]">{row.clusterCode}</span>
                        </td>
                        {filteredPrograms.map(prog => {
                          const cell = row.meetings[prog.id]
                          if (!cell) {
                            return (
                              <td key={prog.id} className="px-2 py-3 text-center">
                                <Minus className="w-4 h-4 text-surface-300 mx-auto" />
                              </td>
                            )
                          }
                          const { pointsEarned, maxPoints } = cell
                          if (maxPoints === 0) {
                            return (
                              <td key={prog.id} className="px-2 py-3 text-center">
                                <Minus className="w-4 h-4 text-surface-300 mx-auto" />
                              </td>
                            )
                          }
                          const allPresent = pointsEarned === maxPoints
                          const nonePresent = pointsEarned === 0
                          return (
                            <td key={prog.id} className="px-2 py-3 text-center">
                              {allPresent ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span className="text-[10px] text-emerald-600 font-bold">{pointsEarned}/{maxPoints}</span>
                                </div>
                              ) : nonePresent ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <XCircle className="w-4 h-4 text-red-400" />
                                  <span className="text-[10px] text-red-500 font-bold">0/{maxPoints}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center mx-auto">
                                    <span className="text-[8px] font-black text-white">{pointsEarned}</span>
                                  </span>
                                  <span className="text-[10px] text-amber-600 font-bold">{pointsEarned}/{maxPoints}</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-3 py-3 text-center font-black text-primary-700 text-sm">
                          {row.totalPoints}
                          <span className="text-[10px] text-surface-400 font-normal">/{row.maxTotalPoints}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={clsx(
                            'px-2 py-0.5 rounded-md text-[11px] font-bold',
                            row.attendancePercent >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.attendancePercent > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-surface-100 text-surface-400'
                          )}>
                            {row.attendancePercent}%
                          </span>
                        </td>
                      </tr>

                      {/* Expanded: absent members */}
                      {isExpanded && (
                        <tr key={`${row.unitId}-expand`} className="border-b border-primary-100 bg-primary-50/20">
                          <td
                            colSpan={filteredPrograms.length + 4}
                            className="px-6 py-4"
                          >
                            <p className="font-bold text-surface-700 text-xs mb-3">
                              Absent Members by Meeting — {row.unitName}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {filteredPrograms.map(prog => {
                                const cell = row.meetings[prog.id]
                                const absent = cell?.absentMembers ?? []
                                if (cell?.maxPoints === 0) return null
                                return (
                                  <div
                                    key={prog.id}
                                    className={clsx(
                                      'rounded-lg p-2.5 border text-xs',
                                      absent.length === 0
                                        ? 'border-emerald-200 bg-emerald-50'
                                        : 'border-red-100 bg-red-50'
                                    )}
                                  >
                                    <p className="font-bold text-surface-700 mb-1 truncate" title={prog.name}>
                                      {prog.name}
                                      <span className="ml-1 text-[10px] text-surface-400 font-normal">({prog.program_date})</span>
                                    </p>
                                    {absent.length === 0 ? (
                                      <p className="text-emerald-600 font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Full attendance
                                      </p>
                                    ) : (
                                      <ul className="space-y-0.5">
                                        {absent.map(name => (
                                          <li key={name} className="text-red-700 flex items-center gap-1">
                                            <XCircle className="w-3 h-3 flex-shrink-0" /> {name}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div className={clsx('card p-4 rounded-xl', colorClass)}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold mt-1 opacity-75">{label}</p>
    </div>
  )
}


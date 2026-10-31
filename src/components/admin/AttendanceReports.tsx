import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Program, type Member, type Committee } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import {
  FileSpreadsheet, FileText, Search,
  CalendarCheck, Award, Users, Filter, Loader2
} from 'lucide-react'
import { clsx } from 'clsx'
import { exportAttendanceToExcel, exportCommitteePointsToExcel, type AttendanceExportRecord, type CommitteePointsExportRecord } from '@/utils/exportExcel'
import { exportAttendanceToPdf, exportCommitteePointsToPdf } from '@/utils/exportPdf'

interface AttendanceWithDetails {
  id: string
  program_id: string
  member_id: string
  marked_at: string
  member: Member
  operator?: { full_name: string } | null
}

export default function AttendanceReports() {
  const toast = useToast()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'attendance' | 'points'>('attendance')
  const [levelFilter, setLevelFilter] = useState<'all' | 'zone' | 'cluster' | 'unit'>('all')
  const [search, setSearch] = useState('')

  // 1. Fetch programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['programs-report-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('program_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Program[]
    },
  })

  // Select first program if not selected
  const activeProgram = useMemo(() => {
    if (selectedProgramId) {
      return programs.find(p => p.id === selectedProgramId) || programs[0]
    }
    return programs[0] || null
  }, [programs, selectedProgramId])

  const programId = activeProgram?.id

  // 2. Fetch committees with positions and assigned members
  const { data: committees = [] } = useQuery<Committee[]>({
    queryKey: ['committees-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committees')
        .select(`
          *,
          cluster:clusters(name),
          unit:units(name),
          positions(
            id, title, points,
            member_positions(
              id, is_active,
              member:members(id, full_name, mobile, membership_number)
            )
          )
        `)
        .order('name')
      if (error) throw error
      return (data ?? []) as Committee[]
    },
  })

  // 4. Fetch attendance records for the selected program
  const { data: attendances = [], isLoading: loadingAttendance } = useQuery<AttendanceWithDetails[]>({
    queryKey: ['attendance-report', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id, program_id, member_id, marked_at,
          member:members(*),
          operator:attendance_operators(full_name)
        `)
        .eq('program_id', programId!)
        .order('marked_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as AttendanceWithDetails[]
    },
  })

  // Set of member IDs that attended
  const attendedMemberIds = useMemo(() => {
    return new Set(attendances.map(a => a.member_id))
  }, [attendances])

  // Compute committee points
  const committeePointsData = useMemo(() => {
    type CommitteeWithPos = Committee & {
      positions?: Array<{
        id: string
        title: string
        points: number
        member_positions?: Array<{
          id: string
          is_active: boolean
          member?: { id: string; full_name: string; mobile: string; membership_number: string | null } | null
        }>
      }>
    }

    const comms = committees as CommitteeWithPos[]
    const results: CommitteePointsExportRecord[] = []

    comms.forEach(c => {
      let totalPositions = 0
      let presentCount = 0
      let pointsEarned = 0

      const positions = c.positions || []
      positions.forEach(pos => {
        totalPositions++
        const mp = pos.member_positions?.[0]
        if (mp?.member && attendedMemberIds.has(mp.member.id)) {
          presentCount++
          pointsEarned += (pos.points || 1)
        }
      })

      const pct = totalPositions > 0 ? Math.round((presentCount / totalPositions) * 100) : 0

      results.push({
        rank: 0,
        committeeName: c.name,
        level: c.level,
        clusterName: c.cluster?.name,
        totalPositions,
        presentCount,
        points: pointsEarned,
        percentage: `${pct}%`,
      })
    })

    // Sort by points descending, then by presentCount
    results.sort((a, b) => b.points - a.points || b.presentCount - a.presentCount)
    results.forEach((r, idx) => {
      r.rank = idx + 1
    })

    return results
  }, [committees, attendedMemberIds])

  // Points summary metrics
  const pointsSummary = useMemo(() => {
    let zonePoints = 0
    let clusterPoints = 0
    let unitPoints = 0

    committeePointsData.forEach(c => {
      if (c.level === 'zone') zonePoints += c.points
      else if (c.level === 'cluster') clusterPoints += c.points
      else if (c.level === 'unit') unitPoints += c.points
    })

    return {
      zonePoints,
      clusterPoints,
      unitPoints,
      totalPoints: zonePoints + clusterPoints + unitPoints,
    }
  }, [committeePointsData])

  // Prepare detailed attendance records list
  const attendanceExportList = useMemo<AttendanceExportRecord[]>(() => {
    // Map member ID to their committee details
    const memberPositionMap = new Map<string, { committee: string; position: string }>()
    type CommitteeWithPos = Committee & {
      positions?: Array<{
        title: string
        member_positions?: Array<{
          member?: { id: string } | null
        }>
      }>
    }
    const comms = committees as CommitteeWithPos[]
    comms.forEach(c => {
      c.positions?.forEach(pos => {
        const m = pos.member_positions?.[0]?.member
        if (m) {
          memberPositionMap.set(m.id, {
            committee: c.name,
            position: pos.title,
          })
        }
      })
    })

    return attendances.map((a, idx) => {
      const posInfo = memberPositionMap.get(a.member_id)
      return {
        slNo: idx + 1,
        memberName: a.member?.full_name || 'Unknown',
        mobile: a.member?.mobile || '—',
        membershipNumber: a.member?.membership_number || '',
        committee: posInfo?.committee || 'General Member',
        position: posInfo?.position || '—',
        markedAt: new Date(a.marked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        operatorName: a.operator?.full_name || 'Admin',
      }
    })
  }, [attendances, committees])

  // Filter attendance records for display
  const filteredAttendance = useMemo(() => {
    return attendanceExportList.filter(rec => {
      const matchSearch = !search ||
        rec.memberName.toLowerCase().includes(search.toLowerCase()) ||
        rec.mobile.includes(search) ||
        rec.committee.toLowerCase().includes(search.toLowerCase())

      const matchLevel = levelFilter === 'all' ||
        (levelFilter === 'zone' && rec.committee.includes('ZONE')) ||
        (levelFilter === 'cluster' && rec.committee.includes('CLUSTER')) ||
        (levelFilter === 'unit' && (rec.committee.includes('UNIT') || !rec.committee.includes('ZONE')))

      return matchSearch && matchLevel
    })
  }, [attendanceExportList, search, levelFilter])

  // Export handlers
  const handleExportExcel = () => {
    if (!activeProgram) return
    if (activeTab === 'attendance') {
      exportAttendanceToExcel(activeProgram.name, activeProgram.program_date, attendanceExportList)
      toast.success('Attendance Excel report downloaded')
    } else {
      exportCommitteePointsToExcel(activeProgram.name, committeePointsData)
      toast.success('Committee Points Excel report downloaded')
    }
  }

  const handleExportPdf = () => {
    if (!activeProgram) return
    if (activeTab === 'attendance') {
      exportAttendanceToPdf(
        activeProgram.name,
        activeProgram.program_date,
        activeProgram.venue,
        attendanceExportList
      )
      toast.success('Attendance PDF downloaded')
    } else {
      exportCommitteePointsToPdf(activeProgram.name, committeePointsData)
      toast.success('Committee Points PDF downloaded')
    }
  }

  return (
    <div className="space-y-6 page-transition">
      {/* Top Header & Program Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance & Points Reports</h1>
          <p className="page-subtitle">Analyze real-time attendance, committee participation, and export official documents</p>
        </div>

        {/* Program picker */}
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-surface-400" />
          <select
            className="input font-semibold min-w-[220px]"
            value={selectedProgramId || activeProgram?.id || ''}
            onChange={(e) => setSelectedProgramId(e.target.value)}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({new Date(p.program_date).toLocaleDateString('en-IN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Program Summary Cards */}
      {activeProgram && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 border-l-4 border-teal-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500 font-medium uppercase">Total Check-Ins</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-surface-900 mt-1">{attendances.length}</p>
            <span className="text-xs text-surface-400">Members Present</span>
          </div>

          <div className="card p-4 border-l-4 border-primary-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500 font-medium uppercase">Zone Points</span>
              <Award className="w-4 h-4 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-surface-900 mt-1">{pointsSummary.zonePoints} / 21</p>
            <span className="text-xs text-surface-400">Zone Committee</span>
          </div>

          <div className="card p-4 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500 font-medium uppercase">Cluster Points</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-surface-900 mt-1">{pointsSummary.clusterPoints} / 12</p>
            <span className="text-xs text-surface-400">3 Clusters (4 pts each)</span>
          </div>

          <div className="card p-4 border-l-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500 font-medium uppercase">Unit Points</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-surface-900 mt-1">{pointsSummary.unitPoints} / 64</p>
            <span className="text-xs text-surface-400">16 Units (4 pts each)</span>
          </div>
        </div>
      )}

      {/* Tabs & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              activeTab === 'attendance'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 hover:bg-surface-100'
            )}
          >
            Member Attendance List ({attendances.length})
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              activeTab === 'points'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 hover:bg-surface-100'
            )}
          >
            Committee Points Standings ({committeePointsData.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="btn btn-secondary border border-green-200 text-green-700 hover:bg-green-50"
            title="Download formatted Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Excel Export</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="btn btn-secondary border border-red-200 text-red-700 hover:bg-red-50"
            title="Download printable PDF document (.pdf)"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Member Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search attendee by name, mobile, or committee..."
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-400" />
              <select
                className="input w-auto text-xs"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as 'all' | 'zone' | 'cluster' | 'unit')}
              >
                <option value="all">All Committee Levels</option>
                <option value="zone">Zone Committee Only</option>
                <option value="cluster">Cluster Committees Only</option>
                <option value="unit">Unit Committees Only</option>
              </select>
            </div>
          </div>

          {loadingAttendance ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
              <p className="text-sm text-surface-500">Loading attendee records...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="card p-8 text-center">
              <Users className="w-12 h-12 text-surface-300 mx-auto mb-2" />
              <p className="font-semibold text-surface-700">No attendance records found</p>
              <p className="text-xs text-surface-400 mt-1">
                {attendances.length === 0
                  ? 'No members have checked in for this program yet.'
                  : 'No records match your search filter.'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-12">#</th>
                      <th>Member Name</th>
                      <th>Mobile Number</th>
                      <th>Committee</th>
                      <th>Position</th>
                      <th>Time</th>
                      <th>Operator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((rec) => (
                      <tr key={rec.slNo}>
                        <td className="text-surface-400 text-xs font-mono">{rec.slNo}</td>
                        <td className="font-semibold text-surface-900">{rec.memberName}</td>
                        <td className="font-mono text-xs text-surface-600">{rec.mobile}</td>
                        <td>
                          <span className="badge badge-gray text-xs">{rec.committee}</span>
                        </td>
                        <td className="text-surface-700 text-xs font-medium">{rec.position}</td>
                        <td className="text-surface-500 text-xs">{rec.markedAt}</td>
                        <td className="text-xs text-surface-600">{rec.operatorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Committee Points Standings */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-16">Rank</th>
                    <th>Committee</th>
                    <th>Level</th>
                    <th>Cluster</th>
                    <th className="text-center">Total Seats</th>
                    <th className="text-center">Attended</th>
                    <th className="text-center">Points Earned</th>
                    <th className="text-center">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {committeePointsData.map((comm) => (
                    <tr key={comm.committeeName}>
                      <td>
                        <span
                          className={clsx(
                            'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs',
                            comm.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            comm.rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                            comm.rank === 3 ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                            'text-surface-500 font-mono'
                          )}
                        >
                          {comm.rank}
                        </span>
                      </td>
                      <td className="font-semibold text-surface-900">{comm.committeeName}</td>
                      <td>
                        <span
                          className={clsx(
                            'badge text-xs uppercase',
                            comm.level === 'zone' ? 'badge-blue' :
                            comm.level === 'cluster' ? 'badge-purple' : 'badge-gray'
                          )}
                        >
                          {comm.level}
                        </span>
                      </td>
                      <td className="text-xs text-surface-600">{comm.clusterName || '—'}</td>
                      <td className="text-center font-medium">{comm.totalPositions}</td>
                      <td className="text-center font-semibold text-teal-700">{comm.presentCount}</td>
                      <td className="text-center font-bold text-surface-900">
                        {comm.points}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-semibold">{comm.percentage}</span>
                          <div className="w-14 h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-600 rounded-full"
                              style={{ width: comm.percentage }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Users, Building2, CalendarCheck, CheckCircle,
  Star, ClipboardList, Award
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

function StatCard({ icon: Icon, label, value, sub, color, to }: {
  icon: React.ElementType, label: string, value: string | number,
  sub?: string, color: string, to?: string
}) {
  const content = (
    <div className={clsx('stat-card hover:shadow-card-hover transition-shadow duration-200', to && 'cursor-pointer')}>
      <div className="flex items-center justify-between">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {sub && <span className="text-xs text-surface-400">{sub}</span>}
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900">{value}</p>
        <p className="text-sm text-surface-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [members, programs, activeProgram, clusters, units, subwings, operators] = await Promise.all([
        supabase.from('members').select('id, is_active', { count: 'exact' }),
        supabase.from('programs').select('id, status', { count: 'exact' }),
        supabase.from('programs').select('id, name, venue, program_date, status').eq('status', 'active').maybeSingle(),
        supabase.from('clusters').select('id', { count: 'exact' }),
        supabase.from('units').select('id', { count: 'exact' }),
        supabase.from('sub_wings').select('id', { count: 'exact' }),
        supabase.from('attendance_operators').select('id, is_active', { count: 'exact' }),
      ])
      return {
        totalMembers: members.count ?? 0,
        activeMembers: (members.data ?? []).filter((m: { is_active: boolean }) => m.is_active).length,
        totalPrograms: programs.count ?? 0,
        activeProgram: activeProgram.data,
        totalClusters: clusters.count ?? 0,
        totalUnits: units.count ?? 0,
        totalSubwings: subwings.count ?? 0,
        totalOperators: operators.count ?? 0,
        activeOperators: (operators.data ?? []).filter((o: { is_active: boolean }) => o.is_active).length,
      }
    },
    refetchInterval: 30000,
  })

  const { data: activeProgramStats } = useQuery({
    queryKey: ['active-program-stats', stats?.activeProgram?.id],
    enabled: !!stats?.activeProgram?.id,
    queryFn: async () => {
      const programId = stats!.activeProgram!.id
      const [attendance, members, memberPositions] = await Promise.all([
        supabase.from('attendance').select('id', { count: 'exact' }).eq('program_id', programId),
        supabase.from('members').select('id').eq('is_active', true),
        supabase.from('member_positions').select('member_id, committee_id, committees(level)').eq('is_active', true),
      ])
      const presentCount = attendance.count ?? 0
      const totalMembers = (members.data ?? []).length
      const attendanceRes = await supabase.from('attendance').select('member_id').eq('program_id', programId)
      const presentMemberIds = new Set((attendanceRes.data ?? []).map((a: { member_id: string }) => a.member_id))

      // Points calculation
      let zonePoints = 0, clusterPoints = 0, unitPoints = 0
      const allMemberPositions = memberPositions.data ?? []
      for (const mp of allMemberPositions) {
        if (presentMemberIds.has(mp.member_id)) {
          const level = (mp.committees as unknown as { level: string } | null)?.level
          if (level === 'zone') zonePoints++
          else if (level === 'cluster') clusterPoints++
          else if (level === 'unit') unitPoints++
        }
      }
      return { presentCount, totalMembers, absentCount: totalMembers - presentCount, zonePoints, clusterPoints, unitPoints }
    },
    refetchInterval: 15000,
  })

  const { data: recentPrograms = [] } = useQuery<Program[]>({
    queryKey: ['recent-programs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .order('program_date', { ascending: false })
        .limit(5)
      return (data ?? []) as Program[]
    }
  })

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">SKSSF Chapparappadavu Zone — Attendance Management Overview</p>
      </div>

      {/* Active Program Banner */}
      {stats?.activeProgram && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-semibold uppercase tracking-wider">Program Active</span>
          </div>
          <h2 className="text-xl font-bold">{stats.activeProgram.name}</h2>
          <p className="text-green-100 text-sm mt-1">{stats.activeProgram.venue} • {new Date(stats.activeProgram.program_date).toLocaleDateString('en-IN')}</p>
          {activeProgramStats && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-bold">{activeProgramStats.presentCount}</p>
                <p className="text-xs text-green-100">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{activeProgramStats.absentCount}</p>
                <p className="text-xs text-green-100">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{activeProgramStats.zonePoints + activeProgramStats.clusterPoints + activeProgramStats.unitPoints}</p>
                <p className="text-xs text-green-100">Points Earned</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} sub={`${stats?.activeMembers ?? 0} active`} color="bg-primary-600" to="/admin/members" />
        <StatCard icon={Building2} label="Clusters" value={stats?.totalClusters ?? 0} sub="3 active" color="bg-purple-600" to="/admin/committees" />
        <StatCard icon={Building2} label="Units" value={stats?.totalUnits ?? 0} sub="16 total" color="bg-indigo-600" to="/admin/committees" />
        <StatCard icon={CalendarCheck} label="Programs" value={stats?.totalPrograms ?? 0} sub="total events" color="bg-blue-600" to="/admin/programs" />
        <StatCard icon={Star} label="Sub-Wings" value={stats?.totalSubwings ?? 0} color="bg-secondary-500" to="/admin/subwings" />
        <StatCard icon={ClipboardList} label="Operators" value={stats?.totalOperators ?? 0} sub={`${stats?.activeOperators ?? 0} active`} color="bg-teal-600" to="/admin/operators" />
        {activeProgramStats && (
          <>
            <StatCard icon={CheckCircle} label="Zone Points" value={`${activeProgramStats.zonePoints}/28`} sub="max 28 points" color="bg-green-600" />
            <StatCard icon={Award} label="Cluster Points" value={`${activeProgramStats.clusterPoints}/12`} sub="3 clusters (12 max)" color="bg-purple-600" />
            <StatCard icon={Award} label="Unit Points" value={`${activeProgramStats.unitPoints}/64`} sub="16 units (64 max)" color="bg-orange-500" />
            <StatCard icon={Award} label="Total Points" value={`${activeProgramStats.zonePoints + activeProgramStats.clusterPoints + activeProgramStats.unitPoints}/104`} sub="committee standings" color="bg-teal-600" />
          </>
        )}
      </div>

      {/* Points Overview for active program */}
      {activeProgramStats && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Points Overview — Current Program</h3>
            <span className="badge badge-green font-bold">
              {activeProgramStats.zonePoints + activeProgramStats.clusterPoints + activeProgramStats.unitPoints} / 104 Total Points
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Zone Committee (28 Positions)', value: activeProgramStats.zonePoints, max: 28, color: 'bg-primary-500' },
              { label: 'Cluster Committees (3 Clusters × 4 = 12 Positions)', value: activeProgramStats.clusterPoints, max: 12, color: 'bg-purple-500' },
              { label: 'Unit Committees (16 Units × 4 = 64 Positions)', value: activeProgramStats.unitPoints, max: 64, color: 'bg-indigo-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-surface-700">{item.label}</span>
                  <span className="text-sm font-semibold text-surface-900">{item.value} / {item.max}</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-500', item.color)}
                    style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Programs */}
      <div className="card p-5">
        <div className="section-header">
          <h3 className="section-title">Recent Programs</h3>
          <Link to="/admin/programs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
        </div>
        {recentPrograms && recentPrograms.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPrograms.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium text-surface-900">{p.name}</td>
                    <td>{new Date(p.program_date).toLocaleDateString('en-IN')}</td>
                    <td className="text-surface-500">{p.venue}</td>
                    <td>
                      <span className={clsx(
                        'badge',
                        p.status === 'active' ? 'badge-green' :
                        p.status === 'upcoming' ? 'badge-yellow' : 'badge-gray'
                      )}>
                        {p.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-surface-400">
            <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No programs yet. <Link to="/admin/programs" className="text-primary-600 hover:underline">Create one</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}

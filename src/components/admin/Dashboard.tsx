import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import {
  Users, Building2, CalendarCheck, CheckCircle,
  Star, ClipboardList, Award, Sparkles, Monitor,
  Share2, Copy, ExternalLink, Plus, Check
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { useToast } from '@/components/shared/Toaster'
import LiveAttendanceMonitorModal from './LiveAttendanceMonitorModal'

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
  const toast = useToast()
  const [monitorOpen, setMonitorOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [members, programs, activeProgram, clusters, units, subwings, operators] = await Promise.all([
        supabase.from('members').select('id, is_active', { count: 'exact' }),
        supabase.from('programs').select('id, status', { count: 'exact' }),
        supabase.from('programs').select('*').eq('status', 'active').maybeSingle(),
        supabase.from('clusters').select('id', { count: 'exact' }),
        supabase.from('units').select('id', { count: 'exact' }),
        supabase.from('sub_wings').select('id', { count: 'exact' }),
        supabase.from('attendance_operators').select('id, is_active', { count: 'exact' }),
      ])
      return {
        totalMembers: members.count ?? 0,
        activeMembers: (members.data ?? []).filter((m: { is_active: boolean }) => m.is_active).length,
        totalPrograms: programs.count ?? 0,
        activeProgram: activeProgram.data as Program | null,
        totalClusters: clusters.count ?? 0,
        totalUnits: units.count ?? 0,
        totalSubwings: subwings.count ?? 0,
        totalOperators: operators.count ?? 0,
        activeOperators: (operators.data ?? []).filter((o: { is_active: boolean }) => o.is_active).length,
      }
    },
    refetchInterval: 15000,
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
    refetchInterval: 10000,
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
      {stats?.activeProgram ? (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-xl animate-fade-in space-y-4 border border-emerald-400/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                Live Attendance Now Active
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMonitorOpen(true)}
                className="btn bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Open Live Monitor (തത്സമയം കാണുക)</span>
              </button>

              <button
                onClick={() => window.open(`/admin/projector/${stats.activeProgram!.id}`, '_blank')}
                className="btn bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Projector</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">{stats.activeProgram.name}</h2>
            <p className="text-emerald-100 text-sm mt-1">
              📍 {stats.activeProgram.venue} • 📅 {new Date(stats.activeProgram.program_date).toLocaleDateString('en-IN')}
            </p>
          </div>

          {/* Direct Shareable Link Card */}
          <div className="bg-black/30 border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-emerald-300">
                📢 ഹാജർ രേഖപ്പെടുത്താനുള്ള ലിങ്ക് (Attendance Link):
              </span>
              <span className="text-emerald-200 text-[11px]">
                (പ്രത്യേക പാസ്‌വേർഡ് ആവശ്യമില്ല — മൊബൈൽ നമ്പർ നൽകി OK കൊടുത്താൽ മതി)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                readOnly
                value={`${window.location.origin}/attend/${stats.activeProgram.id}`}
                className="flex-1 min-w-[200px] bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white select-all outline-none"
              />

              <button
                onClick={() => {
                  const url = `${window.location.origin}/attend/${stats.activeProgram!.id}`
                  navigator.clipboard.writeText(url)
                  setCopied(true)
                  toast.success('Attendance link copied to clipboard!')
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="btn bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-3 rounded-xl transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                onClick={() => {
                  const p = stats.activeProgram!
                  const url = `${window.location.origin}/attend/${p.id}`
                  const text = `*SKSSF ചപ്പാരപ്പടവ് മേഖല*\n📢 *മീറ്റിംഗ് ഹാജർ രേഖപ്പെടുത്തൽ (ATTENDANCE)*\n\n📌 *${p.name}*\n📍 *സ്ഥലം (Venue):* ${p.venue}\n\n👉 യോഗത്തിൽ പങ്കെടുത്തവർ താഴെ നൽകിയ ലിങ്കിൽ മൊബൈൽ നമ്പർ നൽകി ഹാജർ കൺഫോം ചെയ്യുക:\n🔗 ${url}\n\n(പ്രത്യേക പാസ്‌വേർഡ് ആവശ്യമില്ല. മൊബൈൽ നമ്പർ നൽകി കൺഫോം ചെയ്യുക)`
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
                }}
                className="btn bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>വാട്‌സാപ്പിൽ ഷെയർ ചെയ്യുക</span>
              </button>

              <a
                href={`/attend/${stats.activeProgram.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold py-2 px-3 rounded-xl transition flex items-center gap-1.5"
              >
                <span>ഹാജർ പേജ് തുറക്കുക</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {activeProgramStats && (
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/20">
              <div className="text-center bg-black/20 rounded-xl p-3 border border-white/10">
                <p className="text-3xl font-black text-white">{activeProgramStats.presentCount}</p>
                <p className="text-xs text-emerald-200 mt-0.5">Present (ഹാജർ)</p>
              </div>
              <div className="text-center bg-black/20 rounded-xl p-3 border border-white/10">
                <p className="text-3xl font-black text-slate-300">{activeProgramStats.absentCount}</p>
                <p className="text-xs text-slate-300 mt-0.5">Absent (ബാക്കി)</p>
              </div>
              <div className="text-center bg-black/20 rounded-xl p-3 border border-white/10">
                <p className="text-3xl font-black text-amber-300">
                  {activeProgramStats.presentCount}
                </p>
                <p className="text-xs text-amber-200 mt-0.5">Points Earned (+1/person)</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Program Prompt */
        <div className="card p-6 border-2 border-dashed border-emerald-400/50 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/20">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-surface-900">
                മീറ്റിംഗ് ഹാജർ ലിങ്ക് (Meeting Attendance Link)
              </h3>
              <p className="text-sm text-surface-600 mt-0.5">
                നിലവിൽ സജീവമായ മീറ്റിംഗുകൾ ഇല്ല. പുതിയ മീറ്റിംഗ് ആരംഭിച്ച് വാട്‌സാപ്പിൽ ഷെയർ ചെയ്യാവുന്ന ഹാജർ ലിങ്ക് ഉടൻ നേടുക!
              </p>
            </div>
          </div>
          <Link
            to="/admin/programs"
            className="btn btn-primary font-black whitespace-nowrap shadow-md shadow-primary-600/20 px-5 py-3"
          >
            <Plus className="w-4 h-4" /> പുതിയ മീറ്റിംഗ് ആരംഭിക്കുക (Start Meeting)
          </Link>
        </div>
      )}

      {/* Live Monitor Modal */}
      {monitorOpen && stats?.activeProgram && (
        <LiveAttendanceMonitorModal
          program={stats.activeProgram}
          onClose={() => setMonitorOpen(false)}
        />
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

import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Program, type BranchActivity } from '@/lib/supabase'
import {
  Building2, Trophy, Flame, CalendarCheck, ChevronRight
} from 'lucide-react'

export default function AppHomeScreen() {
  const { profile, secretaryAccount, isAdmin, isSecretary } = useAuth()

  const userName = secretaryAccount?.name || profile?.full_name || 'സഹപ്രവർത്തകരെ'
  const branchName = secretaryAccount?.unit?.name || 'ചപ്പാരപ്പടവ് മേഖല'

  // Fetch branch profile to check completion %
  const unitId = secretaryAccount?.unit_id
  const { data: branchProf } = useQuery({
    queryKey: ['app-home-branch-prof', unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data } = await supabase
        .from('branch_profiles')
        .select('*')
        .eq('unit_id', unitId)
        .maybeSingle()
      return data
    },
  })

  // Calculate profile completion percentage
  let completionPct = 25
  if (branchProf) {
    let score = 25
    if (branchProf.president_name && branchProf.president_mobile) score += 20
    if (branchProf.secretary_name && branchProf.secretary_mobile) score += 15
    if (branchProf.mahallu_name) score += 20
    if (Array.isArray(branchProf.committee_members_list) && branchProf.committee_members_list.length > 0) score += 20
    completionPct = Math.min(100, score)
  }

  // Fetch recent programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['app-home-programs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .order('program_date', { ascending: false })
        .limit(2)
      return (data || []) as Program[]
    },
  })

  // Fetch recent activities
  const { data: activities = [] } = useQuery<BranchActivity[]>({
    queryKey: ['app-home-activities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('branch_activities')
        .select('*, unit:units(name)')
        .order('activity_date', { ascending: false })
        .limit(3)
      return (data || []) as BranchActivity[]
    },
  })

  return (
    <div className="space-y-5">
      {/* ── 1. Greeting & Branch Identity Card ── */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
              {isAdmin ? 'Super Administrator' : 'Branch Secretary'}
            </span>
            <h2 className="text-lg font-black mt-2 tracking-tight">
              അസ്സലാമു അലൈക്കും, {userName}
            </h2>
            <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
              {branchName}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-inner backdrop-blur-xs">
            🏢
          </div>
        </div>

        {/* Profile Completion Bar for Secretary */}
        {isSecretary && (
          <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-200">
              <span>ശാഖാ പ്രൊഫൈൽ പൂർത്തീകരണം</span>
              <span>{completionPct}%</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {completionPct < 100 && (
              <Link
                to="/app/branches"
                className="text-[10px] text-emerald-300 font-bold hover:underline flex items-center gap-1 pt-0.5"
              >
                <span>ബാക്കി വിവരങ്ങൾ പൂരിപ്പിക്കുക</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Quick Action Grid (App Style) ── */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'ശാഖാ വിവരം', icon: Building2, path: '/app/branches', color: 'bg-emerald-50 text-emerald-700' },
          { label: 'പ്രവർത്തനം', icon: Flame, path: '/app/activities', color: 'bg-amber-50 text-amber-700' },
          { label: 'സ്കോർബോർഡ്', icon: Trophy, path: '/app/reports', color: 'bg-indigo-50 text-indigo-700' },
          { label: 'ലൈവ് ഹാജർ', icon: CalendarCheck, path: '/attend', color: 'bg-teal-50 text-teal-700' },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="bg-white rounded-2xl p-2.5 border border-surface-200 shadow-xs hover:shadow-sm active:scale-95 transition flex flex-col items-center justify-center gap-1.5"
          >
            <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center font-bold`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-surface-800 leading-tight">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── 3. Meetings & Programs Strip ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-xs text-surface-800 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>മീറ്റിംഗുകൾ & പരിപാടികൾ</span>
          </h3>
          <Link to="/attend" className="text-[11px] font-bold text-emerald-700 hover:underline">
            ഹാജർ ലിങ്ക്
          </Link>
        </div>

        {programs.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center border border-surface-200 text-xs text-surface-400">
            പുതിയ മീറ്റിംഗുകൾ ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല.
          </div>
        ) : (
          <div className="space-y-2">
            {programs.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-3.5 border border-surface-200 shadow-xs flex items-center justify-between hover:border-emerald-300 transition"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      p.status === 'active' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-surface-100 text-surface-600'
                    }`}>
                      {p.status === 'active' ? '● LIVE' : p.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-surface-400">
                      {new Date(p.program_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-surface-900 mt-0.5">{p.name}</h4>
                  {p.venue && <p className="text-[10px] text-surface-500">{p.venue}</p>}
                </div>

                <Link
                  to={`/attend/${p.id}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                >
                  ഹാജർ
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Recent Branch Activities Feed ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-xs text-surface-800 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>സമീപകാല പ്രവർത്തനങ്ങൾ (Activities)</span>
          </h3>
          <Link to="/app/activities" className="text-[11px] font-bold text-emerald-700 hover:underline">
            കൂടുതൽ
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-surface-200 text-xs text-surface-400">
            പ്രവർത്തന റിപ്പോർട്ടുകൾ ചേർത്തിട്ടില്ല. പ്രവർത്തനങ്ങൾ ടാബിൽ നിന്നും പുതിയത് ചേർക്കാം.
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-2xl p-3.5 border border-surface-200 shadow-xs space-y-1.5 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {act.unit?.name || 'Branch'}
                  </span>
                  <span className="text-[10px] text-surface-400">
                    {new Date(act.activity_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-surface-900">{act.title}</h4>
                <p className="text-[11px] text-surface-600 line-clamp-2">{act.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

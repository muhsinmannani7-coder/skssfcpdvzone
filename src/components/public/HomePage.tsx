import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Video, type Announcement, type Program } from '@/lib/supabase'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import {
  Shield, Trophy, PlaySquare, Building2,
  CalendarCheck, Bell, ChevronRight, ArrowRight,
  Phone, Calendar, MapPin
} from 'lucide-react'

export default function HomePage() {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)

  // Fetch Units for 16-branches count and cluster grouping
  const { data: units = [] } = useQuery({
    queryKey: ['home-units'],
    queryFn: async () => {
      const { data } = await supabase
        .from('units')
        .select('id, name, cluster_id, clusters(id, name, code)')
        .eq('is_active', true)
        .order('name')
      return data || []
    },
  })

  // Fetch upcoming programs / meetings
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['home-programs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .order('program_date', { ascending: false })
        .limit(3)
      return (data || []) as Program[]
    },
  })

  // Fetch top branch scores for preview
  const { data: topScores = [] } = useQuery({
    queryKey: ['home-top-scores'],
    queryFn: async () => {
      const { data } = await supabase
        .from('branch_scores')
        .select('unit_id, marks, units(id, name, clusters(name, code))')
        .eq('is_published', true)
      if (!data) return []

      // Group by unit_id
      const map = new Map<string, { unitName: string; clusterCode: string; total: number }>()
      data.forEach((s: any) => {
        const id = s.unit_id
        if (!map.has(id)) {
          map.set(id, {
            unitName: s.units?.name || 'Unit',
            clusterCode: s.units?.clusters?.code || '—',
            total: 0,
          })
        }
        map.get(id)!.total += Number(s.marks || 0)
      })

      const arr = Array.from(map.values())
      arr.sort((a, b) => b.total - a.total)
      return arr.slice(0, 3)
    },
  })

  // Fetch featured / latest videos
  const { data: featuredVideos = [] } = useQuery<Video[]>({
    queryKey: ['home-featured-videos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3)
      return (data || []) as Video[]
    },
  })

  // Fetch latest announcements
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['home-announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3)
      return (data || []) as Announcement[]
    },
  })

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 space-y-16 pb-16">
        {/* ── 1. Hero Section ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-teal-900 to-emerald-950 text-white py-16 sm:py-24">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Shield className="w-4 h-4" />
              <span>SKSSF Chapparappadavu Zone Official Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
              സമഗ്ര ഡിജിറ്റൽ ഓർഗനൈസേഷണൽ പ്ലാറ്റ്‌ഫോം
            </h1>

            <p className="text-emerald-100/80 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
              ചപ്പാരപ്പടവ് മേഖലയിലെ 16 ശാഖകൾ, മീറ്റിംഗ് അറ്റൻഡൻസ്, ശാഖാ സ്കോർബോർഡ്, മസീറ 2026 പരിപാടികൾ,
              വീഡിയോകൾ എന്നിവയെല്ലാം ഒരൊറ്റ കുടക്കീഴിൽ.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/attend"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 font-extrabold text-sm shadow-lg hover:from-emerald-300 hover:to-teal-300 transition"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>ഹാജർ രേഖപ്പെടുത്തുക (Live Attendance)</span>
              </Link>

              <Link
                to="/scoreboard"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>ശാഖാ സ്കോർബോർഡ്</span>
              </Link>
            </div>

            {/* Key Statistics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-8">
              {[
                { label: 'ശാഖകൾ', val: '16 ശാഖകൾ', desc: '3 ക്ലസ്റ്ററുകൾ' },
                { label: 'ഇവാല്യുവേഷൻ', val: '100 Marks', desc: '7 പ്രോജക്റ്റുകൾ' },
                { label: 'ലൈവ് ഹാജർ', val: 'Digital Kiosk', desc: 'Instant Verification' },
                { label: 'കമ്മ്യൂണിറ്റി', val: 'Ulama & Doctors', desc: 'Direct Directory' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm text-left">
                  <p className="text-emerald-300 text-[11px] font-bold uppercase">{stat.label}</p>
                  <p className="text-lg font-black text-white mt-0.5">{stat.val}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. Top Branch Performance Showcase ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-3xl border border-emerald-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Leaderboard Standings
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-surface-900 mt-1">
                  ശാഖാ പെർഫോമൻസ് സ്കോർബോർഡ് (100 Marks)
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  മസീറ, ഖുതുബിയ്യത്ത്, ഹിദായ, എഡ്യൂവിഷൻ, റഹ്മ, സഹചാരി, ഉലമാ-ഉമറാ സംഗമം എന്നിവയിലെ ടോപ്പ് ശാഖകൾ.
                </p>
              </div>

              <Link
                to="/scoreboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition self-start sm:self-auto"
              >
                <span>മുഴുവൻ സ്കോറുകൾ കാണുക</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topScores.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-emerald-100 text-surface-500 text-xs">
                സ്കോർബോർഡ് വിവരങ്ങൾ ഉടൻ അപ്‌ഡേറ്റ് ചെയ്യുന്നതാണ്.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topScores.map((item, idx) => (
                  <div
                    key={item.unitName}
                    className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm shadow-xs">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-surface-900">{item.unitName}</h4>
                        <span className="text-[11px] text-surface-400 font-semibold">{item.clusterCode}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-800">{item.total}</span>
                      <span className="text-[10px] text-surface-400 font-bold block">/ 100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 3. Total 16 Branches Showcase ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Zone Network
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-surface-900 mt-1">
                മേഖലയിലെ 16 ശാഖകൾ (Branches)
              </h2>
            </div>
            <Link
              to="/branches"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>ഭാരവാഹികളുടെ കോൺടാക്റ്റുകൾ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {units.map((u: any) => (
              <Link
                key={u.id}
                to="/branches"
                className="bg-white rounded-2xl border border-surface-200 p-3 hover:border-emerald-400 hover:shadow-sm transition flex flex-col items-center text-center group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-surface-800 text-[11px] line-clamp-2 leading-tight">
                  {u.name}
                </span>
                <span className="text-[9px] font-semibold text-surface-400 mt-1 uppercase">
                  {u.clusters?.code}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 4. Upcoming Meetings & Announcements Split ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Meetings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-lg font-bold text-surface-900">മീറ്റിംഗുകൾ & പരിപാടികൾ</h3>
                </div>
                <Link to="/attend" className="text-xs font-bold text-emerald-700 hover:underline">
                  ഹാജർ ലിങ്ക്
                </Link>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-surface-200 text-surface-400 text-xs">
                  മീറ്റിംഗുകൾ ലഭ്യമല്ല
                </div>
              ) : (
                <div className="space-y-3">
                  {programs.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-surface-200 p-4 shadow-xs flex items-center justify-between hover:border-emerald-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                              : 'bg-surface-100 text-surface-600'
                          }`}>
                            {p.status === 'active' ? '● LIVE' : p.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-surface-400">
                            {new Date(p.program_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <h4 className="font-bold text-surface-900 text-sm">{p.name}</h4>
                        {p.venue && (
                          <p className="text-xs text-surface-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-surface-400" />
                            <span>{p.venue}</span>
                          </p>
                        )}
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

            {/* Announcements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-lg font-bold text-surface-900">ഏറ്റവും പുതിയ അറിയിപ്പുകൾ</h3>
                </div>
                <Link to="/announcements" className="text-xs font-bold text-emerald-700 hover:underline">
                  എല്ലാം കാണുക
                </Link>
              </div>

              {announcements.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-surface-200 text-surface-400 text-xs">
                  പുതിയ അറിയിപ്പുകൾ ഒന്നുമില്ല
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white rounded-2xl border border-surface-200 p-4 shadow-xs space-y-1 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {a.category}
                        </span>
                        <span className="text-[10px] text-surface-400">
                          {new Date(a.published_at || a.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <h4 className="font-bold text-surface-900 text-sm">{a.title}</h4>
                      <p className="text-xs text-surface-500 line-clamp-2">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 5. Video Hub Preview ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <PlaySquare className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Media Hub
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-surface-900 mt-1">
                വീഡിയോ ലൈബ്രറി (Featured Videos)
              </h2>
            </div>
            <Link
              to="/videos"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>എല്ലാ വീഡിയോകളും കാണുക</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {featuredVideos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-surface-200 text-surface-400 text-xs">
              വീഡിയോകൾ ഉടൻ ലഭ്യമാക്കും.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVideos.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setActiveVideo(v)}
                  className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={v.thumbnail_url || `https://img.youtube.com/vi/${v.youtube_video_id}/hqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <PlaySquare className="w-5 h-5 fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5">
                    <h4 className="font-bold text-surface-900 text-xs line-clamp-2">{v.title}</h4>
                    <span className="text-[10px] text-surface-400 mt-1 block">{v.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 6. Quick Helplines & Contact ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-900 text-white rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Help & Support
              </span>
              <h3 className="text-xl sm:text-2xl font-black">
                സംഘടനാപരമായ സഹായങ്ങൾക്കും വിവരങ്ങൾക്കും
              </h3>
              <p className="text-xs text-surface-400 max-w-xl">
                മേഖലാ കമ്മിറ്റി ഭാരവാഹികളുമായോ ഉലമാ-ഡോക്ടേഴ്സ് ഡയറക്ടറിയുമായോ നേരിട്ട് ബന്ധപ്പെടാം.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/directory"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>ഡയറക്ടറി കാണുക</span>
              </Link>
              <Link
                to="/branches"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-semibold text-xs border border-surface-700 transition"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>16 ശാഖാ ഭാരവാഹികൾ</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Embedded Player Modal if active */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtube_video_id}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-surface-800">{activeVideo.title}</h3>
                <Link to="/videos" className="text-xs text-emerald-700 hover:underline">
                  വീഡിയോ ഹബ്ബിൽ കൂടുതൽ കാണുക & അഭിപ്രായം പറയുക →
                </Link>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="px-3 py-1.5 rounded-lg bg-surface-100 text-surface-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  )
}

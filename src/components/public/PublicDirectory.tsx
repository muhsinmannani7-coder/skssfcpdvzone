import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type UlamaItem, type DoctorItem } from '@/lib/supabase'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import {
  Users, Stethoscope, Phone, Search, Building
} from 'lucide-react'
import { clsx } from 'clsx'

export default function PublicDirectory() {
  const [activeTab, setActiveTab] = useState<'ulama' | 'doctors'>('ulama')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch Ulama
  const { data: ulama = [], isLoading: ulamaLoading } = useQuery<UlamaItem[]>({
    queryKey: ['public-ulama'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ulama_directory')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
      if (error) {
        console.warn('Ulama fetch error:', error.message)
        return []
      }
      return (data || []) as UlamaItem[]
    },
  })

  // Fetch Doctors
  const { data: doctors = [], isLoading: doctorsLoading } = useQuery<DoctorItem[]>({
    queryKey: ['public-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors_directory')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
      if (error) {
        console.warn('Doctors fetch error:', error.message)
        return []
      }
      return (data || []) as DoctorItem[]
    },
  })

  const isLoading = activeTab === 'ulama' ? ulamaLoading : doctorsLoading

  // Filter lists
  const filteredUlama = ulama.filter((u) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      (u.mahallu && u.mahallu.toLowerCase().includes(q)) ||
      (u.title && u.title.toLowerCase().includes(q))
    )
  })

  const filteredDoctors = doctors.filter((d) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      d.name.toLowerCase().includes(q) ||
      (d.specialization && d.specialization.toLowerCase().includes(q)) ||
      (d.hospital && d.hospital.toLowerCase().includes(q))
    )
  })

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Community Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            ഉലമാ & ഡോക്ടേഴ്സ് ഡയറക്ടറി
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            മേഖലാ പരിധിയിലെ സയ്യിദന്മാർ, പണ്ഡിതന്മാർ, മതനേതാക്കൾ, ഡോക്ടർമാർ എന്നിവരുടെ വിവരങ്ങൾ.
          </p>
        </div>

        {/* Tab & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-surface-200/60 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('ulama')}
              className={clsx(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition flex-1 sm:flex-none justify-center',
                activeTab === 'ulama'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              )}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>ഉലമാക്കൾ (Ulama)</span>
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={clsx(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition flex-1 sm:flex-none justify-center',
                activeTab === 'doctors'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              )}
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>ഡോക്ടർമാർ (Doctors)</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-400" />
            <input
              type="text"
              placeholder={activeTab === 'ulama' ? 'പേര് / മഹല്ല് തിരയുക...' : 'പേര് / സ്പെഷ്യലൈസേഷൻ...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-2" />
            <p className="text-xs text-surface-500 font-medium">ഡയറക്ടറി ലോഡ് ചെയ്യുന്നു...</p>
          </div>
        ) : activeTab === 'ulama' ? (
          filteredUlama.length === 0 ? (
            <div className="p-16 text-center text-surface-400 bg-white rounded-2xl border border-surface-200">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="text-sm font-semibold">വിവരങ്ങൾ ലഭ്യമല്ല</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUlama.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm hover:shadow-md transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    {u.title && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {u.title}
                      </span>
                    )}
                    <h3 className="font-bold text-surface-900 text-sm">{u.name}</h3>
                    {u.mahallu && (
                      <p className="text-xs text-surface-500 flex items-center gap-1">
                        <Building className="w-3 h-3 text-surface-400" />
                        <span>{u.mahallu}</span>
                      </p>
                    )}
                  </div>
                  {u.mobile && (
                    <a
                      href={`tel:${u.mobile}`}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs flex-shrink-0"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )
        ) : filteredDoctors.length === 0 ? (
          <div className="p-16 text-center text-surface-400 bg-white rounded-2xl border border-surface-200">
            <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-600" />
            <p className="text-sm font-semibold">വിവരങ്ങൾ ലഭ്യമല്ല</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm hover:shadow-md transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-surface-900 text-sm">{d.name}</h3>
                  {d.specialization && (
                    <p className="text-xs font-semibold text-teal-700">{d.specialization}</p>
                  )}
                  {d.hospital && (
                    <p className="text-xs text-surface-500 flex items-center gap-1">
                      <Building className="w-3 h-3 text-surface-400" />
                      <span>{d.hospital}</span>
                    </p>
                  )}
                </div>
                {d.mobile && (
                  <a
                    href={`tel:${d.mobile}`}
                    className="p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition shadow-xs flex-shrink-0"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}


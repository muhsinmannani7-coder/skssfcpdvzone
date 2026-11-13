import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type BranchProfile } from '@/lib/supabase'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import {
  Building2, Phone, User, Search, MapPin
} from 'lucide-react'
import { clsx } from 'clsx'

interface UnitInfo {
  id: string
  name: string
  cluster_id: string
  clusters: { id: string; name: string; code: string } | null
}

export default function PublicBranches() {
  const [selectedCluster, setSelectedCluster] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch 16 units
  const { data: units = [], isLoading: unitsLoading } = useQuery<UnitInfo[]>({
    queryKey: ['public-branches-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, name, cluster_id, clusters(id, name, code)')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data || []) as unknown as UnitInfo[]
    },
  })

  // Fetch branch profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<BranchProfile[]>({
    queryKey: ['public-branch-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_profiles')
        .select('*')
      if (error) {
        console.warn('Branch profiles table fetch:', error.message)
        return []
      }
      return (data || []) as BranchProfile[]
    },
  })

  const isLoading = unitsLoading || profilesLoading

  // Profile map
  const profileMap = new Map<string, BranchProfile>()
  profiles.forEach(p => profileMap.set(p.unit_id, p))

  // Filtered units
  const filteredUnits = units.filter((u) => {
    const matchesCluster = selectedCluster === 'all'
      ? true
      : u.clusters?.code === selectedCluster || u.cluster_id === selectedCluster
    const matchesSearch = searchQuery.trim() === ''
      ? true
      : u.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCluster && matchesSearch
  })

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> 16 Branches Under Chapparappadavu Zone
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            ശാഖാ ഡയറക്ടറി (Branch Directory)
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            മേഖലാ പരിധിയിലെ 16 ശാഖകളുടെ വിവരങ്ങളും പ്രസിഡന്റ്, ജനറൽ സെക്രട്ടറി എന്നിവരുടെ കോൺടാക്റ്റുകളും.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-surface-200/60 rounded-2xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All 16 ശാഖകൾ' },
              { id: 'PAD', label: 'പടപ്പേങ്ങാട് ക്ലസ്റ്റർ' },
              { id: 'KUT', label: 'കുട്ടപ്പറമ്പ് ക്ലസ്റ്റർ' },
              { id: 'PER', label: 'പെരുമളാബാദ് ക്ലസ്റ്റർ' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCluster(tab.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap',
                  selectedCluster === tab.id
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-surface-600 hover:text-surface-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-400" />
            <input
              type="text"
              placeholder="ശാഖ തിരയുക..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Units Grid */}
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-2" />
            <p className="text-xs text-surface-500 font-medium">ശാഖാ വിവരങ്ങൾ ശേഖരിക്കുന്നു...</p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="p-16 text-center text-surface-400 bg-white rounded-2xl border border-surface-200">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">ശാഖകൾ കണ്ടെത്തിയില്ല</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUnits.map((unit) => {
              const prof = profileMap.get(unit.id)
              return (
                <div
                  key={unit.id}
                  className="bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {unit.clusters?.name || 'ZONE'}
                      </span>
                      <span className="text-[10px] font-semibold text-surface-400">
                        {unit.clusters?.code}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-surface-900 text-base mt-2 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{unit.name}</span>
                    </h3>

                    {prof?.address && (
                      <p className="text-xs text-surface-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-surface-400 flex-shrink-0" />
                        <span>{prof.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Office Bearers Contacts */}
                  <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-100 space-y-2.5">
                    {/* President */}
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-surface-400 block">
                          പ്രസിഡന്റ് (President)
                        </span>
                        <span className="font-bold text-surface-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-600" />
                          {prof?.president_name || 'പ്രസിഡന്റ്'}
                        </span>
                      </div>
                      {prof?.president_mobile ? (
                        <a
                          href={`tel:${prof.president_mobile}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shadow-xs hover:bg-emerald-700 transition"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-surface-400 italic">—</span>
                      )}
                    </div>

                    {/* Secretary */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-200/60">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-surface-400 block">
                          ജനറൽ സെക്രട്ടറി (General Secretary)
                        </span>
                        <span className="font-bold text-surface-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-teal-600" />
                          {prof?.secretary_name || 'ജനറൽ സെക്രട്ടറി'}
                        </span>
                      </div>
                      {prof?.secretary_mobile ? (
                        <a
                          href={`tel:${prof.secretary_mobile}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-[11px] shadow-xs hover:bg-teal-700 transition"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-surface-400 italic">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}

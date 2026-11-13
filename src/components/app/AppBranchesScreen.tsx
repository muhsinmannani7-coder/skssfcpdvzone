import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Unit, type BranchProfile } from '@/lib/supabase'
import BranchDetailsForm from '@/components/shared/BranchDetailsForm'
import {
  Building2, Edit2, Phone, Search,
  CheckCircle2, Clock, MapPin, X
} from 'lucide-react'
import { clsx } from 'clsx'

export default function AppBranchesScreen() {
  const { secretaryAccount, isAdmin, isSecretary } = useAuth()
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<{ id: string; name: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [clusterFilter, setClusterFilter] = useState<'all' | 'PAD' | 'KUT' | 'PER'>('all')

  // Fetch 16 units
  const { data: units = [], isLoading: unitsLoading } = useQuery<Unit[]>({
    queryKey: ['app-branches-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*, cluster:clusters(*)')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data || []) as Unit[]
    },
  })

  // Fetch branch profiles
  const { data: profiles = [], refetch: refetchProfiles } = useQuery<BranchProfile[]>({
    queryKey: ['app-branches-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('branch_profiles').select('*')
      return (data || []) as BranchProfile[]
    },
  })

  const profileMap = new Map<string, BranchProfile>()
  profiles.forEach((p) => profileMap.set(p.unit_id, p))

  const myUnitId = secretaryAccount?.unit_id
  const myUnit = units.find((u) => u.id === myUnitId)
  const myProfile = myUnitId ? profileMap.get(myUnitId) : null

  // Filtered branches
  const filteredUnits = units.filter((u) => {
    const matchesCluster = clusterFilter === 'all' || u.cluster?.code === clusterFilter
    const matchesSearch = !searchQuery.trim() || u.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCluster && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* ── If Edit Modal is Active ── */}
      {selectedUnitForEdit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-surface-100 pb-2">
              <h3 className="font-extrabold text-sm text-surface-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{selectedUnitForEdit.name} — വിശദാംശങ്ങൾ</span>
              </h3>
              <button
                onClick={() => setSelectedUnitForEdit(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <BranchDetailsForm
              unitId={selectedUnitForEdit.id}
              unitName={selectedUnitForEdit.name}
              isSecretaryView={isSecretary && selectedUnitForEdit.id === myUnitId}
              onSuccess={() => {
                refetchProfiles()
                setSelectedUnitForEdit(null)
              }}
              onCancel={() => setSelectedUnitForEdit(null)}
            />
          </div>
        </div>
      )}

      {/* ── My Branch Highlight Card (For Secretary) ── */}
      {isSecretary && myUnit && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                നിങ്ങളുടെ ശാഖ (Assigned Branch)
              </span>
              <h2 className="text-base font-black mt-1.5">{myUnit.name}</h2>
              <p className="text-xs text-emerald-100">{myUnit.cluster?.name}</p>
            </div>

            <button
              onClick={() => setSelectedUnitForEdit({ id: myUnit.id, name: myUnit.name })}
              className="px-3.5 py-1.5 bg-white text-emerald-800 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-50 active:scale-95 transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>വിവരങ്ങൾ മാറ്റുക</span>
            </button>
          </div>

          <div className="bg-black/15 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-emerald-200 block">പ്രസിഡന്റ്:</span>
              <span className="font-bold">{myProfile?.president_name || 'പൂരിപ്പിച്ചിട്ടില്ല'}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-200 block">ജനറൽ സെക്രട്ടറി:</span>
              <span className="font-bold">{myProfile?.secretary_name || secretaryAccount?.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 p-1 bg-surface-200/60 rounded-2xl overflow-x-auto text-[11px] font-bold">
          {[
            { id: 'all', label: 'എല്ലാ ശാഖകളും (16)' },
            { id: 'PAD', label: 'പടപ്പേങ്ങാട്' },
            { id: 'KUT', label: 'കുട്ടപ്പറമ്പ്' },
            { id: 'PER', label: 'പെരുമളാബാദ്' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setClusterFilter(tab.id as any)}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition whitespace-nowrap',
                clusterFilter === tab.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-surface-600 hover:text-surface-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-400" />
          <input
            type="text"
            placeholder="ശാഖ തിരയുക..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ── 16 Branches Directory List ── */}
      <div className="space-y-2.5">
        {unitsLoading ? (
          <div className="p-12 text-center text-xs text-surface-400">ലോഡ് ചെയ്യുന്നു...</div>
        ) : filteredUnits.length === 0 ? (
          <div className="p-12 text-center text-xs text-surface-400 bg-white rounded-2xl">
            ശാഖകൾ കണ്ടെത്തിയില്ല.
          </div>
        ) : (
          filteredUnits.map((u) => {
            const prof = profileMap.get(u.id)
            const isApproved = prof?.profile_status === 'approved'
            const isSubmitted = prof?.profile_status === 'submitted'
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-surface-200 p-3.5 shadow-xs hover:shadow-sm transition space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {u.cluster?.code}
                      </span>
                      {isApproved ? (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> Submitted
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-surface-400 bg-surface-100 px-1.5 py-0.2 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-xs text-surface-900 mt-1">{u.name}</h4>
                    {prof?.location && (
                      <p className="text-[10px] text-surface-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{prof.location}</span>
                      </p>
                    )}
                  </div>

                  {/* Edit / View Details Button */}
                  <button
                    onClick={() => setSelectedUnitForEdit({ id: u.id, name: u.name })}
                    className="px-2.5 py-1 rounded-xl bg-surface-100 hover:bg-emerald-50 hover:text-emerald-700 text-surface-700 font-bold text-[11px] transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isAdmin ? 'Manage' : 'Details'}</span>
                  </button>
                </div>

                {/* Contacts strip */}
                <div className="bg-surface-50 p-2.5 rounded-xl border border-surface-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-surface-400 font-medium">സെക്രട്ടറി: </span>
                    <span className="font-bold text-surface-800">{prof?.secretary_name || '—'}</span>
                  </div>
                  {prof?.secretary_mobile && (
                    <a
                      href={`tel:${prof.secretary_mobile}`}
                      className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-lg text-[10px]"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>Call</span>
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

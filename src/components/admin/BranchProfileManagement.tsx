import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Unit, type BranchProfile } from '@/lib/supabase'
import {
  Building2, Save, CheckCircle2, Edit2
} from 'lucide-react'

export default function BranchProfileManagement() {
  const queryClient = useQueryClient()

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [presidentName, setPresidentName] = useState('')
  const [presidentMobile, setPresidentMobile] = useState('')
  const [secretaryName, setSecretaryName] = useState('')
  const [secretaryMobile, setSecretaryMobile] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch 16 units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['admin-branch-units'],
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

  // Fetch Profiles
  const { data: profiles = [] } = useQuery<BranchProfile[]>({
    queryKey: ['admin-branch-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_profiles')
        .select('*')
      if (error) {
        console.warn('Profiles fetch:', error.message)
        return []
      }
      return (data || []) as BranchProfile[]
    },
  })

  const profileMap = new Map<string, BranchProfile>()
  profiles.forEach((p) => profileMap.set(p.unit_id, p))

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnit) return
      const payload = {
        unit_id: selectedUnit.id,
        president_name: presidentName.trim() || null,
        president_mobile: presidentMobile.trim() || null,
        secretary_name: secretaryName.trim() || null,
        secretary_mobile: secretaryMobile.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('branch_profiles')
        .upsert(payload, { onConflict: 'unit_id' })
      if (error) throw error
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: `${selectedUnit?.name} വിവരങ്ങൾ സേവ് ചെയ്തു!` })
      setSelectedUnit(null)
      queryClient.invalidateQueries({ queryKey: ['admin-branch-profiles'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'പരാജയപ്പെട്ടു' })
    },
  })

  const handleSelectUnit = (unit: Unit) => {
    setSelectedUnit(unit)
    const prof = profileMap.get(unit.id)
    setPresidentName(prof?.president_name || '')
    setPresidentMobile(prof?.president_mobile || '')
    setSecretaryName(prof?.secretary_name || '')
    setSecretaryMobile(prof?.secretary_mobile || '')
    setAddress(prof?.address || '')
    setNotes(prof?.notes || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-surface-900">
            ശാഖാ ഭാരവാഹികളുടെ വിവരങ്ങൾ (16 Branches Directory)
          </h1>
          <p className="text-xs text-surface-500">
            ഓരോ ശാഖയുടെയും പ്രസിഡന്റ്, ജനറൽ സെക്രട്ടറി, ഫോൺ നമ്പറുകൾ ക്രമീകരിക്കാം.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Edit Form if a unit is selected */}
      {selectedUnit && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {selectedUnit.cluster?.name || 'ZONE'}
              </span>
              <h3 className="font-bold text-base text-surface-900 mt-1">
                {selectedUnit.name} — ഭാരവാഹികളെ ചേർക്കുക
              </h3>
            </div>
            <button
              onClick={() => setSelectedUnit(null)}
              className="text-xs text-surface-500 hover:text-surface-700 font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* President Name */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                പ്രസിഡന്റ് പേര് (President Name)
              </label>
              <input
                type="text"
                placeholder="ഉദാ: അബ്ദുല്ല"
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* President Mobile */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                പ്രസിഡന്റ് മൊബൈൽ നമ്പർ
              </label>
              <input
                type="text"
                placeholder="9876543210"
                value={presidentMobile}
                onChange={(e) => setPresidentMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Secretary Name */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ജനറൽ സെക്രട്ടറി പേര് (Secretary Name)
              </label>
              <input
                type="text"
                placeholder="ഉദാ: മുഹമ്മദ്"
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Secretary Mobile */}
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                ജനറൽ സെക്രട്ടറി മൊബൈൽ നമ്പർ
              </label>
              <input
                type="text"
                placeholder="9876543210"
                value={secretaryMobile}
                onChange={(e) => setSecretaryMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1">
                വിലാസം / സ്ഥലം (Address / Location)
              </label>
              <input
                type="text"
                placeholder="ശാഖാ ഓഫീസ് അല്ലെങ്കിൽ പ്രധാന ലൊക്കേഷൻ..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Details</span>
            </button>
          </div>
        </div>
      )}

      {/* 16 Branches Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 font-bold text-surface-800 text-sm">
          16 ശാഖകൾ (Click Edit to update details)
        </div>

        <div className="divide-y divide-surface-100">
          {units.map((u) => {
            const prof = profileMap.get(u.id)
            return (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {u.cluster?.code}
                    </span>
                    <h4 className="font-bold text-sm text-surface-900">{u.name}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500 mt-1.5">
                    <span>
                      <strong>പ്രസിഡന്റ്:</strong> {prof?.president_name || '—'}{' '}
                      {prof?.president_mobile && `(${prof.president_mobile})`}
                    </span>
                    <span>
                      <strong>സെക്രട്ടറി:</strong> {prof?.secretary_name || '—'}{' '}
                      {prof?.secretary_mobile && `(${prof.secretary_mobile})`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectUnit(u)}
                  className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-bold text-surface-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition flex items-center gap-1 self-end sm:self-center"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

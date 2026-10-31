import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type SubWing } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import {
  Star, Plus, Edit2, Trash2, Phone, Hash,
  Save, X, Loader2, Sparkles, UserCheck, UserX
} from 'lucide-react'
import { clsx } from 'clsx'

const DEFAULT_SUB_WINGS = [
  'VIKAYA (VOLUNTEER CORPS)',
  'CAMPUS WING',
  'SAHACHARI (RELIEF WING)',
  'TREND (EDUCATION WING)',
  'CYBER WING',
  'SARGAVASA (ARTS & CULTURE)',
  'IBAD (DAWAH WING)',
  'TWALAATH (SPIRITUAL WING)',
]

export default function SubWingManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [editingWing, setEditingWing] = useState<SubWing | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [chairperson, setChairperson] = useState('')
  const [mobile, setMobile] = useState('')
  const [membershipNo, setMembershipNo] = useState('')

  const { data: subWings = [], isLoading } = useQuery<SubWing[]>({
    queryKey: ['sub-wings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_wings')
        .select('*')
        .order('name')
      if (error) throw error
      return (data ?? []) as SubWing[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<SubWing>) => {
      if (editingWing) {
        const { error } = await supabase
          .from('sub_wings')
          .update(payload)
          .eq('id', editingWing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('sub_wings')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editingWing ? 'Sub-wing updated' : 'Sub-wing added successfully')
      qc.invalidateQueries({ queryKey: ['sub-wings'] })
      handleCloseModal()
    },
    onError: (err: Error) => toast.error('Save failed', err.message),
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('sub_wings')
        .update({ is_active: !isActive })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['sub-wings'] })
    },
    onError: (err: Error) => toast.error('Update failed', err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sub_wings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Sub-wing removed')
      qc.invalidateQueries({ queryKey: ['sub-wings'] })
    },
    onError: (err: Error) => toast.error('Delete failed', err.message),
  })

  const seedDefaults = useMutation({
    mutationFn: async () => {
      const existingNames = new Set(subWings.map(w => w.name.toUpperCase()))
      const toAdd = DEFAULT_SUB_WINGS.filter(n => !existingNames.has(n)).map(n => ({
        name: n,
        chairperson_name: 'To be assigned',
        is_active: true,
      }))

      if (toAdd.length === 0) return

      const { error } = await supabase.from('sub_wings').insert(toAdd)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Standard SKSSF sub-wings seeded')
      qc.invalidateQueries({ queryKey: ['sub-wings'] })
    },
    onError: (err: Error) => toast.error('Seeding failed', err.message),
  })

  const handleOpenEdit = (wing: SubWing) => {
    setEditingWing(wing)
    setName(wing.name)
    setChairperson(wing.chairperson_name)
    setMobile(wing.mobile || '')
    setMembershipNo(wing.membership_number || '')
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setEditingWing(null)
    setName('')
    setChairperson('')
    setMobile('')
    setMembershipNo('')
    setShowAddModal(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !chairperson.trim()) {
      toast.warning('Please enter sub-wing name and chairperson name')
      return
    }

    saveMutation.mutate({
      name: name.trim().toUpperCase(),
      chairperson_name: chairperson.trim(),
      mobile: mobile.trim() || null,
      membership_number: membershipNo.trim() || null,
      is_active: true,
    })
  }

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Sub-Wing Chairpersons</h1>
          <p className="page-subtitle">Manage specialized wings and their respective leadership</p>
        </div>
        <div className="flex items-center gap-2">
          {subWings.length === 0 && (
            <button
              onClick={() => seedDefaults.mutate()}
              disabled={seedDefaults.isPending}
              className="btn btn-secondary text-primary-700 bg-primary-50 hover:bg-primary-100"
            >
              {seedDefaults.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Seed Standard Wings</span>
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add Sub-Wing</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
          <p className="text-sm text-surface-500">Loading sub-wings...</p>
        </div>
      ) : subWings.length === 0 ? (
        <div className="card p-8 text-center">
          <Star className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-surface-700">No Sub-Wings Configured</p>
          <p className="text-sm text-surface-400 mt-1 max-w-sm mx-auto">
            Click &quot;Seed Standard Wings&quot; to automatically add standard SKSSF wings (Vikaya, Campus Wing, Sahachari, etc.) or add a custom wing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subWings.map((wing) => (
            <div
              key={wing.id}
              className={clsx(
                'card p-5 border transition-all duration-200 flex flex-col justify-between',
                wing.is_active ? 'border-surface-200' : 'border-surface-200 opacity-60 bg-surface-50'
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 fill-secondary-500 text-secondary-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-surface-900 leading-snug">{wing.name}</h3>
                      <span className="text-xs text-surface-400">Sub-Wing Committee</span>
                    </div>
                  </div>
                  <span className={clsx('badge text-xs', wing.is_active ? 'badge-green' : 'badge-gray')}>
                    {wing.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="bg-surface-50 p-3 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-surface-500">Chairperson:</span>
                    <span className="font-semibold text-surface-800">{wing.chairperson_name}</span>
                  </div>
                  {wing.mobile && (
                    <div className="flex items-center justify-between">
                      <span className="text-surface-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Contact:
                      </span>
                      <a href={`tel:${wing.mobile}`} className="font-medium text-primary-600 hover:underline">
                        {wing.mobile}
                      </a>
                    </div>
                  )}
                  {wing.membership_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-surface-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Member ID:
                      </span>
                      <span className="font-mono text-surface-700">{wing.membership_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between">
                <button
                  onClick={() => toggleStatus.mutate({ id: wing.id, isActive: wing.is_active })}
                  className={clsx(
                    'text-xs font-medium flex items-center gap-1 transition-colors',
                    wing.is_active ? 'text-surface-500 hover:text-yellow-600' : 'text-green-600 hover:text-green-700'
                  )}
                >
                  {wing.is_active ? (
                    <>
                      <UserX className="w-3.5 h-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Activate
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(wing)}
                    className="p-1.5 text-surface-500 hover:text-primary-600 hover:bg-surface-100 rounded-lg transition-colors"
                    title="Edit Chairperson"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete sub-wing ${wing.name}?`)) {
                        deleteMutation.mutate(wing.id)
                      }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-slide-up">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-surface-900 mb-1">
              {editingWing ? 'Edit Sub-Wing' : 'Add New Sub-Wing'}
            </h2>
            <p className="text-xs text-surface-500 mb-4">
              Enter sub-wing designation and appointed chairperson details.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Sub-Wing Name *</label>
                <input
                  type="text"
                  required
                  className="input uppercase"
                  placeholder="e.g. VIKAYA or CAMPUS WING"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Chairperson Full Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Abdul Samad K"
                  value={chairperson}
                  onChange={(e) => setChairperson(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Contact Mobile Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. 9847123456"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

              <div>
                <label className="label">SKSSF Membership Number (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. SK-CHP-1042"
                  value={membershipNo}
                  onChange={(e) => setMembershipNo(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingWing ? 'Save Changes' : 'Create Sub-Wing'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

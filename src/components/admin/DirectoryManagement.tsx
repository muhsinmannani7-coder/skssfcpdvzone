import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type UlamaItem, type DoctorItem } from '@/lib/supabase'
import {
  Users, Plus, Trash2, Edit2, CheckCircle2
} from 'lucide-react'
import { clsx } from 'clsx'

export default function DirectoryManagement() {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'ulama' | 'doctors'>('ulama')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Ulama Form State
  const [uName, setUName] = useState('')
  const [uTitle, setUTitle] = useState('ഉസ്താദ്')
  const [uMahallu, setUMahallu] = useState('')
  const [uMobile, setUMobile] = useState('')
  const [uAddress, setUAddress] = useState('')

  // Doctors Form State
  const [dName, setDName] = useState('')
  const [dSpecialization, setDSpecialization] = useState('')
  const [dHospital, setDHospital] = useState('')
  const [dMobile, setDMobile] = useState('')
  const [dAddress, setDAddress] = useState('')

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Ulama
  const { data: ulama = [] } = useQuery<UlamaItem[]>({
    queryKey: ['admin-ulama'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ulama_directory')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Ulama fetch:', error.message)
        return []
      }
      return (data || []) as UlamaItem[]
    },
  })

  // Fetch Doctors
  const { data: doctors = [] } = useQuery<DoctorItem[]>({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors_directory')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Doctors fetch:', error.message)
        return []
      }
      return (data || []) as DoctorItem[]
    },
  })

  // Save Ulama Mutation
  const saveUlamaMutation = useMutation({
    mutationFn: async () => {
      if (!uName.trim()) throw new Error('പേര് നൽകുക')
      const payload = {
        name: uName.trim(),
        title: uTitle.trim() || null,
        mahallu: uMahallu.trim() || null,
        mobile: uMobile.trim() || null,
        address: uAddress.trim() || null,
        is_active: true,
      }
      if (editingId) {
        const { error } = await supabase.from('ulama_directory').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('ulama_directory').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'വിവരങ്ങൾ സേവ് ചെയ്തു!' })
      resetUlamaForm()
      queryClient.invalidateQueries({ queryKey: ['admin-ulama'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => setNotification({ type: 'error', message: err.message }),
  })

  // Save Doctor Mutation
  const saveDoctorMutation = useMutation({
    mutationFn: async () => {
      if (!dName.trim()) throw new Error('പേര് നൽകുക')
      const payload = {
        name: dName.trim(),
        specialization: dSpecialization.trim() || null,
        hospital: dHospital.trim() || null,
        mobile: dMobile.trim() || null,
        address: dAddress.trim() || null,
        is_active: true,
      }
      if (editingId) {
        const { error } = await supabase.from('doctors_directory').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('doctors_directory').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'ഡോക്ടറുടെ വിവരങ്ങൾ സേവ് ചെയ്തു!' })
      resetDoctorForm()
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => setNotification({ type: 'error', message: err.message }),
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: 'ulama_directory' | 'doctors_directory' }) => {
      if (!confirm('ഇത് നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?')) return
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: [vars.table === 'ulama_directory' ? 'admin-ulama' : 'admin-doctors'],
      })
    },
  })

  const resetUlamaForm = () => {
    setEditingId(null)
    setUName('')
    setUTitle('ഉസ്താദ്')
    setUMahallu('')
    setUMobile('')
    setUAddress('')
  }

  const resetDoctorForm = () => {
    setEditingId(null)
    setDName('')
    setDSpecialization('')
    setDHospital('')
    setDMobile('')
    setDAddress('')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">
              ഡയറക്ടറി മാനേജ്‌മെന്റ് (Directory Management)
            </h1>
            <p className="text-xs text-surface-500">
              ഉലമാക്കൾ, മതപണ്ഡിതന്മാർ, ഡോക്ടർമാർ എന്നിവരുടെ വിവരങ്ങൾ ചേർക്കുക.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-surface-200/60 rounded-xl text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('ulama'); setEditingId(null) }}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition',
              activeTab === 'ulama' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600'
            )}
          >
            ഉലമാക്കൾ ({ulama.length})
          </button>
          <button
            onClick={() => { setActiveTab('doctors'); setEditingId(null) }}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition',
              activeTab === 'doctors' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600'
            )}
          >
            ഡോക്ടർമാർ ({doctors.length})
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification.message}</span>
        </div>
      )}

      {activeTab === 'ulama' ? (
        <>
          {/* Ulama Form */}
          <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2 border-b border-surface-100 pb-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>{editingId ? 'പണ്ഡിതരുടെ വിവരങ്ങൾ എഡിറ്റ് ചെയ്യുക' : 'പുതിയ പണ്ഡിതരെ ചേർക്കുക'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">സ്ഥാനപ്പേര് (Title)</label>
                <input
                  type="text"
                  placeholder="ഉസ്താദ്, സയ്യിദ്..."
                  value={uTitle}
                  onChange={(e) => setUTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-surface-700 mb-1">പൂർണ്ണനാമം (Full Name) *</label>
                <input
                  type="text"
                  placeholder="പേര്..."
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">മൊബൈൽ നമ്പർ</label>
                <input
                  type="text"
                  placeholder="ഫോൺ നമ്പർ..."
                  value={uMobile}
                  onChange={(e) => setUMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-surface-700 mb-1">മഹല്ല് / ശാഖ (Mahallu)</label>
                <input
                  type="text"
                  placeholder="ഉദാ: പടപ്പേങ്ങാട്..."
                  value={uMahallu}
                  onChange={(e) => setUMahallu(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-surface-700 mb-1">വിലാസം (സ്ഥലം)</label>
                <input
                  type="text"
                  placeholder="സ്ഥലം..."
                  value={uAddress}
                  onChange={(e) => setUAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={resetUlamaForm}
                  className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => saveUlamaMutation.mutate()}
                disabled={saveUlamaMutation.isPending || !uName.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
              >
                Save
              </button>
            </div>
          </div>

          {/* Ulama List */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-surface-100 font-bold text-surface-800 text-sm">
              രേഖപ്പെടുത്തിയ പണ്ഡിതർ ({ulama.length})
            </div>
            <div className="divide-y divide-surface-100">
              {ulama.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-surface-50">
                  <div>
                    <div className="flex items-center gap-2">
                      {u.title && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {u.title}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-surface-900">{u.name}</h4>
                    </div>
                    <p className="text-xs text-surface-500 mt-1">
                      {u.mahallu && `മഹല്ല്: ${u.mahallu} · `}ഫോൺ: {u.mobile || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(u.id)
                        setUName(u.name)
                        setUTitle(u.title || '')
                        setUMahallu(u.mahallu || '')
                        setUMobile(u.mobile || '')
                        setUAddress(u.address || '')
                      }}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: u.id, table: 'ulama_directory' })}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Doctors Form */}
          <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2 border-b border-surface-100 pb-2">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>{editingId ? 'ഡോക്ടറുടെ വിവരങ്ങൾ എഡിറ്റ് ചെയ്യുക' : 'പുതിയ ഡോക്ടറെ ചേർക്കുക'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">ഡോക്ടറുടെ പേര് *</label>
                <input
                  type="text"
                  placeholder="ഡോ. ..."
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">സ്പെഷ്യലൈസേഷൻ</label>
                <input
                  type="text"
                  placeholder="ഉദാ: ജനറൽ മെഡിസിൻ, പീഡിയാട്രിക്സ്..."
                  value={dSpecialization}
                  onChange={(e) => setDSpecialization(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">ഹോസ്പിറ്റൽ / ക്ലിനിക്</label>
                <input
                  type="text"
                  placeholder="ആശുപത്രി..."
                  value={dHospital}
                  onChange={(e) => setDHospital(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">മൊബൈൽ നമ്പർ</label>
                <input
                  type="text"
                  placeholder="ഫോൺ..."
                  value={dMobile}
                  onChange={(e) => setDMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-surface-700 mb-1">വിലാസം</label>
                <input
                  type="text"
                  placeholder="ലൊക്കേഷൻ..."
                  value={dAddress}
                  onChange={(e) => setDAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={resetDoctorForm}
                  className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => saveDoctorMutation.mutate()}
                disabled={saveDoctorMutation.isPending || !dName.trim()}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition"
              >
                Save Doctor
              </button>
            </div>
          </div>

          {/* Doctors List */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-surface-100 font-bold text-surface-800 text-sm">
              രേഖപ്പെടുത്തിയ ഡോക്ടർമാർ ({doctors.length})
            </div>
            <div className="divide-y divide-surface-100">
              {doctors.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between hover:bg-surface-50">
                  <div>
                    <h4 className="font-bold text-sm text-surface-900">{d.name}</h4>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {d.specialization && `${d.specialization} · `}
                      {d.hospital && `${d.hospital} · `}
                      ഫോൺ: {d.mobile || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(d.id)
                        setDName(d.name)
                        setDSpecialization(d.specialization || '')
                        setDHospital(d.hospital || '')
                        setDMobile(d.mobile || '')
                        setDAddress(d.address || '')
                      }}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-teal-700 hover:bg-teal-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: d.id, table: 'doctors_directory' })}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

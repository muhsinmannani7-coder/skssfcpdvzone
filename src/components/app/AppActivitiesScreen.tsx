import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type BranchActivity, type Unit } from '@/lib/supabase'
import {
  Flame, Plus, Users, X, Send,
  CheckCircle2, AlertCircle, Tag
} from 'lucide-react'
import { clsx } from 'clsx'

export default function AppActivitiesScreen() {
  const { secretaryAccount, isAdmin, isSecretary } = useAuth()
  const queryClient = useQueryClient()

  const [activeCategory, setActiveCategory] = useState<'all' | 'organizational' | 'educational' | 'social' | 'meeting'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'organizational' | 'educational' | 'social' | 'meeting'>('organizational')
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [participantsCount, setParticipantsCount] = useState<number>(0)
  const [selectedUnitId, setSelectedUnitId] = useState(secretaryAccount?.unit_id || '')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Units if Admin
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['app-act-units'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from('units').select('*').eq('is_active', true).order('name')
      return (data || []) as Unit[]
    },
  })

  // Fetch Activities
  const { data: activities = [], isLoading } = useQuery<BranchActivity[]>({
    queryKey: ['app-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_activities')
        .select('*, unit:units(name, clusters(code))')
        .order('activity_date', { ascending: false })
      if (error) {
        console.warn('Activities fetch error:', error.message)
        return []
      }
      return (data || []) as BranchActivity[]
    },
  })

  // Add Activity Mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const targetUnitId = isSecretary ? secretaryAccount?.unit_id : selectedUnitId
      if (!targetUnitId) throw new Error('ശാഖ തിരഞ്ഞെടുക്കുക')
      if (!title.trim() || !description.trim()) throw new Error('തലക്കെട്ടും വിശദീകരണവും നൽകുക')

      const payload = {
        unit_id: targetUnitId,
        title: title.trim(),
        category,
        activity_date: activityDate,
        description: description.trim(),
        participants_count: Number(participantsCount) || 0,
        status: 'published',
        created_by_secretary_id: secretaryAccount?.id || null,
      }

      const { error } = await supabase.from('branch_activities').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'പ്രവർത്തന റിപ്പോർട്ട് വിജയകരമായി ചേർത്തു!' })
      setShowAddModal(false)
      setTitle('')
      setDescription('')
      setParticipantsCount(0)
      queryClient.invalidateQueries({ queryKey: ['app-activities'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => setNotification({ type: 'error', message: err.message }),
  })

  const filtered = activities.filter((a) => {
    if (activeCategory === 'all') return true
    return a.category === activeCategory
  })

  return (
    <div className="space-y-4">
      {/* ── Top Bar & Add Button ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-surface-900 tracking-tight flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>ശാഖാ പ്രവർത്തനങ്ങൾ</span>
          </h2>
          <p className="text-[11px] text-surface-500">
            ശാഖകളിൽ നടക്കുന്ന സംഘടന, വിദ്യാഭ്യാസ, ജീവകാരുണ്യ റിപ്പോർട്ടുകൾ
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 active:scale-95 transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {notification && (
        <div
          className={clsx(
            'p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold',
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800'
          )}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── Category Filters (Instagram/WhatsApp style pills) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'organizational', label: 'സംഘടന' },
          { id: 'educational', label: 'വിദ്യാഭ്യാസം' },
          { id: 'social', label: 'സാന്ത്വനം / റിലീഫ്' },
          { id: 'meeting', label: 'മീറ്റിംഗുകൾ' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={clsx(
              'px-3 py-1.5 rounded-full transition whitespace-nowrap',
              activeCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Activities Feed ── */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-surface-400">ലോഡ് ചെയ്യുന്നു...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-surface-200 text-xs text-surface-400 space-y-2">
          <Flame className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
          <p className="font-semibold text-surface-700">പ്രവർത്തന റിപ്പോർട്ടുകൾ ലഭ്യമല്ല</p>
          <p className="text-[11px]">മുകളിലെ 'Add' ബട്ടൺ അമർത്തി നിങ്ങളുടെ ശാഖയിലെ പ്രവർത്തനങ്ങൾ പങ്കുവെക്കാം.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((act) => (
            <div
              key={act.id}
              className="bg-white rounded-3xl border border-surface-200 p-4 shadow-xs space-y-2.5 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {act.unit?.name || 'Branch'}
                    </span>
                    <span className="text-[9px] font-semibold text-surface-400 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      {act.category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-surface-900 mt-1">{act.title}</h3>
                </div>

                <span className="text-[10px] text-surface-400 font-medium">
                  {new Date(act.activity_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <p className="text-xs text-surface-600 leading-relaxed whitespace-pre-line">
                {act.description}
              </p>

              {act.participants_count > 0 && (
                <div className="pt-2 border-t border-surface-100 flex items-center gap-1 text-[11px] text-surface-500 font-semibold">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>പങ്കെടുത്തവർ: {act.participants_count} പേർ</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add Activity Bottom Sheet / Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-surface-100 pb-2.5">
              <h3 className="font-black text-sm text-surface-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>പുതിയ പ്രവർത്തന റിപ്പോർട്ട് ചേർക്കുക</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-surface-400 hover:text-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {isAdmin && (
                <div>
                  <label className="block text-[11px] font-bold text-surface-700 mb-1">ശാഖ തിരഞ്ഞെടുക്കുക *</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                  >
                    <option value="">-- ശാഖ തിരഞ്ഞെടുക്കുക --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-surface-700 mb-1">തലക്കെട്ട് (Title) *</label>
                <input
                  type="text"
                  placeholder="ഉദാ: മദ്റസ ശാക്തീകരണ ക്യാമ്പ്..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-surface-700 mb-1">വിഭാഗം</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                  >
                    <option value="organizational">സംഘടന</option>
                    <option value="educational">വിദ്യാഭ്യാസം</option>
                    <option value="social">സാന്ത്വനം</option>
                    <option value="meeting">മീറ്റിംഗ്</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-surface-700 mb-1">തീയതി</label>
                  <input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-surface-700 mb-1">പങ്കെടുത്തവരുടെ എണ്ണം</label>
                <input
                  type="number"
                  min={0}
                  value={participantsCount}
                  onChange={(e) => setParticipantsCount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-surface-700 mb-1">വിശദാംശങ്ങൾ (Description) *</label>
                <textarea
                  rows={3}
                  placeholder="പരിപാടിയുടെ വിശദവിവരങ്ങൾ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-surface-600 hover:bg-surface-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !title.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

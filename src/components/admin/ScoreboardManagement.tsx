import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type ScoreCategory, SCORE_CATEGORY_MAX_MARKS, type Unit } from '@/lib/supabase'
import {
  Trophy, Save, AlertCircle, CheckCircle2,
  Edit2, Eye, EyeOff, Plus
} from 'lucide-react'
import { clsx } from 'clsx'

const CATEGORIES: ScoreCategory[] = [
  'MASIRA',
  'KHUTBIYYATH',
  'HIDAYA',
  'EDU VISION',
  'RAHMA BLOOD BANK',
  'SAHACHARI CONNECT',
  'ULAMA-UMARA SANGAMAM',
]

export default function ScoreboardManagement() {
  const queryClient = useQueryClient()

  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<ScoreCategory>('MASIRA')
  const [marks, setMarks] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [isPublished, setIsPublished] = useState<boolean>(true)
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['admin-scoreboard-units'],
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

  // Fetch all scores
  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['admin-scoreboard-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_scores')
        .select('*, unit:units(id, name, cluster:clusters(name, code))')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Branch scores fetch:', error.message)
        return []
      }
      return data || []
    },
  })

  // Save / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnitId) throw new Error('ദയവായി ശാഖ തിരഞ്ഞെടുക്കുക')
      const maxMarks = SCORE_CATEGORY_MAX_MARKS[selectedCategory]
      if (marks < 0 || marks > maxMarks) {
        throw new Error(`മാർക്ക് 0-നും ${maxMarks}-നും ഇടയിലായിരിക്കണം`)
      }

      const payload = {
        unit_id: selectedUnitId,
        category: selectedCategory,
        marks,
        max_marks: maxMarks,
        notes: notes.trim() || null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      }

      if (editingScoreId) {
        const { error } = await supabase
          .from('branch_scores')
          .update(payload)
          .eq('id', editingScoreId)
        if (error) throw error
      } else {
        // Upsert by unit_id and category
        const { error } = await supabase
          .from('branch_scores')
          .upsert(payload, { onConflict: 'unit_id, category' })
        if (error) throw error
      }
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'മാർക്കുകൾ വിജയകരമായി സേവ് ചെയ്തു!' })
      setEditingScoreId(null)
      setNotes('')
      setMarks(0)
      queryClient.invalidateQueries({ queryKey: ['admin-scoreboard-scores'] })
      setTimeout(() => setNotification(null), 3500)
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'സേവ് ചെയ്യാൻ സാധിച്ചില്ല' })
    },
  })

  // Edit handler
  const handleEdit = (score: any) => {
    setEditingScoreId(score.id)
    setSelectedUnitId(score.unit_id)
    setSelectedCategory(score.category)
    setMarks(Number(score.marks))
    setNotes(score.notes || '')
    setIsPublished(score.is_published)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Toggle publish
  const togglePublish = async (score: any) => {
    await supabase
      .from('branch_scores')
      .update({ is_published: !score.is_published })
      .eq('id', score.id)
    queryClient.invalidateQueries({ queryKey: ['admin-scoreboard-scores'] })
  }

  const currentMax = SCORE_CATEGORY_MAX_MARKS[selectedCategory]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-md">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">
              ശാഖാ സ്കോർബോർഡ് മാനേജ്‌മെന്റ് (100 Marks System)
            </h1>
            <p className="text-xs text-surface-500">
              16 ശാഖകൾക്കായി 7 പ്രൊജക്റ്റുകളുടെ മാർക്കുകൾ നൽകുകയും എഡിറ്റ് ചെയ്യുകയും ചെയ്യാം.
            </p>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={clsx(
            'p-4 rounded-xl flex items-center gap-2 text-xs font-semibold',
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Entry Form */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2 border-b border-surface-100 pb-3">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>{editingScoreId ? 'മാർക്ക് എഡിറ്റ് ചെയ്യുക' : 'പുതിയ മാർക്ക് രേഖപ്പെടുത്തുക'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Branch Select */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              ശാഖ തിരഞ്ഞെടുക്കുക (Select Branch) *
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- ശാഖ തിരഞ്ഞെടുക്കുക --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.cluster?.code || '—'})
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              വിഭാഗം (Category) *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const cat = e.target.value as ScoreCategory
                setSelectedCategory(cat)
                if (marks > SCORE_CATEGORY_MAX_MARKS[cat]) {
                  setMarks(SCORE_CATEGORY_MAX_MARKS[cat])
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c} (Max: {SCORE_CATEGORY_MAX_MARKS[c]} Marks)
                </option>
              ))}
            </select>
          </div>

          {/* Marks Input */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              നൽകുന്ന മാർക്ക് (Max: {currentMax}) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={currentMax}
                step={0.5}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-surface-400">/{currentMax}</span>
            </div>
          </div>
        </div>

        {/* Evaluation Notes */}
        <div>
          <label className="block text-xs font-bold text-surface-700 mb-1">
            വിലയിരുത്തൽ കുറിപ്പുകൾ (Evaluation Notes - Optional)
          </label>
          <input
            type="text"
            placeholder="പ്രത്യേക പരാമർശങ്ങൾ അല്ലെങ്കിൽ വിശദീകരണങ്ങൾ..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-surface-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>പൊതു സ്കോർബോർഡിൽ പ്രസിദ്ധീകരിക്കുക (Publish on Scoreboard)</span>
          </label>

          <div className="flex gap-2">
            {editingScoreId && (
              <button
                type="button"
                onClick={() => {
                  setEditingScoreId(null)
                  setNotes('')
                  setMarks(0)
                }}
                className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600 hover:bg-surface-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !selectedUnitId}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingScoreId ? 'Update Marks' : 'Save Marks'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scores List */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="font-bold text-surface-800 text-sm">
            രേഖപ്പെടുത്തിയ മാർക്കുകൾ (Recorded Evaluations: {scores.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-surface-400">ലോഡ് ചെയ്യുന്നു...</div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center text-surface-400 text-xs">
            മാർക്കുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല. മുകളിലെ ഫോം ഉപയോഗിച്ച് നൽകാം.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200 text-surface-600 font-bold uppercase text-left">
                  <th className="px-4 py-3">ശാഖ (Unit)</th>
                  <th className="px-3 py-3">വിഭാഗം</th>
                  <th className="px-3 py-3 text-center">മാർക്ക്</th>
                  <th className="px-3 py-3">കുറിപ്പുകൾ</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {scores.map((s: any) => (
                  <tr key={s.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-surface-800">{s.unit?.name || 'Unit'}</span>
                      <span className="text-[10px] text-surface-400 block">{s.unit?.cluster?.name}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-extrabold text-surface-900 text-sm">{s.marks}</span>
                      <span className="text-surface-400 text-[10px]">/{s.max_marks}</span>
                    </td>
                    <td className="px-3 py-3 text-surface-500 italic max-w-xs truncate">
                      {s.notes || '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => togglePublish(s)}
                        className={clsx(
                          'p-1 rounded text-xs font-semibold inline-flex items-center gap-1',
                          s.is_published ? 'text-emerald-700 bg-emerald-50' : 'text-surface-400 bg-surface-100'
                        )}
                        title={s.is_published ? 'Published (Click to hide)' : 'Draft (Click to publish)'}
                      >
                        {s.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{s.is_published ? 'Published' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

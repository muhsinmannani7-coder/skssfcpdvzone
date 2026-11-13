import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Announcement } from '@/lib/supabase'
import {
  Bell, Plus, Trash2, Edit2, CheckCircle2
} from 'lucide-react'

export default function AnnouncementManagement() {
  const queryClient = useQueryClient()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [isPublished, setIsPublished] = useState(true)

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Announcements
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Announcements fetch error:', error.message)
        return []
      }
      return (data || []) as Announcement[]
    },
  })

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) throw new Error('തലക്കെട്ടും ഉള്ളടക്കവും നൽകുക')
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        is_published: isPublished,
        published_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('announcements').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'അറിയിപ്പ് പ്രസിദ്ധീകരിച്ചു!' })
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => setNotification({ type: 'error', message: err.message }),
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm('ഈ അറിയിപ്പ് നീക്കം ചെയ്യണോ?')) return
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
    },
  })

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setCategory('General')
    setPriority('normal')
    setIsPublished(true)
  }

  const handleEdit = (a: Announcement) => {
    setEditingId(a.id)
    setTitle(a.title)
    setContent(a.content)
    setCategory(a.category)
    setPriority(a.priority)
    setIsPublished(a.is_published)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-surface-900">
            അറിയിപ്പുകൾ (Announcements & Circulars)
          </h1>
          <p className="text-xs text-surface-500">
            പ്രധാനപ്പെട്ട അറിയിപ്പുകൾ, തീരുമാനങ്ങൾ, സർക്കുലറുകൾ പ്രസിദ്ധീകരിക്കാം.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2 border-b border-surface-100 pb-2">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>{editingId ? 'അറിയിപ്പ് എഡിറ്റ് ചെയ്യുക' : 'പുതിയ അറിയിപ്പ് നൽകുക'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-surface-700 mb-1">തലക്കെട്ട് (Title) *</label>
            <input
              type="text"
              placeholder="അറിയിപ്പിന്റെ തലക്കെട്ട്..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">മുൻഗണന (Priority)</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-surface-700 mb-1">വിശദാംശങ്ങൾ (Content) *</label>
            <textarea
              rows={3}
              placeholder="അറിയിപ്പിന്റെ വിശദവിവരങ്ങൾ..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>പ്രസിദ്ധീകരിക്കുക (Publish)</span>
          </label>

          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !title.trim()}
              className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition"
            >
              {editingId ? 'Update Notice' : 'Post Notice'}
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 font-bold text-surface-800 text-sm">
          പട്ടിക ({announcements.length})
        </div>
        <div className="divide-y divide-surface-100">
          {announcements.map((a) => (
            <div key={a.id} className="p-4 flex items-start justify-between gap-4 hover:bg-surface-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                    {a.priority}
                  </span>
                  <span className="text-xs text-surface-400">
                    {new Date(a.published_at || a.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-surface-900">{a.title}</h4>
                <p className="text-xs text-surface-600 line-clamp-2">{a.content}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(a)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-amber-700 hover:bg-amber-50"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(a.id)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

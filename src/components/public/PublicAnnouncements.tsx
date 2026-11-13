import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, type Announcement } from '@/lib/supabase'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import {
  Bell, Calendar, Search, Tag, AlertTriangle
} from 'lucide-react'
import { clsx } from 'clsx'

export default function PublicAnnouncements() {
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch Announcements
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['public-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false })
      if (error) {
        console.warn('Announcements fetch:', error.message)
        return []
      }
      return (data || []) as Announcement[]
    },
  })

  const filtered = announcements.filter((a) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5" /> Official Bulletins
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            അറിയിപ്പുകൾ & സർക്കുലറുകൾ
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            മേഖലാ കമ്മിറ്റിയുടെ പ്രധാനപ്പെട്ട അറിയിപ്പുകൾ, തീരുമാനങ്ങൾ, പരിപാടി ഷെഡ്യൂളുകൾ.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-400" />
          <input
            type="text"
            placeholder="അറിയിപ്പുകൾ തിരയുക..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-2" />
            <p className="text-xs text-surface-500 font-medium">അറിയിപ്പുകൾ ശേഖരിക്കുന്നു...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-surface-400 bg-white rounded-2xl border border-surface-200">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
            <p className="text-sm font-semibold">പുതിയ അറിയിപ്പുകൾ ഒന്നുമില്ല</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const isUrgent = item.priority === 'urgent' || item.priority === 'high'
              return (
                <div
                  key={item.id}
                  className={clsx(
                    'bg-white rounded-2xl border p-5 sm:p-6 shadow-sm space-y-3 transition hover:shadow-md',
                    isUrgent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-surface-200'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-surface-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.published_at || item.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-surface-900">{item.title}</h3>

                  <p className="text-xs sm:text-sm text-surface-600 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
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


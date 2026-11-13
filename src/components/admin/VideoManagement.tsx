import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Video, type VideoComment } from '@/lib/supabase'
import { extractYouTubeId, getYouTubeThumbnail } from '@/utils/youtube'
import {
  PlaySquare, Plus, Trash2, Edit2, CheckCircle2,
  AlertCircle, MessageSquare, ExternalLink, Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'

export default function VideoManagement() {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'videos' | 'comments'>('videos')
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null)

  // Video Form State
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState('Programs')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublished, setIsPublished] = useState(true)

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Videos
  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ['admin-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Videos fetch error:', error.message)
        return []
      }
      return (data || []) as Video[]
    },
  })

  // Fetch Comments for moderation
  const { data: comments = [], isLoading: commentsLoading } = useQuery<VideoComment[]>({
    queryKey: ['admin-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_comments')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Comments fetch error:', error.message)
        return []
      }
      return (data || []) as VideoComment[]
    },
  })

  // Save Video Mutation
  const saveVideoMutation = useMutation({
    mutationFn: async () => {
      const videoId = extractYouTubeId(youtubeUrl)
      if (!videoId) {
        throw new Error('സാധുവായ യൂട്യൂബ് ലിങ്ക് (Valid YouTube URL) നൽകുക')
      }
      if (!title.trim()) {
        throw new Error('വീഡിയോ തലക്കെട്ട് നൽകുക')
      }

      const thumbnail = getYouTubeThumbnail(videoId, 'hq')
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        youtube_url: youtubeUrl.trim(),
        youtube_video_id: videoId,
        thumbnail_url: thumbnail,
        duration: duration.trim() || null,
        category,
        is_featured: isFeatured,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      }

      if (editingVideoId) {
        const { error } = await supabase
          .from('videos')
          .update(payload)
          .eq('id', editingVideoId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('videos')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'വീഡിയോ വിജയകരമായി ചേർത്തു!' })
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'പരാജയപ്പെട്ടു' })
    },
  })

  // Delete Video Mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm('ഈ വീഡിയോ നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?')) return
      const { error } = await supabase.from('videos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'വീഡിയോ നീക്കം ചെയ്തു' })
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] })
      setTimeout(() => setNotification(null), 3000)
    },
  })

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm('ഈ കമന്റ് നീക്കം ചെയ്യണോ?')) return
      const { error } = await supabase.from('video_comments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] })
    },
  })

  // Reset form
  const resetForm = () => {
    setEditingVideoId(null)
    setYoutubeUrl('')
    setTitle('')
    setDescription('')
    setDuration('')
    setCategory('Programs')
    setIsFeatured(false)
    setIsPublished(true)
  }

  // Edit video click
  const handleEdit = (v: Video) => {
    setEditingVideoId(v.id)
    setYoutubeUrl(v.youtube_url)
    setTitle(v.title)
    setDescription(v.description || '')
    setDuration(v.duration || '')
    setCategory(v.category)
    setIsFeatured(v.is_featured)
    setIsPublished(v.is_published)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-md">
            <PlaySquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">
              വീഡിയോ മാനേജ്‌മെന്റ് (Video Hub & Moderation)
            </h1>
            <p className="text-xs text-surface-500">
              യൂട്യൂബ് വീഡിയോകൾ ചേർക്കുക, ഇൻ-ആപ്പ് കമന്റുകൾ മോഡറേറ്റ് ചെയ്യുക.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-surface-200/60 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('videos')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition',
              activeTab === 'videos' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600'
            )}
          >
            Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition flex items-center gap-1',
              activeTab === 'comments' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600'
            )}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Comments ({comments.length})</span>
          </button>
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

      {activeTab === 'videos' ? (
        <>
          {/* Add / Edit Video Form */}
          <div className="bg-white rounded-2xl border border-surface-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2 border-b border-surface-100 pb-3">
              <Plus className="w-4 h-4 text-red-600" />
              <span>{editingVideoId ? 'വീഡിയോ എഡിറ്റ് ചെയ്യുക' : 'പുതിയ യൂട്യൂബ് വീഡിയോ ചേർക്കുക'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">
                  യൂട്യൂബ് ലിങ്ക് (YouTube URL) *
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">
                  വീഡിയോ തലക്കെട്ട് (Video Title) *
                </label>
                <input
                  type="text"
                  placeholder="ഉദാ: മസീറ 2026 ഉദ്ഘാടന സമ്മേളനം..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">
                  വിഭാഗം (Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Programs">Programs</option>
                  <option value="Masira 2026">Masira 2026</option>
                  <option value="Speeches">Speeches</option>
                  <option value="Songs / Releases">Songs / Releases</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 mb-1">
                  ദൈർഘ്യം (Duration - e.g. 15:40)
                </label>
                <input
                  type="text"
                  placeholder="12:30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                വിവരണം (Description - Optional)
              </label>
              <textarea
                rows={2}
                placeholder="വീഡിയോയെക്കുറിച്ചുള്ള കുറിപ്പ്..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-surface-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Featured Video (ഹോം പേജിൽ മുൻഗണന നൽകുക)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Publish</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                {editingVideoId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600 hover:bg-surface-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => saveVideoMutation.mutate()}
                  disabled={saveVideoMutation.isPending || !youtubeUrl || !title}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <PlaySquare className="w-3.5 h-3.5" />
                  <span>{editingVideoId ? 'Update Video' : 'Add Video'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Videos List */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-surface-100 font-bold text-surface-800 text-sm">
              ചേർത്ത വീഡിയോകൾ (All Videos: {videos.length})
            </div>

            {videosLoading ? (
              <div className="p-12 text-center text-xs text-surface-400">ലോഡ് ചെയ്യുന്നു...</div>
            ) : videos.length === 0 ? (
              <div className="p-12 text-center text-xs text-surface-400">
                വീഡിയോകൾ ചേർത്തിട്ടില്ല. മുകളിലെ ഫോം ഉപയോഗിക്കുക.
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {videos.map((v) => (
                  <div key={v.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-50">
                    <div className="flex items-center gap-3">
                      <div className="w-24 aspect-video bg-black rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img
                          src={v.thumbnail_url || `https://img.youtube.com/vi/${v.youtube_video_id}/default.jpg`}
                          alt={v.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                            {v.category}
                          </span>
                          {v.is_featured && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Featured
                            </span>
                          )}
                          {!v.is_published && (
                            <span className="text-[10px] font-bold text-surface-500 bg-surface-100 px-1.5 py-0.2 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-surface-900 mt-1">{v.title}</h4>
                        <span className="text-xs text-surface-400">{v.view_count || 0} views</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={v.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                        title="Open on YouTube"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleEdit(v)}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteVideoMutation.mutate(v.id)}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Comments Moderation Tab */
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-100 font-bold text-surface-800 text-sm">
            ഇൻ-ആപ്പ് കമന്റുകൾ മോഡറേറ്റ് ചെയ്യുക (User Comments: {comments.length})
          </div>

          {commentsLoading ? (
            <div className="p-12 text-center text-xs text-surface-400">കമന്റുകൾ ലോഡ് ചെയ്യുന്നു...</div>
          ) : comments.length === 0 ? (
            <div className="p-12 text-center text-xs text-surface-400">കമന്റുകൾ ഒന്നുമില്ല.</div>
          ) : (
            <div className="divide-y divide-surface-100">
              {comments.map((c) => (
                <div key={c.id} className="p-4 flex items-start justify-between gap-4 hover:bg-surface-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-surface-900">{c.author_name}</span>
                      <span className="text-[10px] text-surface-400">
                        {new Date(c.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-surface-700">{c.content}</p>
                  </div>
                  <button
                    onClick={() => deleteCommentMutation.mutate(c.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                    title="Delete inappropriate comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


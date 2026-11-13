import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Video, type VideoComment } from '@/lib/supabase'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import {
  PlaySquare, Heart, MessageSquare, Eye,
  Send, X, Sparkles, Filter
} from 'lucide-react'
import { clsx } from 'clsx'

// Unique client identifier for in-app likes
function getClientIdentifier(): string {
  let id = localStorage.getItem('skssf_visitor_id')
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now()
    localStorage.setItem('skssf_visitor_id', id)
  }
  return id
}

export default function PublicVideos() {
  const queryClient = useQueryClient()
  const visitorId = getClientIdentifier()

  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentStatus, setCommentStatus] = useState<string | null>(null)

  // Fetch Published Videos
  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ['public-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Error fetching videos:', error.message)
        return []
      }
      return (data || []) as Video[]
    },
  })

  // Fetch Likes for all videos
  const { data: likes = [] } = useQuery<{ video_id: string; user_identifier: string }[]>({
    queryKey: ['public-video-likes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_likes')
        .select('video_id, user_identifier')
      if (error) return []
      return data || []
    },
  })

  // Fetch comments for active video
  const { data: activeComments = [], isLoading: commentsLoading } = useQuery<VideoComment[]>({
    queryKey: ['public-video-comments', activeVideo?.id],
    enabled: !!activeVideo?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', activeVideo!.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
      if (error) return []
      return (data || []) as VideoComment[]
    },
  })

  // Increment view count when video is opened
  useEffect(() => {
    if (activeVideo?.id) {
      supabase.rpc('increment_video_views', { p_video_id: activeVideo.id }).then(({ error }) => {
        if (error) {
          // Fallback direct update
          supabase
            .from('videos')
            .update({ view_count: (activeVideo.view_count || 0) + 1 })
            .eq('id', activeVideo.id)
            .then()
        }
      })
    }
  }, [activeVideo?.id])

  // Like Mutation
  const likeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const isLiked = likes.some(l => l.video_id === videoId && l.user_identifier === visitorId)
      if (isLiked) {
        // Unlike
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_identifier', visitorId)
      } else {
        // Like
        await supabase
          .from('video_likes')
          .insert({ video_id: videoId, user_identifier: visitorId })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-video-likes'] })
    },
  })

  // Comment Mutation
  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!activeVideo || !commentName.trim() || !commentText.trim()) return
      const { error } = await supabase.from('video_comments').insert({
        video_id: activeVideo.id,
        author_name: commentName.trim(),
        content: commentText.trim(),
        is_approved: true, // auto approve or moderated
      })
      if (error) throw error
    },
    onSuccess: () => {
      setCommentText('')
      setCommentStatus('നിങ്ങളുടെ അഭിപ്രായം രേഖപ്പെടുത്തി!')
      setTimeout(() => setCommentStatus(null), 3000)
      queryClient.invalidateQueries({ queryKey: ['public-video-comments', activeVideo?.id] })
    },
  })

  // Categories list
  const categories = ['All', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))]

  // Filtered videos
  const filteredVideos = selectedCategory === 'All'
    ? videos
    : videos.filter(v => v.category === selectedCategory)

  // Like count helper
  const getLikeCount = (videoId: string) => likes.filter(l => l.video_id === videoId).length
  const hasUserLiked = (videoId: string) => likes.some(l => l.video_id === videoId && l.user_identifier === visitorId)

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <PlaySquare className="w-3.5 h-3.5" /> SKSSF Official Channel
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            വീഡിയോ ലൈബ്രറി (Video Hub)
          </h1>
          <p className="text-xs sm:text-sm text-surface-600">
            ചപ്പാരപ്പടവ് മേഖലാ പരിപാടികൾ, മസീറ ടൂർ സംബന്ധിച്ച വീഡിയോകൾ, പ്രഭാഷണങ്ങൾ, റിലീസുകൾ ഇവിടെ കാണാം.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-200">
          <Filter className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition',
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {videosLoading ? (
          <div className="p-16 text-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-2" />
            <p className="text-xs text-surface-500 font-medium">വീഡിയോകൾ ലഭ്യമാക്കുന്നു...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-16 text-center text-surface-400 bg-white rounded-2xl border border-surface-200">
            <PlaySquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
            <p className="text-sm font-semibold text-surface-700">ഇപ്പോൾ വീഡിയോകൾ ലഭ്യമല്ല</p>
            <p className="text-xs text-surface-400 mt-1">അഡ്മിൻ പാനലിൽ നിന്ന് ഉടൻ വീഡിയോകൾ ചേർക്കുന്നതാണ്</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const likeCount = getLikeCount(video.id)
              const liked = hasUserLiked(video.id)
              return (
                <div
                  key={video.id}
                  className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
                >
                  {/* Thumbnail / Click to Watch */}
                  <div
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                    onClick={() => setActiveVideo(video)}
                  >
                    <img
                      src={
                        video.thumbnail_url ||
                        `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`
                      }
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 flex items-center justify-center transition">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                        <PlaySquare className="w-6 h-6 fill-white" />
                      </div>
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                    )}
                    {video.is_featured && (
                      <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
                      </span>
                    )}
                  </div>

                  {/* Info & Engagement */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {video.category}
                      </span>
                      <h3
                        onClick={() => setActiveVideo(video)}
                        className="font-bold text-surface-900 text-sm mt-2 line-clamp-2 hover:text-emerald-700 cursor-pointer transition"
                      >
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-surface-500 line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-surface-100 text-xs text-surface-500">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Eye className="w-3.5 h-3.5 text-surface-400" />
                        <span>{video.view_count || 0} views</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Like Button */}
                        <button
                          onClick={() => likeMutation.mutate(video.id)}
                          className={clsx(
                            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition',
                            liked
                              ? 'text-red-600 bg-red-50'
                              : 'text-surface-600 hover:text-red-600 hover:bg-surface-100'
                          )}
                          title="In-App Like"
                        >
                          <Heart className={clsx('w-3.5 h-3.5', liked && 'fill-red-600')} />
                          <span>{likeCount}</span>
                        </button>

                        {/* Open Video / Comments */}
                        <button
                          onClick={() => setActiveVideo(video)}
                          className="flex items-center gap-1 text-xs font-semibold text-surface-600 hover:text-emerald-700 hover:bg-surface-100 px-2 py-1 rounded-lg transition"
                          title="Watch & Comment"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Watch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Embedded Video Player & Comments Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-surface-200 bg-surface-50">
              <div className="flex items-center gap-2">
                <PlaySquare className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-surface-800 line-clamp-1">{activeVideo.title}</h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-app YouTube Embed Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Engagement Bar & Disclaimer */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-surface-900">{activeVideo.title}</h2>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {activeVideo.view_count || 0} views · {activeVideo.category}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => likeMutation.mutate(activeVideo.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition border',
                      hasUserLiked(activeVideo.id)
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
                    )}
                  >
                    <Heart className={clsx('w-4 h-4', hasUserLiked(activeVideo.id) && 'fill-red-600')} />
                    <span>{getLikeCount(activeVideo.id)} Likes</span>
                  </button>
                </div>
              </div>

              {activeVideo.description && (
                <div className="bg-surface-50 p-3 rounded-xl text-xs text-surface-600 leading-relaxed">
                  {activeVideo.description}
                </div>
              )}

              {/* Engagement Disclaimer */}
              <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-[11px] leading-tight">
                ℹ️ <strong>ശ്രദ്ധിക്കുക:</strong> ഈ ലൈക്കും കമന്റുകളും SKSSF ചപ്പാരപ്പടവ് സോൺ ആപ്പിലെ ആഭ്യന്തര (In-App) ഇടപെടലുകളാണ്. ഇത് യൂട്യൂബ് പ്ലാറ്റ്‌ഫോമിലെ ഔദ്യോഗിക ലൈക്കുകളെയോ കമന്റുകളെയോ ബാധിക്കുന്നതല്ല.
              </div>

              {/* In-App Comments Section */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-sm text-surface-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>അഭിപ്രായങ്ങൾ (In-App Comments)</span>
                  <span className="text-xs text-surface-400 font-normal">({activeComments.length})</span>
                </h4>

                {/* Add Comment Box */}
                <div className="bg-surface-50 p-3 rounded-xl border border-surface-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="നിങ്ങളുടെ പേര് (Your Name)"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      placeholder="അഭിപ്രായം രേഖപ്പെടുത്തുക..."
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => commentMutation.mutate()}
                      disabled={!commentName.trim() || !commentText.trim() || commentMutation.isPending}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition self-end flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                  {commentStatus && (
                    <p className="text-xs text-emerald-700 font-semibold">{commentStatus}</p>
                  )}
                </div>

                {/* Comments List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {commentsLoading ? (
                    <p className="text-xs text-surface-400">കമന്റുകൾ ലോഡ് ചെയ്യുന്നു...</p>
                  ) : activeComments.length === 0 ? (
                    <p className="text-xs text-surface-400 italic">ആദ്യത്തെ അഭിപ്രായം രേഖപ്പെടുത്തൂ!</p>
                  ) : (
                    activeComments.map((c) => (
                      <div key={c.id} className="bg-surface-50 p-2.5 rounded-xl border border-surface-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-surface-800">{c.author_name}</span>
                          <span className="text-[10px] text-surface-400">
                            {new Date(c.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-surface-600 mt-1">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  )
}


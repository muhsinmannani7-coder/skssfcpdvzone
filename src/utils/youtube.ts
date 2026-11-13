export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'maxres' = 'hq'): string {
  if (quality === 'maxres') return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  if (quality === 'hq') return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  return `https://img.youtube.com/vi/${videoId}/default.jpg`
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import {
  Plus, Play, Square, CalendarCheck, MapPin, Clock, X, Save,
  Loader2, AlertTriangle, Share2, Copy, ExternalLink, Monitor,
  RotateCcw, Sparkles, Check, QrCode, LayoutList
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import LiveAttendanceMonitorModal from './LiveAttendanceMonitorModal'

export default function ProgramManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Program | null>(null)
  const [activeMonitorProgram, setActiveMonitorProgram] = useState<Program | null>(null)
  const [shareModalProgram, setShareModalProgram] = useState<Program | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'close' | 'reopen'
    program: Program
  } | null>(null)

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('program_date', { ascending: false })
      if (error) throw error
      return data as Program[]
    },
    refetchInterval: 10000,
  })

  // Create Program mutation
  const createProgram = useMutation({
    mutationFn: async ({ form, startImmediately }: { form: Partial<Program>; startImmediately: boolean }) => {
      const payload: Partial<Program> = {
        ...form,
        status: startImmediately ? 'active' : 'upcoming',
        started_at: startImmediately ? new Date().toISOString() : null,
      }
      const { data, error } = await supabase
        .from('programs')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return { program: data as Program, startImmediately }
    },
    onSuccess: ({ program: newProg, startImmediately }) => {
      toast.success(startImmediately ? 'Meeting started & LIVE!' : 'Meeting created successfully')
      qc.invalidateQueries({ queryKey: ['programs'] })
      setShowForm(false)

      if (startImmediately) {
        setShareModalProgram(newProg)
      }
    },
    onError: (e: Error) => toast.error('Failed to create meeting', e.message),
  })

  // Start Program (Safe RPC + Fallback)
  const startProgram = useMutation({
    mutationFn: async (prog: Program) => {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('start_program', { p_program_id: prog.id })
      if (!rpcErr && rpcData?.success) return prog

      // Fallback direct update
      const { data, error } = await supabase
        .from('programs')
        .update({ status: 'active', started_at: new Date().toISOString(), closed_at: null })
        .eq('id', prog.id)
        .select()
        .single()

      if (error) throw error
      return (data || prog) as Program
    },
    onSuccess: (updatedProg) => {
      toast.success('Meeting started! Attendance link is now LIVE.')
      qc.invalidateQueries({ queryKey: ['programs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setConfirmAction(null)
      setShareModalProgram(updatedProg)
    },
    onError: (e: Error) => toast.error('Failed to start meeting', e.message),
  })

  // Close Program (Safe RPC + Fallback)
  const closeProgram = useMutation({
    mutationFn: async (id: string) => {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('close_program', { p_program_id: id })
      if (!rpcErr && rpcData?.success) return

      // Fallback direct update
      const { error } = await supabase
        .from('programs')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Meeting closed/paused. Attendance recording stopped.')
      qc.invalidateQueries({ queryKey: ['programs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setConfirmAction(null)
    },
    onError: (e: Error) => toast.error('Failed to close meeting', e.message),
  })

  // Re-Open Program (Safe RPC + Fallback)
  const reopenProgram = useMutation({
    mutationFn: async (prog: Program) => {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('reopen_program', { p_program_id: prog.id })
      if (!rpcErr && rpcData?.success) return prog

      // Fallback direct update
      const { data, error } = await supabase
        .from('programs')
        .update({ status: 'active', closed_at: null })
        .eq('id', prog.id)
        .select()
        .single()

      if (error) throw error
      return (data || prog) as Program
    },
    onSuccess: (updatedProg) => {
      toast.success('Meeting re-opened! Attendance link is LIVE again.')
      qc.invalidateQueries({ queryKey: ['programs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setConfirmAction(null)
      setShareModalProgram(updatedProg)
    },
    onError: (e: Error) => toast.error('Failed to re-open meeting', e.message),
  })

  const handleCopyLink = (p: Program) => {
    const url = `${window.location.origin}/attend/${p.id}`
    navigator.clipboard.writeText(url)
    toast.success('Attendance link copied!')
  }



  const activeProgram = programs.find(p => p.status === 'active')

  return (
    <div className="space-y-6 page-transition">
      {/* Top Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Meetings & Programs</h1>
            <p className="page-subtitle">
              Create meetings, generate instant WhatsApp links, and monitor live attendance
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary shadow-lg shadow-primary-600/20"
          >
            <Plus className="w-4 h-4" /> New Meeting (പുതിയ മീറ്റിംഗ്)
          </button>
        </div>
      </div>

      {/* Live Active Program Banner */}
      {activeProgram && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-xl animate-fade-in space-y-4 border border-emerald-400/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                Live Attendance Now Active
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Live Monitor Button */}
              <button
                onClick={() => setActiveMonitorProgram(activeProgram)}
                className="btn bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black py-2 px-3.5 rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Live Monitor (തത്സമയം കാണുക)</span>
              </button>

              {/* Share WhatsApp */}
              <button
                onClick={() => setShareModalProgram(activeProgram)}
                className="btn bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Share</span>
              </button>

              {/* Projector */}
              <button
                onClick={() => window.open(`/admin/projector/${activeProgram.id}`, '_blank')}
                className="btn bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Projector</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setConfirmAction({ type: 'close', program: activeProgram })}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Close / Pause</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{activeProgram.name}</h2>
            <p className="text-emerald-100 text-sm mt-1">
              📍 {activeProgram.venue} • 📅 {format(new Date(activeProgram.program_date), 'dd MMMM yyyy')}
              {activeProgram.start_time && ` • ⏰ ${activeProgram.start_time}`}
            </p>
          </div>

          {/* Live Banner – links + action buttons */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-emerald-300">Public Attendance Link:</span>
              <span className="font-mono text-white select-all bg-white/10 px-2.5 py-1 rounded-lg truncate">
                {window.location.origin}/attend/{activeProgram.id}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCopyLink(activeProgram)}
                className="text-white hover:text-emerald-200 font-bold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <a
                href={`/attend/${activeProgram.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-200 hover:text-white underline font-semibold flex items-center gap-1"
              >
                Open Kiosk <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`/board/${activeProgram.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-amber-200 hover:text-white underline font-semibold flex items-center gap-1"
              >
                View Board <LayoutList className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Program Create Form */}
      {showForm && (
        <ProgramForm
          onSave={(d, startImmediately) => createProgram.mutate({ form: d, startImmediately })}
          onClose={() => setShowForm(false)}
          saving={createProgram.isPending}
        />
      )}

      {/* Programs List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="card flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : programs.length === 0 ? (
          <div className="card text-center py-16">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-surface-300" />
            <p className="font-bold text-surface-800 text-base">No meetings yet</p>
            <p className="text-sm text-surface-400 mt-1">Create your first meeting to generate a shareable link</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create First Meeting
            </button>
          </div>
        ) : (
          programs.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              onStart={() => setConfirmAction({ type: 'start', program: p })}
              onClose={() => setConfirmAction({ type: 'close', program: p })}
              onReopen={() => setConfirmAction({ type: 'reopen', program: p })}
              onCopyLink={() => handleCopyLink(p)}
              onShareWhatsApp={() => setShareModalProgram(p)}
              onOpenMonitor={() => setActiveMonitorProgram(p)}
              onSelect={() => setSelected(selected?.id === p.id ? null : p)}
              selected={selected?.id === p.id}
            />
          ))
        )}
      </div>

      {/* Live Monitor Modal */}
      {activeMonitorProgram && (
        <LiveAttendanceMonitorModal
          program={activeMonitorProgram}
          onClose={() => setActiveMonitorProgram(null)}
        />
      )}

      {/* Share / WhatsApp Dialog */}
      {shareModalProgram && (
        <MeetingShareModal
          program={shareModalProgram}
          onClose={() => setShareModalProgram(null)}
          onOpenMonitor={() => {
            const p = shareModalProgram
            setShareModalProgram(null)
            setActiveMonitorProgram(p)
          }}
        />
      )}

      {/* Confirm Action Dialog */}
      {confirmAction && (
        <ConfirmDialog
          type={confirmAction.type}
          programName={confirmAction.program.name}
          onConfirm={() => {
            if (confirmAction.type === 'start') startProgram.mutate(confirmAction.program)
            else if (confirmAction.type === 'close') closeProgram.mutate(confirmAction.program.id)
            else if (confirmAction.type === 'reopen') reopenProgram.mutate(confirmAction.program)
          }}
          onCancel={() => setConfirmAction(null)}
          loading={startProgram.isPending || closeProgram.isPending || reopenProgram.isPending}
        />
      )}
    </div>
  )
}

function ProgramCard({
  program,
  onStart,
  onClose,
  onReopen,
  onCopyLink,
  onShareWhatsApp,
  onOpenMonitor,
  onSelect,
  selected
}: {
  program: Program
  onStart: () => void
  onClose: () => void
  onReopen: () => void
  onCopyLink: () => void
  onShareWhatsApp: () => void
  onOpenMonitor: () => void
  onSelect: () => void
  selected: boolean
}) {
  const { data: attendanceCount } = useQuery({
    queryKey: ['attendance-count', program.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('program_id', program.id)
      return count ?? 0
    },
    refetchInterval: program.status === 'active' ? 5000 : undefined,
  })

  return (
    <div className={clsx(
      'card p-5 transition-all duration-200 border',
      program.status === 'active'
        ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-50/20'
        : 'border-surface-200',
      selected && 'bg-primary-50'
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex-1 min-w-0" onClick={onSelect} role="button">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={clsx(
              'badge text-xs font-bold',
              program.status === 'active' ? 'badge-green' :
              program.status === 'upcoming' ? 'badge-yellow' : 'badge-gray'
            )}>
              {program.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {program.status === 'active' ? 'LIVE NOW' : program.status.toUpperCase()}
            </span>

            {attendanceCount !== undefined && (
              <span className="badge badge-blue font-bold text-xs">
                👥 {attendanceCount} Present
              </span>
            )}
          </div>

          <h3 className="font-bold text-lg text-surface-900 leading-snug">
            {program.name}
          </h3>

          <div className="flex flex-wrap gap-4 mt-2 text-xs text-surface-500">
            <span className="flex items-center gap-1 font-medium">
              <CalendarCheck className="w-3.5 h-3.5 text-primary-600" />
              {format(new Date(program.program_date), 'dd MMM yyyy')}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              {program.venue}
            </span>
            {program.start_time && (
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-primary-600" />
                {program.start_time}
              </span>
            )}
          </div>

          {program.description && (
            <p className="text-xs text-surface-500 mt-1.5 line-clamp-2">
              {program.description}
            </p>
          )}

          {/* Quick links display */}
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-surface-500 bg-surface-100/80 px-2.5 py-1.5 rounded-lg truncate">
              <span className="text-emerald-600 font-semibold">🔗</span>
              <span className="truncate">/attend/{program.id}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-surface-500 bg-amber-50 px-2.5 py-1.5 rounded-lg truncate border border-amber-100">
              <span className="text-amber-600 font-semibold">📋</span>
              <span className="truncate">/board/{program.id}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-100 flex-shrink-0">
          {/* Live Monitor */}
          <button
            onClick={onOpenMonitor}
            className="btn btn-secondary btn-sm font-bold border-primary-300 text-primary-700 hover:bg-primary-50"
            title="Open Live Monitor with Attendees feed"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Live Monitor</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={onShareWhatsApp}
            className="btn bg-[#25D366] hover:bg-[#20ba59] text-white btn-sm font-bold shadow-sm"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Copy Kiosk link */}
          <button
            onClick={onCopyLink}
            className="btn btn-secondary btn-sm"
            title="Copy attendance kiosk link"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kiosk Link</span>
          </button>

          {/* View Board */}
          <a
            href={`/board/${program.id}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold"
            title="Open public attendance board"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Board</span>
          </a>

          {/* Projector mode */}
          <button
            onClick={() => window.open(`/admin/projector/${program.id}`, '_blank')}
            className="btn btn-secondary btn-sm"
            title="Open projector presentation display"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Projector</span>
          </button>

          {/* Status buttons */}
          {program.status === 'upcoming' && (
            <button onClick={onStart} className="btn btn-success btn-sm font-bold">
              <Play className="w-3.5 h-3.5" /> START
            </button>
          )}

          {program.status === 'active' && (
            <button onClick={onClose} className="btn btn-danger btn-sm font-bold">
              <Square className="w-3.5 h-3.5" /> CLOSE
            </button>
          )}

          {program.status === 'closed' && (
            <button
              onClick={onReopen}
              className="btn btn-secondary btn-sm font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
              title="Re-open this meeting for attendance"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RE-OPEN
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProgramForm({ onSave, onClose, saving }: {
  onSave: (d: Partial<Program>, startImmediately: boolean) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    venue: '',
    program_date: new Date().toISOString().split('T')[0],
    start_time: '',
    description: '',
  })

  return (
    <div className="card p-6 border-2 border-primary-400 shadow-2xl animate-slide-up bg-white rounded-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-black text-xl text-surface-900">Create New Meeting (പുതിയ മീറ്റിംഗ്)</h3>
          <p className="text-xs text-surface-500 mt-0.5">Enter meeting details in English</p>
        </div>
        <button onClick={onClose} className="btn-icon btn-secondary"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label font-bold">Meeting Name (English) *</label>
          <input
            className="input text-base"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Zone Working Committee Meeting 2026"
            autoFocus
          />
        </div>

        <div>
          <label className="label font-bold">Venue / Place (English) *</label>
          <input
            className="input"
            value={form.venue}
            onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
            placeholder="e.g. Zone Office Hall, Chapparappadavu"
          />
        </div>

        <div>
          <label className="label font-bold">Meeting Date *</label>
          <input
            type="date"
            className="input"
            value={form.program_date}
            onChange={e => setForm(p => ({ ...p, program_date: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Start Time (Optional)</label>
          <input
            type="time"
            className="input"
            value={form.start_time}
            onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Description / Agenda (Optional)</label>
          <input
            className="input"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="e.g. Annual report, membership review"
          />
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-surface-200">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>

          {/* Option 1: Save as upcoming */}
          <button
            onClick={() => {
              if (form.name.trim() && form.venue.trim() && form.program_date) {
                onSave({
                  name: form.name.trim(),
                  venue: form.venue.trim(),
                  program_date: form.program_date,
                  start_time: form.start_time || undefined,
                  description: form.description ? form.description.trim() : undefined,
                }, false)
              }
            }}
            disabled={saving || !form.name.trim() || !form.venue.trim()}
            className="btn btn-secondary font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Upcoming
          </button>

          {/* Option 2: Save and start live now */}
          <button
            onClick={() => {
              if (form.name.trim() && form.venue.trim() && form.program_date) {
                onSave({
                  name: form.name.trim(),
                  venue: form.venue.trim(),
                  program_date: form.program_date,
                  start_time: form.start_time || undefined,
                  description: form.description ? form.description.trim() : undefined,
                }, true)
              }
            }}
            disabled={saving || !form.name.trim() || !form.venue.trim()}
            className="btn btn-success font-black shadow-lg shadow-emerald-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            🚀 Save & Start Live Now (ലിങ്ക് ഉടൻ ലഭ്യമാക്കുക)
          </button>
        </div>
      </div>
    </div>
  )
}

function MeetingShareModal({
  program,
  onClose,
  onOpenMonitor,
}: {
  program: Program
  onClose: () => void
  onOpenMonitor: () => void
}) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const [boardCopied, setBoardCopied] = useState(false)
  const url = `${window.location.origin}/attend/${program.id}`
  const boardUrl = `${window.location.origin}/board/${program.id}`

  const copyUrl = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Attendance kiosk link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyBoardUrl = () => {
    navigator.clipboard.writeText(boardUrl)
    setBoardCopied(true)
    toast.success('Attendance board link copied! Share this to show who attended.')
    setTimeout(() => setBoardCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = `*SKSSF ചപ്പാരപ്പടവ് മേഖല*\n📢 *മീറ്റിംഗ് ഹാജർ രേഖപ്പെടുത്തൽ (ATTENDANCE)*\n\n📌 *${program.name}*\n📍 *സ്ഥലം (Venue):* ${program.venue}\n📅 *തീയതി (Date):* ${format(new Date(program.program_date), 'dd MMM yyyy')}\n\n👉 ഹാജർ രേഖപ്പെടുത്താൻ (To Mark Attendance):\n🔗 ${url}\n\n👁️ ഹാജർ പട്ടിക കാണാൻ (View Attendance Board):\n📋 ${boardUrl}\n\n(പ്രത്യേക പാസ്‌വേർഡ് ആവശ്യമില്ല. മൊബൈൽ നമ്പർ നൽകി കൺഫോം ചെയ്യുക)`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareBoardWhatsApp = () => {
    const text = `*SKSSF ചപ്പാരപ്പടവ് മേഖല*\n📋 *ഹാജർ പട്ടിക – ${program.name}*\n📍 ${program.venue} • 📅 ${format(new Date(program.program_date), 'dd MMM yyyy')}\n\n👉 ഹാജരായ അംഗങ്ങളുടെ പട്ടിക ഇവിടെ കാണാം:\n${boardUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
  const qrBoardImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(boardUrl)}`

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-surface-900 border border-surface-200 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Shareable Links</h3>
              <p className="text-xs text-emerald-100">WhatsApp Links, QR Codes & Attendance Board</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meeting Summary */}
          <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
            <h4 className="font-bold text-surface-900 text-sm leading-snug">{program.name}</h4>
            <div className="text-xs text-surface-500 mt-1 flex flex-wrap gap-2">
              <span>📍 {program.venue}</span>
              <span>•</span>
              <span>📅 {format(new Date(program.program_date), 'dd MMM yyyy')}</span>
            </div>
          </div>

          {/* ─── LINK 1: Attendance Kiosk ─── */}
          <div className="border-2 border-emerald-200 rounded-2xl overflow-hidden">
            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200">
              <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">🔗 Attendance Kiosk Link — ഹാജർ രേഖപ്പെടുത്തൽ</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Members use this to mark their attendance</p>
            </div>
            <div className="p-4 space-y-3">
              {/* QR Code */}
              <div className="text-center p-3 bg-surface-50 rounded-xl border border-surface-100">
                <img
                  src={qrImageUrl}
                  alt="Kiosk QR Code"
                  className="w-32 h-32 mx-auto rounded-xl shadow-sm border border-surface-200 bg-white p-2"
                />
                <p className="text-[11px] font-semibold text-surface-500 mt-2 flex items-center justify-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-primary-600" />
                  Scan to mark attendance
                </p>
              </div>

              {/* Copy Kiosk URL */}
              <div className="flex gap-2">
                <input
                  readOnly
                  value={url}
                  className="input text-xs font-mono select-all bg-surface-100 text-surface-800"
                />
                <button
                  onClick={copyUrl}
                  className={clsx(
                    'btn btn-sm font-bold px-3 transition flex items-center gap-1 whitespace-nowrap',
                    copied ? 'btn-success' : 'btn-secondary'
                  )}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                onClick={shareWhatsApp}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp ൽ ഷെയർ ചെയ്യുക</span>
              </button>
            </div>
          </div>

          {/* ─── LINK 2: Attendance Board (View Only) ─── */}
          <div className="border-2 border-amber-200 rounded-2xl overflow-hidden">
            <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200">
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider">📋 Attendance Board — ഹാജർ പട്ടിക</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Share this to let everyone see who attended (read-only)</p>
            </div>
            <div className="p-4 space-y-3">
              {/* Board QR Code */}
              <div className="text-center p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <img
                  src={qrBoardImageUrl}
                  alt="Board QR Code"
                  className="w-32 h-32 mx-auto rounded-xl shadow-sm border border-amber-200 bg-white p-2"
                />
                <p className="text-[11px] font-semibold text-amber-600 mt-2 flex items-center justify-center gap-1">
                  <LayoutList className="w-3.5 h-3.5" />
                  Scan to view attendance list
                </p>
              </div>

              {/* Copy Board URL */}
              <div className="flex gap-2">
                <input
                  readOnly
                  value={boardUrl}
                  className="input text-xs font-mono select-all bg-amber-50 text-amber-800 border-amber-200"
                />
                <button
                  onClick={copyBoardUrl}
                  className={clsx(
                    'btn btn-sm font-bold px-3 transition flex items-center gap-1 whitespace-nowrap',
                    boardCopied ? 'btn-success' : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                  )}
                >
                  {boardCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{boardCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                onClick={shareBoardWhatsApp}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>ഹാജർ പട്ടിക WhatsApp ൽ ഷെയർ ചെയ്യുക</span>
              </button>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenMonitor}
              className="py-2.5 px-3 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span>Live Monitor</span>
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-surface-100 hover:bg-surface-200 text-surface-700 border border-surface-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>Open Kiosk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ type, programName, onConfirm, onCancel, loading }: {
  type: 'start' | 'close' | 'reopen'
  programName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in p-6">
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4',
          type === 'start' ? 'bg-emerald-100 text-emerald-600' :
          type === 'reopen' ? 'bg-blue-100 text-blue-600' :
          'bg-red-100 text-red-600'
        )}>
          {type === 'start' ? <Play className="w-6 h-6" /> :
           type === 'reopen' ? <RotateCcw className="w-6 h-6" /> :
           <AlertTriangle className="w-6 h-6" />}
        </div>

        <h3 className="text-lg font-bold text-surface-900 text-center">
          {type === 'start' ? 'Start Meeting Attendance?' :
           type === 'reopen' ? 'Re-open Meeting Attendance?' :
           'Close / Pause Attendance?'}
        </h3>

        <p className="text-sm text-surface-600 text-center mt-2 leading-relaxed">
          <strong>"{programName}"</strong>
          <br />
          {type === 'start'
            ? 'The public attendance link will become LIVE immediately. Members can record attendance.'
            : type === 'reopen'
            ? 'The attendance link will be re-activated. Members can continue marking attendance.'
            : 'Attendance recording will be paused/closed. Visitors to the link will see that attendance is closed.'}
        </p>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'btn flex-1 font-bold',
              type === 'start' ? 'btn-success' :
              type === 'reopen' ? 'btn-primary' :
              'btn-danger'
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
             type === 'start' ? 'Start Now' :
             type === 'reopen' ? 'Re-Open Now' :
             'Close Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Program } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import {
  Plus, Play, Square, CalendarCheck, MapPin, Clock, X, Save,
  Loader2, AlertTriangle
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'

export default function ProgramManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Program | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'start' | 'close'; program: Program } | null>(null)

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
    refetchInterval: 30000,
  })

  const createProgram = useMutation({
    mutationFn: async (form: Partial<Program>) => {
      const { error } = await supabase.from('programs').insert({ ...form, status: 'upcoming' })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Program created successfully')
      qc.invalidateQueries({ queryKey: ['programs'] })
      setShowForm(false)
    },
    onError: (e: Error) => toast.error('Failed to create program', e.message),
  })

  const startProgram = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('start_program', { p_program_id: id })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
    },
    onSuccess: () => {
      toast.success('Program started! Attendance recording is now active.')
      qc.invalidateQueries({ queryKey: ['programs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setConfirmAction(null)
    },
    onError: (e: Error) => toast.error('Failed to start program', e.message),
  })

  const closeProgram = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('close_program', { p_program_id: id })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
    },
    onSuccess: () => {
      toast.success('Program closed. No more attendance can be recorded.')
      qc.invalidateQueries({ queryKey: ['programs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setConfirmAction(null)
    },
    onError: (e: Error) => toast.error('Failed to close program', e.message),
  })

  const activeProgram = programs.find(p => p.status === 'active')

  return (
    <div className="space-y-5 page-transition">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Programs</h1>
            <p className="page-subtitle">{programs.length} total programs</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary" disabled={!!activeProgram}>
            <Plus className="w-4 h-4" /> New Program
          </button>
        </div>
      </div>

      {activeProgram && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider">Live Now</span>
          </div>
          <h2 className="text-lg font-bold">{activeProgram.name}</h2>
          <p className="text-green-100 text-sm">{activeProgram.venue} • {format(new Date(activeProgram.program_date), 'dd MMM yyyy')}</p>
          <button
            onClick={() => setConfirmAction({ type: 'close', program: activeProgram })}
            className="mt-3 btn bg-white text-red-600 hover:bg-red-50 text-sm font-semibold"
          >
            <Square className="w-4 h-4" /> CLOSE PROGRAM
          </button>
        </div>
      )}

      {showForm && (
        <ProgramForm
          onSave={(d) => createProgram.mutate(d)}
          onClose={() => setShowForm(false)}
          saving={createProgram.isPending}
        />
      )}

      {/* Programs list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="card flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : programs.length === 0 ? (
          <div className="card text-center py-12">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-surface-300" />
            <p className="font-medium text-surface-700">No programs yet</p>
            <p className="text-sm text-surface-400 mt-1">Create your first program to get started</p>
          </div>
        ) : (
          programs.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              onStart={() => setConfirmAction({ type: 'start', program: p })}
              onClose={() => setConfirmAction({ type: 'close', program: p })}
              onSelect={() => setSelected(selected?.id === p.id ? null : p)}
              selected={selected?.id === p.id}
            />
          ))
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          type={confirmAction.type}
          programName={confirmAction.program.name}
          onConfirm={() => {
            if (confirmAction.type === 'start') startProgram.mutate(confirmAction.program.id)
            else closeProgram.mutate(confirmAction.program.id)
          }}
          onCancel={() => setConfirmAction(null)}
          loading={startProgram.isPending || closeProgram.isPending}
        />
      )}
    </div>
  )
}

function ProgramCard({ program, onStart, onClose, onSelect, selected }: {
  program: Program
  onStart: () => void
  onClose: () => void
  onSelect: () => void
  selected: boolean
}) {
  const { data: attendanceCount } = useQuery({
    queryKey: ['attendance-count', program.id],
    queryFn: async () => {
      const { count } = await supabase.from('attendance').select('id', { count: 'exact' }).eq('program_id', program.id)
      return count ?? 0
    },
    enabled: program.status !== 'upcoming',
  })

  return (
    <div className={clsx('card p-4 transition-all duration-200', program.status === 'active' && 'ring-2 ring-green-500', selected && 'bg-primary-50')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0" onClick={onSelect} role="button">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx(
              'badge',
              program.status === 'active' ? 'badge-green' :
              program.status === 'upcoming' ? 'badge-yellow' : 'badge-gray'
            )}>
              {program.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
              {program.status}
            </span>
            {attendanceCount !== undefined && (
              <span className="badge badge-blue">{attendanceCount} present</span>
            )}
          </div>
          <h3 className="font-semibold text-surface-900 truncate">{program.name}</h3>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-surface-500">
            <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" />{format(new Date(program.program_date), 'dd MMM yyyy')}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{program.venue}</span>
            {program.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{program.start_time}</span>}
          </div>
          {program.description && <p className="text-xs text-surface-400 mt-1 truncate">{program.description}</p>}
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          {program.status === 'upcoming' && (
            <button onClick={onStart} className="btn btn-success btn-sm">
              <Play className="w-3.5 h-3.5" /> START
            </button>
          )}
          {program.status === 'active' && (
            <button onClick={onClose} className="btn btn-danger btn-sm">
              <Square className="w-3.5 h-3.5" /> CLOSE
            </button>
          )}
          {program.status === 'closed' && (
            <span className="badge badge-gray">Closed</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ProgramForm({ onSave, onClose, saving }: {
  onSave: (d: Partial<Program>) => void
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
    <div className="card p-5 border-2 border-primary-200 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-surface-900">Create New Program</h3>
        <button onClick={onClose} className="btn-icon btn-secondary"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Program Name *</label>
          <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Annual General Meeting 2024" />
        </div>
        <div>
          <label className="label">Venue *</label>
          <input className="input" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="e.g. Zone Office Hall" />
        </div>
        <div>
          <label className="label">Program Date *</label>
          <input type="date" className="input" value={form.program_date} onChange={e => setForm(p => ({ ...p, program_date: e.target.value }))} />
        </div>
        <div>
          <label className="label">Start Time</label>
          <input type="time" className="input" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details" />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={() => { if (form.name && form.venue && form.program_date) onSave(form) }}
            disabled={saving || !form.name || !form.venue}
            className="btn btn-primary"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Program
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ type, programName, onConfirm, onCancel, loading }: {
  type: 'start' | 'close'
  programName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in p-6">
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4', type === 'start' ? 'bg-green-100' : 'bg-red-100')}>
          {type === 'start' ? <Play className="w-6 h-6 text-green-600" /> : <AlertTriangle className="w-6 h-6 text-red-600" />}
        </div>
        <h3 className="text-lg font-semibold text-surface-900 text-center">
          {type === 'start' ? 'Start Program?' : 'Close Program?'}
        </h3>
        <p className="text-sm text-surface-500 text-center mt-2">
          <strong>"{programName}"</strong>
          <br />
          {type === 'start'
            ? 'Attendance recording will become active. Operators can start marking attendance.'
            : 'No new attendance can be recorded after closing. This action is permanent.'}
        </p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="btn btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx('btn flex-1', type === 'start' ? 'btn-success' : 'btn-danger')}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : type === 'start' ? <Play className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {type === 'start' ? 'Start' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type AttendanceOperator } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import {
  Search, Plus, ShieldCheck, ShieldAlert, Phone,
  UserCheck, UserX, Trash2, Copy, Check, Loader2, X
} from 'lucide-react'
import { clsx } from 'clsx'

export default function OperatorManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const { data: operators = [], isLoading } = useQuery<AttendanceOperator[]>({
    queryKey: ['attendance-operators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_operators')
        .select('*, profile:profiles(*)')
        .order('full_name')
      if (error) throw error
      return (data ?? []) as AttendanceOperator[]
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('attendance_operators')
        .update({ is_active: !isActive })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Operator status updated')
      qc.invalidateQueries({ queryKey: ['attendance-operators'] })
    },
    onError: (err: Error) => toast.error('Update failed', err.message),
  })

  const deleteOperator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('attendance_operators').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Operator deleted')
      qc.invalidateQueries({ queryKey: ['attendance-operators'] })
    },
    onError: (err: Error) => toast.error('Delete failed', err.message),
  })

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !mobile.trim() || !password.trim()) {
      toast.warning('Please fill all required fields')
      return
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '')
    if (cleanMobile.length < 10) {
      toast.warning('Please enter a valid 10-digit mobile number')
      return
    }

    setCreating(true)
    try {
      const email = `op_${cleanMobile}@gmail.com`

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: 'operator',
          },
        },
      })

      if (authError && !authError.message.includes('already registered')) {
        throw authError
      }

      const profileId = authData?.user?.id ?? null

      // 2. Insert into attendance_operators
      const { error: opError } = await supabase.from('attendance_operators').insert({
        full_name: name.trim(),
        mobile: cleanMobile,
        profile_id: profileId,
        is_active: true,
      })

      if (opError) throw opError

      toast.success('Operator registered successfully!')
      setName('')
      setMobile('')
      setPassword('')
      setShowAddModal(false)
      qc.invalidateQueries({ queryKey: ['attendance-operators'] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create operator'
      toast.error('Error creating operator', message)
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCredentials = (op: AttendanceOperator) => {
    const text = `SKSSF Attendance Operator Login:\nMobile: ${op.mobile}\nPortal: ${window.location.origin}/operator/login`
    navigator.clipboard.writeText(text)
    setCopiedId(op.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Login info copied to clipboard')
  }

  const filtered = operators.filter(op =>
    op.full_name.toLowerCase().includes(search.toLowerCase()) ||
    op.mobile.includes(search)
  )

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance Operators</h1>
          <p className="page-subtitle">Manage on-field scanning personnel and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Operator</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search operator by name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Operators Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
          <p className="text-sm text-surface-500">Loading operators...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-surface-700">No operators found</p>
          <p className="text-sm text-surface-400 mt-1">
            {search ? 'Try modifying your search filter.' : 'Click "Add Operator" to create your first operator.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((op) => (
            <div
              key={op.id}
              className={clsx(
                'card p-5 border transition-all duration-200 relative overflow-hidden',
                op.is_active ? 'border-surface-200' : 'border-red-200 bg-red-50/20'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
                      op.is_active ? 'bg-primary-100 text-primary-700' : 'bg-surface-200 text-surface-500'
                    )}
                  >
                    {op.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 leading-tight">{op.full_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-surface-500 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{op.mobile}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={clsx(
                    'badge text-xs',
                    op.is_active ? 'badge-green' : 'badge-red'
                  )}
                >
                  {op.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Operator Role
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyCredentials(op)}
                    title="Copy Login Details"
                    className="p-1.5 text-surface-500 hover:text-primary-600 hover:bg-surface-100 rounded-lg transition-colors"
                  >
                    {copiedId === op.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleStatus.mutate({ id: op.id, isActive: op.is_active })}
                    title={op.is_active ? 'Deactivate' : 'Activate'}
                    className={clsx(
                      'p-1.5 rounded-lg transition-colors',
                      op.is_active
                        ? 'text-yellow-600 hover:bg-yellow-50'
                        : 'text-green-600 hover:bg-green-50'
                    )}
                  >
                    {op.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete operator ${op.full_name}?`)) {
                        deleteOperator.mutate(op.id)
                      }
                    }}
                    title="Delete Operator"
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-slide-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-surface-900 mb-1">Add New Operator</h2>
            <p className="text-xs text-surface-500 mb-4">
              Enter operator information. An account will be configured for mobile authentication.
            </p>

            <form onSubmit={handleCreateOperator} className="space-y-4">
              <div>
                <label className="label">Operator Full Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Muhammed Shafi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  className="input"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
                <span className="text-xs text-surface-400 mt-1 block">
                  Used by operator as user identifier during login
                </span>
              </div>

              <div>
                <label className="label">Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{creating ? 'Creating...' : 'Create Operator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

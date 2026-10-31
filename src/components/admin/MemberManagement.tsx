import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Member } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import {
  Search, Plus, Edit2, UserCheck, UserX, X, ChevronDown, ChevronUp,
  Phone, Hash, Users, Save, Loader2
} from 'lucide-react'
import { clsx } from 'clsx'

interface MemberWithPositions extends Member {
  member_positions?: Array<{
    id: string
    committee: { name: string; level: string }
    position: { title: string }
    cluster?: { name: string } | null
    unit?: { name: string } | null
    is_active: boolean
  }>
}

export default function MemberManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          member_positions(
            id, is_active,
            committee:committees(name, level),
            position:positions(title),
            cluster:clusters(name),
            unit:units(name)
          )
        `)
        .order('full_name')
      if (error) throw error
      return (data ?? []) as MemberWithPositions[]
    }
  })

  const filtered = members.filter(m => {
    const matchSearch = !search || 
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search) ||
      (m.membership_number ?? '').includes(search)
    const matchActive = filterActive === 'all' || 
      (filterActive === 'active' ? m.is_active : !m.is_active)
    return matchSearch && matchActive
  })

  const saveMutation = useMutation({
    mutationFn: async (form: Partial<Member>) => {
      if (editing) {
        const { error } = await supabase.from('members').update(form).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('members').insert(form)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Member updated' : 'Member added')
      qc.invalidateQueries({ queryKey: ['members'] })
      setShowForm(false)
      setEditing(null)
    },
    onError: (e: Error) => toast.error('Failed to save', e.message),
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('members').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Member status updated')
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

  return (
    <div className="space-y-5 page-transition">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Members</h1>
            <p className="page-subtitle">{members.length} total members</p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search name, mobile, membership no..."
            className="input pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={clsx('btn btn-sm capitalize', filterActive === f ? 'btn-primary' : 'btn-secondary')}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <MemberForm
          member={editing}
          onSave={(d) => saveMutation.mutate(d)}
          onClose={() => { setShowForm(false); setEditing(null) }}
          saving={saveMutation.isPending}
        />
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-surface-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No members found</p>
            <p className="text-sm mt-1">Add members using the button above</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Membership No.</th>
                  <th>Positions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const activePositions = (m.member_positions ?? []).filter(p => p.is_active)
                  const isExpanded = expandedId === m.id
                  return (
                    <>
                      <tr key={m.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                        <td className="text-surface-400 text-xs">{i + 1}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {m.full_name.charAt(0)}
                            </div>
                            <span className="font-medium text-surface-900">{m.full_name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-surface-600">
                            <Phone className="w-3 h-3" /> {m.mobile}
                          </div>
                        </td>
                        <td>
                          {m.membership_number ? (
                            <div className="flex items-center gap-1.5 text-surface-600">
                              <Hash className="w-3 h-3" /> {m.membership_number}
                            </div>
                          ) : <span className="text-surface-300">—</span>}
                        </td>
                        <td>
                          <span className="badge badge-blue">{activePositions.length} position{activePositions.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td>
                          <span className={m.is_active ? 'badge-green' : 'badge-red' + ' badge'}>
                            {m.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditing(m); setShowForm(true) }}
                              className="btn-icon btn-secondary text-surface-600"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleActive.mutate({ id: m.id, is_active: !m.is_active })}
                              className={clsx('btn-icon', m.is_active ? 'btn-secondary text-red-500' : 'btn-secondary text-green-600')}
                              title={m.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {m.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : m.id)}
                              className="btn-icon btn-secondary"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && activePositions.length > 0 && (
                        <tr key={`${m.id}-positions`}>
                          <td colSpan={7} className="bg-surface-50 px-4 py-3">
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Committee Positions</p>
                              {activePositions.map(pos => (
                                <div key={pos.id} className="flex items-center gap-2 text-sm">
                                  <span className={clsx('badge', pos.committee.level === 'zone' ? 'badge-purple' : pos.committee.level === 'cluster' ? 'badge-blue' : 'badge-gray')}>
                                    {pos.committee.level}
                                  </span>
                                  <span className="font-medium text-surface-800">{pos.position.title}</span>
                                  <span className="text-surface-500">— {pos.committee.name}</span>
                                  {pos.cluster && <span className="text-surface-400 text-xs">• {pos.cluster.name}</span>}
                                  {pos.unit && <span className="text-surface-400 text-xs">• {pos.unit.name}</span>}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MemberForm({ member, onSave, onClose, saving }: {
  member: Member | null
  onSave: (d: Partial<Member>) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    full_name: member?.full_name ?? '',
    mobile: member?.mobile ?? '',
    membership_number: member?.membership_number ?? '',
    notes: member?.notes ?? '',
    is_active: member?.is_active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) return
    if (!form.mobile.trim()) return
    onSave({
      full_name: form.full_name.trim(),
      mobile: form.mobile.trim(),
      membership_number: form.membership_number.trim() || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    })
  }

  return (
    <div className="card p-5 border-2 border-primary-200 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-surface-900">{member ? 'Edit Member' : 'Add New Member'}</h3>
        <button onClick={onClose} className="btn-icon btn-secondary"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" required value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Enter full name" />
        </div>
        <div>
          <label className="label">Mobile Number *</label>
          <input className="input" required value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="10-digit mobile number" inputMode="numeric" />
        </div>
        <div>
          <label className="label">Membership Number</label>
          <input className="input" value={form.membership_number} onChange={e => setForm(p => ({ ...p, membership_number: e.target.value }))} placeholder="Optional" />
        </div>
        <div>
          <label className="label">Notes</label>
          <input className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded text-primary-600" />
            <span className="text-sm text-surface-700">Active member</span>
          </label>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {member ? 'Update' : 'Add Member'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

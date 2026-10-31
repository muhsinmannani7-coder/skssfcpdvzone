import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/shared/Toaster'
import { Building2, Plus, Save, X, ChevronDown, ChevronRight, Loader2, Users, UserPlus } from 'lucide-react'
import { clsx } from 'clsx'

const COMMITTEE_POSITIONS = ['President', 'General Secretary', 'Working Secretary', 'Treasurer']

interface CommitteeWithDetails {
  id: string
  name: string
  level: 'zone' | 'cluster' | 'unit'
  cluster_id?: string | null
  unit_id?: string | null
  positions?: Array<{
    id: string
    title: string
    points: number
    sort_order: number
    member_positions?: Array<{
      id: string
      member?: { full_name: string; mobile: string } | null
    }>
  }>
}

export default function CommitteeManagement() {
  const toast = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'zone' | 'clusters' | 'units'>('zone')
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState<{ committeeId: string; positionId: string; positionTitle: string } | null>(null)

  // Fetch all data
  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: async () => {
      const { data } = await supabase.from('clusters').select('*').order('name')
      return data ?? []
    }
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await supabase.from('units').select('*, cluster:clusters(name)').order('name')
      return data ?? []
    }
  })

  const { data: committees = [] } = useQuery<CommitteeWithDetails[]>({
    queryKey: ['committees-full'],
    queryFn: async () => {
      const { data } = await supabase
        .from('committees')
        .select('*, positions(*, member_positions(*, member:members(full_name, mobile)))')
        .order('name')
      return (data ?? []) as CommitteeWithDetails[]
    }
  })

  const { data: members = [] } = useQuery({
    queryKey: ['members-list'],
    queryFn: async () => {
      const { data } = await supabase.from('members').select('id, full_name, mobile').eq('is_active', true).order('full_name')
      return (data ?? []) as Array<{ id: string; full_name: string; mobile: string }>
    }
  })

  const zoneCommittee = committees.find(c => c.level === 'zone')
  const clusterCommittees = committees.filter(c => c.level === 'cluster')
  const unitCommittees = committees.filter(c => c.level === 'unit')

  const addUnit = useMutation({
    mutationFn: async ({ name, cluster_id }: { name: string; cluster_id: string }) => {
      // Create unit
      const { data: unit, error: uErr } = await supabase.from('units').insert({ name, cluster_id }).select().single()
      if (uErr) throw uErr
      // Create committee for unit
      const { data: comm, error: cErr } = await supabase.from('committees').insert({ name: `${name} COMMITTEE`, level: 'unit', unit_id: unit.id, cluster_id }).select().single()
      if (cErr) throw cErr
      // Create 4 standard positions
      const positions = COMMITTEE_POSITIONS.map((title, i) => ({ title, committee_id: comm.id, points: 1, sort_order: i }))
      const { error: pErr } = await supabase.from('positions').insert(positions)
      if (pErr) throw pErr
    },
    onSuccess: () => {
      toast.success('Unit created with committee and positions')
      qc.invalidateQueries({ queryKey: ['units'] })
      qc.invalidateQueries({ queryKey: ['committees-full'] })
      setShowUnitForm(false)
    },
    onError: (e: Error) => toast.error('Failed to create unit', e.message),
  })

  const assignMember = useMutation({
    mutationFn: async ({ memberId, positionId, committeeId, clusterId, unitId }: {
      memberId: string; positionId: string; committeeId: string; clusterId?: string | null; unitId?: string | null
    }) => {
      // Remove existing assignment for this position
      await supabase.from('member_positions').delete().eq('position_id', positionId)
      // Create new assignment
      const { error } = await supabase.from('member_positions').insert({
        member_id: memberId,
        position_id: positionId,
        committee_id: committeeId,
        cluster_id: clusterId,
        unit_id: unitId,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Member assigned to position')
      qc.invalidateQueries({ queryKey: ['committees-full'] })
      setShowAssignForm(null)
    },
    onError: (e: Error) => toast.error('Assignment failed', e.message),
  })

  const createClusterCommittees = useMutation({
    mutationFn: async () => {
      for (const cluster of clusters) {
        const existing = clusterCommittees.find(c => c.cluster_id === cluster.id)
        if (!existing) {
          const { data: comm, error } = await supabase.from('committees')
            .insert({ name: `${cluster.name} COMMITTEE`, level: 'cluster', cluster_id: cluster.id })
            .select().single()
          if (error) throw error
          const positions = COMMITTEE_POSITIONS.map((title, i) => ({ title, committee_id: comm.id, points: 1, sort_order: i }))
          await supabase.from('positions').insert(positions)
        }
      }
    },
    onSuccess: () => {
      toast.success('Cluster committees created')
      qc.invalidateQueries({ queryKey: ['committees-full'] })
    },
    onError: (e: Error) => toast.error('Failed', e.message),
  })

  const createZoneCommittee = useMutation({
    mutationFn: async () => {
      const { data: comm, error } = await supabase.from('committees')
        .insert({ name: 'ZONE COMMITTEE', level: 'zone' })
        .select().single()
      if (error) throw error
      const positions = [
        'President', 'Vice President', 'General Secretary', 'Additional General Secretary',
        'Joint Secretary 1', 'Joint Secretary 2', 'Working Secretary 1', 'Working Secretary 2',
        'Treasurer', 'Joint Treasurer', 'Editor', 'Sub Editor',
        'Executive Member 1', 'Executive Member 2', 'Executive Member 3', 'Executive Member 4',
        'Executive Member 5', 'Executive Member 6', 'Executive Member 7', 'Executive Member 8',
        'Executive Member 9'
      ].map((title, i) => ({ title, committee_id: comm.id, points: 1, sort_order: i }))
      await supabase.from('positions').insert(positions)
    },
    onSuccess: () => {
      toast.success('Zone committee created with 21 positions')
      qc.invalidateQueries({ queryKey: ['committees-full'] })
    },
    onError: (e: Error) => toast.error('Failed', e.message),
  })

  return (
    <div className="space-y-5 page-transition">
      <div className="page-header">
        <h1 className="page-title">Committees & Units</h1>
        <p className="page-subtitle">Manage zone, cluster, and unit committees</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">1</p>
          <p className="text-xs text-surface-500">Zone Committee</p>
          <p className="text-xs text-surface-400">21 positions</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">3</p>
          <p className="text-xs text-surface-500">Cluster Committees</p>
          <p className="text-xs text-surface-400">12 positions</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{units.length}</p>
          <p className="text-xs text-surface-500">Unit Committees</p>
          <p className="text-xs text-surface-400">{units.length * 4} positions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {(['zone', 'clusters', 'units'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', activeTab === tab ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-600 hover:text-surface-900')}>
            {tab}
          </button>
        ))}
      </div>

      {/* Zone Committee */}
      {activeTab === 'zone' && (
        <div className="space-y-4">
          {!zoneCommittee ? (
            <div className="card p-6 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <p className="font-medium text-surface-700 mb-3">Zone Committee not set up yet</p>
              <button onClick={() => createZoneCommittee.mutate()} disabled={createZoneCommittee.isPending} className="btn btn-primary">
                {createZoneCommittee.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Zone Committee (21 positions)
              </button>
            </div>
          ) : (
            <CommitteeCard
              committee={zoneCommittee}
              onAssign={(positionId, positionTitle) => setShowAssignForm({ committeeId: zoneCommittee.id, positionId, positionTitle })}
            />
          )}
        </div>
      )}

      {/* Cluster Committees */}
      {activeTab === 'clusters' && (
        <div className="space-y-4">
          {clusterCommittees.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="font-medium text-surface-700 mb-3">Cluster committees not created yet</p>
              <button onClick={() => createClusterCommittees.mutate()} disabled={createClusterCommittees.isPending} className="btn btn-primary">
                {createClusterCommittees.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create All Cluster Committees
              </button>
            </div>
          ) : (
            clusterCommittees.map((c: CommitteeWithDetails) => (
              <CommitteeCard
                key={c.id}
                committee={c}
                onAssign={(positionId, positionTitle) => setShowAssignForm({ committeeId: c.id, positionId, positionTitle })}
              />
            ))
          )}
        </div>
      )}

      {/* Unit Committees */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-surface-500">{units.length} units across {clusters.length} clusters</p>
            <button onClick={() => setShowUnitForm(true)} className="btn btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" /> Add Unit
            </button>
          </div>
          {showUnitForm && (
            <UnitForm
              clusters={clusters}
              onSave={(d) => addUnit.mutate(d)}
              onClose={() => setShowUnitForm(false)}
              saving={addUnit.isPending}
            />
          )}
          {clusters.map((cluster: { id: string; name: string }) => {
            const clusterUnits = unitCommittees.filter(c => c.cluster_id === cluster.id)
            return (
              <div key={cluster.id} className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 rounded-full bg-primary-500" />
                  <h3 className="font-semibold text-surface-900">{cluster.name}</h3>
                  <span className="badge badge-blue">{clusterUnits.length} units</span>
                </div>
                <div className="space-y-3">
                  {clusterUnits.map((c: CommitteeWithDetails) => (
                    <CommitteeCard
                      key={c.id}
                      committee={c}
                      compact
                      onAssign={(positionId, positionTitle) => setShowAssignForm({ committeeId: c.id, positionId, positionTitle })}
                    />
                  ))}
                  {clusterUnits.length === 0 && (
                    <p className="text-sm text-surface-400 text-center py-2">No units added yet</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignForm && (
        <AssignMemberModal
          {...showAssignForm}
          members={members}
          onAssign={(memberId) => {
            const c = committees.find(comm => comm.id === showAssignForm.committeeId)
            assignMember.mutate({
              memberId,
              positionId: showAssignForm.positionId,
              committeeId: showAssignForm.committeeId,
              clusterId: c?.cluster_id,
              unitId: c?.unit_id,
            })
          }}
          onClose={() => setShowAssignForm(null)}
          saving={assignMember.isPending}
        />
      )}
    </div>
  )
}

function CommitteeCard({ committee, compact = false, onAssign }: {
  committee: CommitteeWithDetails
  compact?: boolean
  onAssign: (positionId: string, positionTitle: string) => void
}) {
  const [expanded, setExpanded] = useState(!compact)
  const positions = committee.positions ?? []

  return (
    <div className={clsx('border border-surface-200 rounded-xl overflow-hidden', compact ? 'bg-surface-50' : 'bg-white')}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-surface-400" /> : <ChevronRight className="w-4 h-4 text-surface-400" />}
          <span className="font-medium text-surface-900 text-sm">{committee.name}</span>
          <span className="badge badge-gray">{positions.length} positions</span>
        </div>
        <span className="text-xs text-surface-400">
          {positions.filter(p => (p.member_positions ?? []).length > 0).length} filled
        </span>
      </div>
      {expanded && (
        <div className="border-t border-surface-100">
          <table className="table">
            <thead><tr><th>Position</th><th>Assigned Member</th><th>Mobile</th><th></th></tr></thead>
            <tbody>
              {positions.map(pos => {
                const mp = (pos.member_positions ?? [])[0]
                const member = mp?.member
                return (
                  <tr key={pos.id}>
                    <td className="font-medium">{pos.title}</td>
                    <td>{member ? <span className="font-medium text-surface-900">{member.full_name}</span> : <span className="text-surface-400 italic">Vacant</span>}</td>
                    <td className="text-surface-500">{member?.mobile ?? '—'}</td>
                    <td>
                      <button
                        onClick={() => onAssign(pos.id, pos.title)}
                        className="btn btn-sm btn-secondary gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        {member ? 'Change' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UnitForm({ clusters, onSave, onClose, saving }: {
  clusters: Array<{ id: string; name: string }>
  onSave: (d: { name: string; cluster_id: string }) => void
  onClose: () => void
  saving: boolean
}) {
  const [name, setName] = useState('')
  const [clusterId, setClusterId] = useState(clusters[0]?.id ?? '')
  return (
    <div className="card p-4 border-2 border-primary-200 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-surface-900">Add New Unit</h3>
        <button onClick={onClose} className="btn-icon btn-secondary"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Unit Name *</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CHAPPARAPPADAVU UNIT" />
        </div>
        <div>
          <label className="label">Cluster *</label>
          <select className="input" value={clusterId} onChange={e => setClusterId(e.target.value)}>
            {clusters.map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-3 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={() => { if (name && clusterId) onSave({ name: name.toUpperCase(), cluster_id: clusterId }) }} disabled={saving || !name} className="btn btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Unit
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignMemberModal({ positionTitle, members, onAssign, onClose, saving }: {
  committeeId?: string; positionId?: string; positionTitle: string
  members: Array<{ id: string; full_name: string; mobile: string }>
  onAssign: (memberId: string) => void
  onClose: () => void
  saving: boolean
}) {
  const [search, setSearch] = useState('')
  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) || m.mobile.includes(search)
  )
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-bounce-in">
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <div>
            <h3 className="font-semibold text-surface-900">Assign Member</h3>
            <p className="text-sm text-surface-500">{positionTitle}</p>
          </div>
          <button onClick={onClose} className="btn-icon btn-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input className="input pl-9" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => onAssign(m.id)}
                disabled={saving}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {m.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900">{m.full_name}</p>
                  <p className="text-xs text-surface-500">{m.mobile}</p>
                </div>
                {saving && <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-surface-400 text-sm py-4">No members found</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

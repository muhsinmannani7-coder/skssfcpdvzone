import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/shared/Toaster'
import {
  Key, Database, Sparkles,
  CheckCircle, Loader2, Save
} from 'lucide-react'

// Standard 16 units across the 3 clusters of Chapparappadavu Zone
// 1. Padappengad Cluster: 6 Units
// 2. Kuttaparamb Cluster: 6 Units
// 3. Perumalabad Cluster: 4 Units
const STANDARD_UNITS = [
  // 1. PADAPPENGAD CLUSTER (PAD) - 6 Units
  { name: 'PADAPPENGAD UNIT', clusterCode: 'PAD' },
  { name: 'KUNNUMKAI UNIT', clusterCode: 'PAD' },
  { name: 'EDAKKAD UNIT', clusterCode: 'PAD' },
  { name: 'MANAKKADAVU UNIT', clusterCode: 'PAD' },
  { name: 'VELLAD UNIT', clusterCode: 'PAD' },
  { name: 'KARUVANCHAL UNIT', clusterCode: 'PAD' },

  // 2. KUTTAPARAMB CLUSTER (KUT) - 6 Units
  { name: 'KUTTAPARAMB UNIT', clusterCode: 'KUT' },
  { name: 'PANAPUZHA UNIT', clusterCode: 'KUT' },
  { name: 'CHETTIUKKUNNU UNIT', clusterCode: 'KUT' },
  { name: 'KOTTAYAD UNIT', clusterCode: 'KUT' },
  { name: 'ALAKODE UNIT', clusterCode: 'KUT' },
  { name: 'RAYAROME UNIT', clusterCode: 'KUT' },

  // 3. PERUMALABAD CLUSTER (PER) - 4 Units
  { name: 'PERUMALABAD UNIT', clusterCode: 'PER' },
  { name: 'CHAPPARAPPADAVU UNIT', clusterCode: 'PER' },
  { name: 'KOOVERI UNIT', clusterCode: 'PER' },
  { name: 'KANNIVAYAL UNIT', clusterCode: 'PER' },
]

export default function AdminSettings() {
  const { profile } = useAuth()
  const toast = useToast()

  // Password change states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Seed states
  const [seedingUnits, setSeedingUnits] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match')
      return
    }

    setUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error

      toast.success('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      toast.error('Error', message)
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleSeedStandardUnits = async () => {
    setSeedingUnits(true)
    try {
      // 1. Fetch clusters
      const { data: clusters, error: cErr } = await supabase.from('clusters').select('id, code')
      if (cErr) throw cErr

      const clusterMap = new Map(clusters.map(c => [c.code, c.id]))

      // 2. Insert standard units
      let added = 0
      for (let i = 0; i < STANDARD_UNITS.length; i++) {
        const item = STANDARD_UNITS[i]
        const clusterId = clusterMap.get(item.clusterCode)
        if (!clusterId) continue

        // Check if unit exists
        const { data: existing } = await supabase
          .from('units')
          .select('id')
          .eq('name', item.name)
          .eq('cluster_id', clusterId)
          .maybeSingle()

        if (!existing) {
          const { data: newUnit, error: uErr } = await supabase
            .from('units')
            .insert({
              name: item.name,
              cluster_id: clusterId,
              sort_order: i + 1,
            })
            .select()
            .single()

          if (!uErr && newUnit) {
            // Also create unit committee
            const { data: comm } = await supabase
              .from('committees')
              .insert({
                name: `${item.name} COMMITTEE`,
                level: 'unit',
                unit_id: newUnit.id,
                cluster_id: clusterId,
              })
              .select()
              .single()

            if (comm) {
              // 4 Standard positions: President, General Secretary, Working Secretary, Treasurer
              const posTitles = ['President', 'General Secretary', 'Working Secretary', 'Treasurer']
              const positions = posTitles.map((title, pIdx) => ({
                title,
                committee_id: comm.id,
                points: 1,
                sort_order: pIdx,
              }))
              await supabase.from('positions').insert(positions)
            }
            added++
          }
        }
      }

      toast.success(`Units setup complete. Added ${added} new units and committees.`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to seed units'
      toast.error('Seeding failed', message)
    } finally {
      setSeedingUnits(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl page-transition">
      <div>
        <h1 className="page-title">Settings & System Configuration</h1>
        <p className="page-subtitle">Manage administrative credentials, database preferences, and defaults</p>
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900">{profile?.full_name || 'Administrator'}</h2>
            <p className="text-xs text-surface-500">{profile?.email || 'Admin Account'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-surface-50 rounded-xl text-xs">
          <div>
            <span className="text-surface-400 block mb-0.5">Role</span>
            <span className="font-semibold text-surface-800 uppercase tracking-wide">Administrator</span>
          </div>
          <div>
            <span className="text-surface-400 block mb-0.5">Zone</span>
            <span className="font-semibold text-surface-800">Chapparappadavu Zone</span>
          </div>
          <div>
            <span className="text-surface-400 block mb-0.5">Status</span>
            <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-bold text-surface-900">Change Admin Password</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="label">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Confirm New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="btn btn-primary"
          >
            {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* System Defaults & Seeding */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-surface-900">System Setup & Fast Provisioning</h2>
        </div>
        <p className="text-xs text-surface-500 mb-4">
          Ensure all standard 16 units, committees, and standard 4 positions (President, General Secretary, Working Secretary, Treasurer) are configured for Chapparappadavu Zone.
        </p>

        <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-surface-900">Provision 16 Units & Committees</p>
            <p className="text-xs text-surface-500 mt-0.5">
              Configures Padappengad (6), Kuttaparamb (6), and Perumalabad (4) units automatically (16 units with 4 standard positions each = 64 positions).
            </p>
          </div>
          <button
            onClick={handleSeedStandardUnits}
            disabled={seedingUnits}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
          >
            {seedingUnits ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Provision 16 Units</span>
          </button>
        </div>
      </div>
    </div>
  )
}

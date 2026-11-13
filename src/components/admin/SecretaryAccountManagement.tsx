import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Unit, type SecretaryAccount } from '@/lib/supabase'
import { hashPassword } from '@/utils/crypto'
import {
  KeyRound, UserPlus, Phone, Lock, CheckCircle2,
  AlertCircle, ShieldCheck, RefreshCw, Power, Building2, Search
} from 'lucide-react'
import { clsx } from 'clsx'

export default function SecretaryAccountManagement() {
  const queryClient = useQueryClient()

  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [secretaryName, setSecretaryName] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [resetModalId, setResetModalId] = useState<string | null>(null)
  const [resetPasswordVal, setResetPasswordVal] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch 16 Units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['sec-admin-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*, cluster:clusters(*)')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data || []) as Unit[]
    },
  })

  // Fetch Secretary Accounts
  const { data: accounts = [], isLoading } = useQuery<SecretaryAccount[]>({
    queryKey: ['sec-admin-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secretary_accounts')
        .select('*, unit:units(id, name, cluster:clusters(name, code))')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Secretary accounts fetch:', error.message)
        return []
      }
      return (data || []) as unknown as SecretaryAccount[]
    },
  })

  // Create / Update Account Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnitId) throw new Error('ദയവായി ശാഖ തിരഞ്ഞെടുക്കുക')
      if (!secretaryName.trim()) throw new Error('സെക്രട്ടറിയുടെ പേര് നൽകുക')
      const cleanMobile = mobile.trim().replace(/\D/g, '')
      if (cleanMobile.length < 10) throw new Error('സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക')

      let hash = ''
      if (password.trim()) {
        hash = await hashPassword(password.trim())
      } else if (!editingId) {
        throw new Error('പാസ്‌വേഡ് നൽകുക')
      }

      const payload: any = {
        unit_id: selectedUnitId,
        name: secretaryName.trim(),
        mobile: cleanMobile,
        must_change_password: true,
        updated_at: new Date().toISOString(),
      }

      if (hash) {
        payload.password_hash = hash
      }

      if (editingId) {
        const { error } = await supabase
          .from('secretary_accounts')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        payload.is_active = true
        const { error } = await supabase
          .from('secretary_accounts')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'സെക്രട്ടറി അക്കൗണ്ട് വിജയകരമായി സേവ് ചെയ്തു!' })
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['sec-admin-accounts'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => setNotification({ type: 'error', message: err.message }),
  })

  // Toggle Active Status
  const toggleActive = async (account: SecretaryAccount) => {
    const { error } = await supabase
      .from('secretary_accounts')
      .update({ is_active: !account.is_active })
      .eq('id', account.id)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['sec-admin-accounts'] })
    }
  }

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!resetModalId || resetPasswordVal.length < 4) {
        throw new Error('കുറഞ്ഞത് 4 അക്ക പാസ്‌വേഡ് നൽകുക')
      }
      const hash = await hashPassword(resetPasswordVal.trim())
      const { error } = await supabase
        .from('secretary_accounts')
        .update({
          password_hash: hash,
          must_change_password: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resetModalId)
      if (error) throw error
    },
    onSuccess: () => {
      setNotification({ type: 'success', message: 'പാസ്‌വേഡ് റീസെറ്റ് ചെയ്തു!' })
      setResetModalId(null)
      setResetPasswordVal('')
      queryClient.invalidateQueries({ queryKey: ['sec-admin-accounts'] })
      setTimeout(() => setNotification(null), 3000)
    },
    onError: (err: any) => setNotification({ type: 'error', message: err.message }),
  })

  const resetForm = () => {
    setEditingId(null)
    setSelectedUnitId('')
    setSecretaryName('')
    setMobile('')
    setPassword('')
  }

  const handleEdit = (acc: SecretaryAccount) => {
    setEditingId(acc.id)
    setSelectedUnitId(acc.unit_id)
    setSecretaryName(acc.name)
    setMobile(acc.mobile)
    setPassword('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredAccounts = accounts.filter((a) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.mobile.includes(q) ||
      a.unit?.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-surface-900">
            ശാഖാ സെക്രട്ടറി ലോഗിൻ ക്രഡൻഷ്യലുകൾ (Secretary Accounts)
          </h1>
          <p className="text-xs text-surface-500">
            16 ശാഖാ സെക്രട്ടറിമാർക്ക് മൊബൈൽ നമ്പറും പാസ്‌വേഡും നൽകുക. അക്കൗണ്ടുകൾ റീസെറ്റ് ചെയ്യുക.
          </p>
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

      {/* Account Creation Form */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-surface-900 text-sm flex items-center gap-2 border-b border-surface-100 pb-3">
          <UserPlus className="w-4 h-4 text-indigo-600" />
          <span>{editingId ? 'സെക്രട്ടറി അക്കൗണ്ട് എഡിറ്റ് ചെയ്യുക' : 'പുതിയ ശാഖാ സെക്രട്ടറി അക്കൗണ്ട് നിർമ്മിക്കുക'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Unit Select */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              ശാഖ തിരഞ്ഞെടുക്കുക (Assign Branch) *
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- ശാഖ തിരഞ്ഞെടുക്കുക --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.cluster?.code})
                </option>
              ))}
            </select>
          </div>

          {/* Secretary Name */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              സെക്രട്ടറിയുടെ പേര് (Secretary Name) *
            </label>
            <input
              type="text"
              placeholder="പേര്..."
              value={secretaryName}
              onChange={(e) => setSecretaryName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              മൊബൈൽ നമ്പർ (Login Mobile) *
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-surface-400" />
              <input
                type="tel"
                placeholder="10 അക്ക നമ്പർ..."
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              {editingId ? 'പുതിയ പാസ്‌വേഡ് (മാറ്റമുണ്ടെങ്കിൽ മാത്രം)' : 'പാസ്‌വേഡ് (Initial Password) *'}
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-surface-400" />
              <input
                type="text"
                placeholder={editingId ? 'മാറ്റാൻ ഇവിടെ നൽകുക' : 'പാസ്‌വേഡ് നൽകുക'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-surface-400">
            ℹ️ ആദ്യ ലോഗിനിൽ സെക്രട്ടറിക്ക് സ്വന്തമായി പാസ്‌വേഡ് മാറ്റാനുള്ള ഓപ്ഷൻ നിർബന്ധമാക്കിയിട്ടുണ്ട്.
          </p>

          <div className="flex gap-2">
            {editingId && (
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
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !selectedUnitId || !mobile || !secretaryName}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{editingId ? 'Update Credentials' : 'Create Secretary Account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-surface-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>നിലവിലെ സെക്രട്ടറി അക്കൗണ്ടുകൾ ({accounts.length} / 16 ശാഖകൾ)</span>
          </h3>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-surface-400" />
            <input
              type="text"
              placeholder="തിരയുക..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-surface-400">ലോഡ് ചെയ്യുന്നു...</div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-surface-400 text-xs">
            സെക്രട്ടറി അക്കൗണ്ടുകൾ നിർമ്മിച്ചിട്ടില്ല. മുകളിലെ ഫോം ഉപയോഗിച്ച് ഓരോ ശാഖയ്ക്കും ക്രഡൻഷ്യലുകൾ നൽകുക.
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-surface-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {acc.unit?.cluster?.code}
                    </span>
                    <h4 className="font-bold text-sm text-surface-900">{acc.unit?.name || 'Unit'}</h4>
                    {!acc.is_active && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500 mt-1">
                    <span><strong>സെക്രട്ടറി:</strong> {acc.name}</span>
                    <span><strong>മൊബൈൽ:</strong> {acc.mobile}</span>
                    {acc.last_login && (
                      <span className="text-surface-400">
                        അവസാനം ലോഗിൻ: {new Date(acc.last_login).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Reset Password Button */}
                  <button
                    onClick={() => {
                      setResetModalId(acc.id)
                      setResetPasswordVal('')
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-surface-200 text-xs font-semibold text-surface-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center gap-1"
                    title="Reset Password"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Pass</span>
                  </button>

                  {/* Edit Info */}
                  <button
                    onClick={() => handleEdit(acc)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-indigo-700 hover:bg-indigo-50 transition"
                    title="Edit"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  {/* Deactivate / Activate */}
                  <button
                    onClick={() => toggleActive(acc)}
                    className={clsx(
                      'p-1.5 rounded-lg transition',
                      acc.is_active ? 'text-surface-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-600 bg-emerald-50'
                    )}
                    title={acc.is_active ? 'Deactivate Account' : 'Activate Account'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {resetModalId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-surface-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <span>പാസ്‌വേഡ് റീസെറ്റ് ചെയ്യുക</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1">
                പുതിയ പാസ്‌വേഡ് നൽകുക
              </label>
              <input
                type="text"
                placeholder="പുതിയ പാസ്‌വേഡ്..."
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalId(null)}
                className="px-3 py-1.5 rounded-xl border border-surface-200 text-xs font-semibold text-surface-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resetPasswordMutation.mutate()}
                disabled={resetPasswordMutation.isPending || resetPasswordVal.length < 4}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KeyRound, ShieldAlert, CheckCircle2, Lock } from 'lucide-react'

export default function ForceChangePasswordModal() {
  const { isAdmin, isSecretary, updateAdminPassword, updateSecretaryPassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 4) {
      setError('പാസ്‌വേഡ് കുറഞ്ഞത് 4 അക്കങ്ങൾ/അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('പാസ്‌വേഡുകൾ തമ്മിൽ പൊരുത്തപ്പെടുന്നില്ല (Passwords do not match).')
      return
    }

    if (newPassword === '0606') {
      setError('പ്രാരംഭ പാസ്‌വേഡ് (0606) മാറ്റുക, പുതിയ പാസ്‌വേഡ് നൽകുക.')
      return
    }

    setLoading(true)
    try {
      if (isAdmin) {
        const res = await updateAdminPassword(newPassword)
        if (!res.success) setError(res.error || 'Failed to update')
      } else if (isSecretary) {
        const res = await updateSecretaryPassword(newPassword)
        if (!res.success) setError(res.error || 'Failed to update')
      }
    } catch (err: any) {
      setError(err.message || 'Error updating password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up border border-emerald-100">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-surface-900 tracking-tight">
            പുതിയ പാസ്‌വേഡ് നൽകുക
          </h2>
          <p className="text-xs text-surface-500 leading-relaxed">
            സുരക്ഷ മുൻനിർത്തി ആദ്യ ലോഗിനിൽ താത്കാലിക പാസ്‌വേഡ് മാറ്റി പുതിയ സുരക്ഷിതമായ പാസ്‌വേഡ് നിർബന്ധമായും നൽകേണ്ടതുണ്ട്.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              പുതിയ പാസ്‌വേഡ് (New Password / PIN)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-surface-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="പുതിയ പാസ്‌വേഡ് നൽകുക"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക (Confirm Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-surface-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="വീണ്ടും നൽകുക"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>പാസ്‌വേഡ് അപ്‌ഡേറ്റ് ചെയ്യുക (Save Password)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

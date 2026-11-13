import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Shield, KeyRound, LogOut, ExternalLink,
  Building2, Phone, ChevronRight
} from 'lucide-react'

export default function AppProfileScreen() {
  const { profile, secretaryAccount, isAdmin, isSecretary, signOut, updateAdminPassword, updateSecretaryPassword } = useAuth()
  const navigate = useNavigate()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const userName = secretaryAccount?.name || profile?.full_name || 'User'
  const userMobile = secretaryAccount?.mobile || '7559950633'
  const branchName = secretaryAccount?.unit?.name || 'ചപ്പാരപ്പടവ് മേഖലാ കമ്മിറ്റി'

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)

    if (newPassword.length < 4) {
      setMsg({ type: 'error', text: 'പാസ്‌വേഡ് കുറഞ്ഞത് 4 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'പാസ്‌വേഡുകൾ തമ്മിൽ പൊരുത്തപ്പെടുന്നില്ല.' })
      return
    }

    setSaving(true)
    try {
      if (isAdmin) {
        const res = await updateAdminPassword(newPassword)
        if (res.success) {
          setMsg({ type: 'success', text: 'പാസ്‌വേഡ് വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു!' })
          setTimeout(() => setShowPasswordModal(false), 2000)
        } else {
          setMsg({ type: 'error', text: res.error || 'Failed' })
        }
      } else if (isSecretary) {
        const res = await updateSecretaryPassword(newPassword)
        if (res.success) {
          setMsg({ type: 'success', text: 'പാസ്‌വേഡ് വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു!' })
          setTimeout(() => setShowPasswordModal(false), 2000)
        } else {
          setMsg({ type: 'error', text: res.error || 'Failed' })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-4">
      {/* ── User Profile Card ── */}
      <div className="bg-white rounded-3xl p-5 border border-surface-200 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white text-2xl font-black shadow-md flex-shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
            {isAdmin ? 'Super Administrator' : 'Branch Secretary'}
          </span>
          <h2 className="text-base font-black text-surface-900 truncate mt-1">{userName}</h2>
          <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-surface-400" />
            <span className="truncate">{branchName}</span>
          </p>
          <p className="text-[11px] text-surface-400 mt-0.5">📱 {userMobile}</p>
        </div>
      </div>

      {/* ── Admin Management Portal Shortcut ── */}
      {isAdmin && (
        <Link
          to="/admin"
          className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-3xl p-4 shadow-sm flex items-center justify-between hover:from-emerald-600 hover:to-teal-700 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Full Admin Console (ഡെസ്‌ക്ടോപ്പ് പാനൽ)</h4>
              <p className="text-[10px] text-emerald-100">സെക്രട്ടറി അക്കൗണ്ടുകൾ, സ്കോർബോർഡ്, റിപ്പോർട്ടുകൾ</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-200" />
        </Link>
      )}

      {/* ── Account Options ── */}
      <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-xs divide-y divide-surface-100">
        {/* Change Password */}
        <button
          onClick={() => {
            setShowPasswordModal(true)
            setNewPassword('')
            setConfirmPassword('')
            setMsg(null)
          }}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-100 text-surface-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-surface-900 block">പാസ്‌വേഡ് മാറ്റുക</span>
              <span className="text-[10px] text-surface-400">Change Password / PIN</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-400" />
        </button>

        {/* Public Website */}
        <Link
          to="/"
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-100 text-surface-700 flex items-center justify-center">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-surface-900 block">പബ്ലിക് പോർട്ടൽ സന്ദർശിക്കുക</span>
              <span className="text-[10px] text-surface-400">Public Landing Page</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-400" />
        </Link>

        {/* Live Attendance */}
        <Link
          to="/attend"
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-100 text-surface-700 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-surface-900 block">ലൈവ് ഹാജർ ലിങ്ക്</span>
              <span className="text-[10px] text-surface-400">Meeting Attendance Kiosk</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-400" />
        </Link>
      </div>

      {/* ── Sign Out ── */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-3xl font-bold text-xs flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>ലോഗ് ഔട്ട് ചെയ്യുക (Sign Out)</span>
      </button>

      {/* ── Password Change Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-100 pb-2">
              <h3 className="font-black text-sm text-surface-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>പാസ്‌വേഡ് മാറ്റുക</span>
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-xs font-bold text-surface-400 hover:text-surface-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-surface-700 mb-1">
                  പുതിയ പാസ്‌വേഡ് *
                </label>
                <input
                  type="password"
                  required
                  placeholder="കുറഞ്ഞത് 4 അക്കങ്ങൾ..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-surface-700 mb-1">
                  പാസ്‌വേഡ് വീണ്ടും നൽകുക *
                </label>
                <input
                  type="password"
                  required
                  placeholder="സ്ഥിരീകരിക്കുക..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white"
                />
              </div>

              {msg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold ${
                    msg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {msg.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-surface-600 hover:bg-surface-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

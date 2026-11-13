import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Shield, Phone, Lock, Eye, EyeOff, ArrowRight,
  AlertCircle
} from 'lucide-react'

export default function MobileAppLogin() {
  const { signInWithMobile } = useAuth()
  const navigate = useNavigate()

  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanMobile = mobile.replace(/\D/g, '')
    if (cleanMobile.length < 10) {
      setError('ദയവായി സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.')
      return
    }

    if (!password.trim()) {
      setError('ദയവായി പാസ്‌വേഡ് നൽകുക.')
      return
    }

    setLoading(true)
    try {
      const res = await signInWithMobile(cleanMobile, password.trim())
      if (res.error) {
        setError(res.error)
      } else {
        if (res.role === 'admin') {
          navigate('/app')
        } else if (res.role === 'secretary') {
          navigate('/app')
        } else if (res.role === 'operator') {
          navigate('/operator')
        } else {
          navigate('/app')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Quick fill helper for Super Admin
  const fillAdmin = () => {
    setMobile('7559950633')
    setPassword('0606')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-teal-900 to-emerald-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* ── Top Brand Header ── */}
      <div className="max-w-md w-full mx-auto pt-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-glow">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">SKSSF ZONE</h1>
          <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest mt-0.5">
            ചപ്പാരപ്പടവ് മേഖലാ കമ്മിറ്റി
          </p>
          <p className="text-[11px] text-emerald-300/70 mt-1">
            Mobile Management System (Admin & Secretary Portal)
          </p>
        </div>
      </div>

      {/* ── Center Login Card (WhatsApp / Modern App Style) ── */}
      <div className="max-w-md w-full mx-auto my-6 bg-white rounded-3xl p-6 sm:p-8 text-surface-900 shadow-2xl space-y-5 border border-emerald-100">
        <div className="border-b border-surface-100 pb-3">
          <h2 className="text-lg font-black text-surface-900 tracking-tight">ലോഗിൻ ചെയ്യുക</h2>
          <p className="text-xs text-surface-500 mt-0.5">
            സൂപ്പർ അഡ്മിൻ അല്ലെങ്കിൽ ശാഖാ സെക്രട്ടറി ക്രഡൻഷ്യലുകൾ നൽകുക.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ (Mobile Number)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-surface-400" />
              <input
                type="tel"
                required
                placeholder="7559950633..."
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1">
              പാസ്‌വേഡ് (Password / PIN)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-surface-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="പാസ്‌വേഡ് നൽകുക..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-surface-400 hover:text-surface-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>പ്രവേശിക്കുക (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Admin Demo Hint */}
        <div className="pt-2 border-t border-surface-100 flex items-center justify-between text-[11px] text-surface-500">
          <span>സൂപ്പർ അഡ്മിൻ ലോഗിൻ:</span>
          <button
            type="button"
            onClick={fillAdmin}
            className="text-emerald-700 font-bold hover:underline bg-emerald-50 px-2 py-0.5 rounded-md"
          >
            Fill Admin (7559950633)
          </button>
        </div>
      </div>

      {/* ── Bottom Public Navigation ── */}
      <div className="max-w-md w-full mx-auto text-center space-y-2 pb-4 text-xs">
        <Link to="/" className="text-emerald-200 hover:text-white font-medium underline">
          ← പബ്ലിക് വെബ്‌സൈറ്റിലേക്ക് മടങ്ങുക
        </Link>
        <p className="text-[10px] text-emerald-400/60">
          © {new Date().getFullYear()} SKSSF Chapparappadavu Zone Management System
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Lock, Phone, Eye, EyeOff, ClipboardList, ArrowRight, Shield } from 'lucide-react'

export default function OperatorLogin() {
  const { signInWithMobile } = useAuth()
  const navigate = useNavigate()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobile || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await signInWithMobile(mobile, password)
    if (err) {
      setError(err)
    } else {
      navigate('/operator')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-primary-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600/20 backdrop-blur border border-primary-500/30 mb-4">
            <ClipboardList className="w-10 h-10 text-primary-300" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SKSSF</h1>
          <p className="text-primary-200 text-sm mt-1 font-medium">CHAPPARAPPADAVU ZONE</p>
          <p className="text-surface-400 text-xs mt-0.5">Attendance Operator Portal</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Operator Login</h2>
            <p className="text-surface-400 text-sm mt-1">Enter your registered mobile number and password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="Enter your mobile number"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-500 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>LOGIN <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/admin/login" className="inline-flex items-center gap-2 text-surface-400 hover:text-white text-sm transition-colors">
            <Shield className="w-4 h-4" />
            Administrator Login
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Lock, Phone, Eye, EyeOff, Shield, ArrowRight, Users, User, CheckCircle } from 'lucide-react'

// Convert mobile number to internal email format (Supabase Auth requires a standard public domain)
function mobileToEmail(mobile: string): string {
  const trimmed = mobile.trim()
  if (trimmed.includes('@')) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  return `${digits}@gmail.com`
}

// Pad short passwords to meet Supabase's 6-char minimum
function padPassword(password: string): string {
  return password.length < 6 ? password.padEnd(6, '0') : password
}

export default function AdminLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const email = mobileToEmail(mobile)
    const actualPassword = padPassword(password)

    if (mode === 'signin') {
      if (!mobile || !password) {
        setError('Mobile number and password required.')
        return
      }
      setLoading(true)
      const { error: err } = await signIn(email, actualPassword)
      if (err) {
        setError('Invalid mobile number or password.')
      } else {
        navigate('/admin')
      }
      setLoading(false)
    } else {
      // Register Mode
      if (!fullName.trim() || !mobile.trim() || !password.trim()) {
        setError('Please fill in all fields.')
        return
      }
      if (mobile.trim().length < 10) {
        setError('Please enter a valid 10-digit mobile number.')
        return
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters.')
        return
      }

      setLoading(true)
      try {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password: actualPassword,
          options: {
            data: {
              full_name: fullName.trim(),
              role: 'admin',
            },
          },
        })

        if (signUpErr) throw signUpErr

        // Ensure profiles table has admin role
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            role: 'admin',
            is_active: true,
          })
        }

        setSuccess('Admin account created! Signing you in...')
        const { error: loginErr } = await signIn(email.trim(), actualPassword)
        if (!loginErr) {
          navigate('/admin')
        } else {
          setMode('signin')
          setSuccess('Account created! Please sign in with your credentials.')
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Registration failed')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-4 shadow-glow">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">SKSSF</h1>
          <p className="text-primary-200 text-sm mt-1 font-semibold tracking-wide">CHAPPARAPPADAVU ZONE</p>
          <p className="text-primary-300 text-xs mt-0.5">Attendance Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'signin' ? 'Admin Login' : 'Register Admin'}
              </h2>
              <p className="text-primary-200 text-xs mt-0.5">
                {mode === 'signin' ? 'Sign in with your mobile number' : 'Set up initial administrative account'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'register' : 'signin')
                setError('')
                setSuccess('')
              }}
              className="text-xs text-primary-200 hover:text-white underline font-medium"
            >
              {mode === 'signin' ? 'First-time setup?' : 'Back to Login'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary-200 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. MUHSIN MANNANI"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-primary-200 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" />
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 7559950633"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-primary-200 mb-1.5">
                Password / PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min. 4 characters' : 'Enter your password / PIN'}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 animate-fade-in font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-3 text-xs text-green-200 animate-fade-in font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-primary-900 rounded-xl font-bold text-sm hover:bg-primary-50 transition-all disabled:opacity-50 mt-2 shadow-lg"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In as Admin' : 'Complete Admin Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Operator login link */}
        <div className="text-center mt-6">
          <Link
            to="/operator/login"
            className="inline-flex items-center gap-2 text-primary-200 hover:text-white text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            Attendance Operator Terminal Login
          </Link>
        </div>
      </div>
    </div>
  )
}

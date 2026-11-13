import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type Profile, type SecretaryAccount } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { hashPassword, verifyPassword } from '@/utils/crypto'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  secretaryAccount: SecretaryAccount | null
  loading: boolean
  isAdmin: boolean
  isSecretary: boolean
  isOperator: boolean
  mustChangePassword: boolean
  setMustChangePassword: (val: boolean) => void
  updateAdminPassword: (newPass: string) => Promise<{ success: boolean; error?: string }>
  updateSecretaryPassword: (newPass: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMobile: (mobile: string, password: string) => Promise<{ error: string | null; role?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [secretaryAccount, setSecretaryAccount] = useState<SecretaryAccount | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data)
    }
    return data
  }

  useEffect(() => {
    // 1. Check if secretary was stored locally
    const storedSec = localStorage.getItem('skssf_sec_session')
    if (storedSec) {
      try {
        const parsed = JSON.parse(storedSec)
        setSecretaryAccount(parsed)
        if (parsed.must_change_password) {
          setMustChangePassword(true)
        }
      } catch (e) {
        console.warn('Error reading secretary session:', e)
      }
    }

    // 1b. Check if super admin was stored locally
    const storedAdmin = localStorage.getItem('skssf_admin_session')
    if (storedAdmin) {
      try {
        const parsed = JSON.parse(storedAdmin)
        setProfile({
          id: 'super-admin-0633',
          email: '7559950633@gmail.com',
          full_name: 'Super Administrator',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        if (parsed.must_change_password) {
          setMustChangePassword(true)
        }
      } catch (e) {
        console.warn('Error reading admin session:', e)
      }
    }

    // 2. Supabase auth session
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const sess = data.session
      setSession(sess)
      setUser(sess?.user ?? null)
      if (sess?.user) {
        fetchProfile(sess.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, sess: Session | null) => {
        setSession(sess)
        setUser(sess?.user ?? null)
        if (sess?.user) {
          await fetchProfile(sess.user.id)
        } else if (!localStorage.getItem('skssf_admin_session')) {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Standard email sign in
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  // Unified Mobile Sign In (Super Admin, Branch Secretary, Operator)
  const signInWithMobile = async (mobile: string, password: string) => {
    const cleanMobile = mobile.trim().replace(/\D/g, '')

    // A. Check Super Admin (Mobile: 7559950633)
    if (cleanMobile === '7559950633') {
      const savedAdminHash = localStorage.getItem('skssf_superadmin_hash')
      let isValid = false
      let isInitial = false

      if (savedAdminHash) {
        isValid = await verifyPassword(password, savedAdminHash)
      } else {
        // Initial password is 0606
        if (password === '0606') {
          isValid = true
          isInitial = true
        }
      }

      if (isValid) {
        const adminProfile: Profile = {
          id: 'super-admin-0633',
          email: '7559950633@gmail.com',
          full_name: 'Super Administrator',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfile(adminProfile)
        setSecretaryAccount(null)
        setMustChangePassword(isInitial)
        localStorage.setItem(
          'skssf_admin_session',
          JSON.stringify({ mobile: cleanMobile, must_change_password: isInitial })
        )
        return { error: null, role: 'admin' }
      } else {
        return { error: 'Invalid admin password. Please try again.' }
      }
    }

    // B. Check Secretary Accounts
    const { data: sec, error: secError } = await supabase
      .from('secretary_accounts')
      .select('*, unit:units(id, name, cluster:clusters(name, code))')
      .eq('mobile', cleanMobile)
      .eq('is_active', true)
      .single()

    if (!secError && sec) {
      // Verify password
      const matches = await verifyPassword(password, sec.password_hash)
      // Allow initial plain fallback if newly created before hash
      const matchesPlain = password === sec.password_hash

      if (matches || matchesPlain) {
        setSecretaryAccount(sec as unknown as SecretaryAccount)
        setProfile(null)
        const mustChange = sec.must_change_password ?? false
        setMustChangePassword(mustChange)
        localStorage.setItem('skssf_sec_session', JSON.stringify(sec))

        // Update last login
        supabase
          .from('secretary_accounts')
          .update({ last_login: new Date().toISOString() })
          .eq('id', sec.id)
          .then()

        return { error: null, role: 'secretary' }
      } else {
        return { error: 'Incorrect password for branch secretary.' }
      }
    }

    // C. Check Operators via Supabase Auth
    const { data: operator, error: opError } = await supabase
      .from('attendance_operators')
      .select('profile_id, profiles(email)')
      .eq('mobile', cleanMobile)
      .eq('is_active', true)
      .single()

    if (!opError && operator) {
      const email = (operator.profiles as unknown as { email: string } | null)?.email
      if (email) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: 'Invalid password for operator.' }
        return { error: null, role: 'operator' }
      }
    }

    // Fallback: Check if Supabase auth user exists with mobile@gmail.com
    const emailCandidate = `${cleanMobile}@gmail.com`
    const { error: fbErr } = await supabase.auth.signInWithPassword({
      email: emailCandidate,
      password: password.length < 6 ? password.padEnd(6, '0') : password,
    })
    if (!fbErr) {
      return { error: null, role: 'admin' }
    }

    return { error: 'Mobile number not recognized. Contact Zone Super Administrator.' }
  }

  // Update Super Admin Password
  const updateAdminPassword = async (newPass: string) => {
    if (newPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' }
    }
    const hash = await hashPassword(newPass)
    localStorage.setItem('skssf_superadmin_hash', hash)
    setMustChangePassword(false)
    localStorage.setItem(
      'skssf_admin_session',
      JSON.stringify({ mobile: '7559950633', must_change_password: false })
    )
    return { success: true }
  }

  // Update Branch Secretary Password
  const updateSecretaryPassword = async (newPass: string) => {
    if (!secretaryAccount) return { success: false, error: 'No secretary logged in' }
    if (newPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' }
    }
    const hash = await hashPassword(newPass)
    const { error } = await supabase
      .from('secretary_accounts')
      .update({
        password_hash: hash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', secretaryAccount.id)

    if (error) return { success: false, error: error.message }

    const updated = { ...secretaryAccount, must_change_password: false, password_hash: hash }
    setSecretaryAccount(updated)
    setMustChangePassword(false)
    localStorage.setItem('skssf_sec_session', JSON.stringify(updated))
    return { success: true }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('skssf_sec_session')
    localStorage.removeItem('skssf_admin_session')
    setProfile(null)
    setSecretaryAccount(null)
    setMustChangePassword(false)
    setSession(null)
    setUser(null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      secretaryAccount,
      loading,
      isAdmin: profile?.role === 'admin' && profile?.is_active === true,
      isSecretary: !!secretaryAccount && secretaryAccount.is_active === true,
      isOperator: profile?.role === 'operator' && profile?.is_active === true,
      mustChangePassword,
      setMustChangePassword,
      updateAdminPassword,
      updateSecretaryPassword,
      signIn,
      signInWithMobile,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

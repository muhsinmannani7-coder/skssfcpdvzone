import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type Profile } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isOperator: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMobile: (mobile: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
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
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const session = data.session
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  // Operators log in with mobile number — we map mobile to email format
  const signInWithMobile = async (mobile: string, password: string) => {
    // Find operator by mobile number to get their associated email
    const { data: operator, error: opError } = await supabase
      .from('attendance_operators')
      .select('profile_id, profiles(email)')
      .eq('mobile', mobile)
      .eq('is_active', true)
      .single()

    if (opError || !operator) {
      return { error: 'Mobile number not found or account is inactive.' }
    }

    const email = (operator.profiles as unknown as { email: string } | null)?.email
    if (!email) {
      return { error: 'Operator account is not properly configured. Contact admin.' }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'Invalid password. Please try again.' }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
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
      loading,
      isAdmin: profile?.role === 'admin' && profile?.is_active === true,
      isOperator: profile?.role === 'operator' && profile?.is_active === true,
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

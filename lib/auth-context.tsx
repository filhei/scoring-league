'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from '../supabase/database.types'

type Player = Database['public']['Tables']['players']['Row']

interface AuthContextType {
  user: User | null
  player: Player | null
  session: Session | null
  loading: boolean
  signIn: (email: string) => Promise<{ error: string | null }>
  signInWithCode: (email: string, code: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshPlayer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch player data for authenticated user
  const fetchPlayer = async (userEmail: string) => {
    try {
      console.log('Fetching player data for:', userEmail)
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching player:', error)
        setPlayer(null)
        return
      }

      console.log('Player data fetched:', data)
      setPlayer(data)
    } catch (error) {
      console.error('Error fetching player:', error)
      setPlayer(null)
    }
  }

  // Refresh player data
  const refreshPlayer = async () => {
    if (user?.email) {
      await fetchPlayer(user.email)
    }
  }

  // Sign in with magic link
  const signIn = async (email: string): Promise<{ error: string | null }> => {
    try {
      console.log('Attempting sign in for:', email)
      // First check if the email exists in the players table
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, email, is_active')
        .eq('email', email)
        .single()

      if (playerError || !playerData) {
        console.log('Player not found or error:', playerError)
        return { 
          error: 'This email is not registered. Please contact the admin to set up your account.' 
        }
      }

      if (!playerData.is_active) {
        console.log('Player account deactivated')
        return { 
          error: 'Your account has been deactivated. Please contact the admin.' 
        }
      }

      console.log('Player found, sending magic link')
      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error: error.message }
      }

      console.log('Magic link sent successfully')
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }

  // Sign in with one-time code
  const signInWithCode = async (email: string, code: string): Promise<{ error: string | null }> => {
    try {
      console.log('Attempting sign in with code for:', email)
      
      // First check if the email exists in the players table
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, email, is_active')
        .eq('email', email)
        .single()

      if (playerError || !playerData) {
        console.log('Player not found or error:', playerError)
        return { 
          error: 'This email is not registered. Please contact the admin to set up your account.' 
        }
      }

      if (!playerData.is_active) {
        console.log('Player account deactivated')
        return { 
          error: 'Your account has been deactivated. Please contact the admin.' 
        }
      }

      console.log('Player found, verifying code')
      // Verify the one-time code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      })

      if (error) {
        console.error('Code verification error:', error)
        return { error: error.message }
      }

      if (data.session) {
        console.log('Code verification successful, session established')
        return { error: null }
      } else {
        console.error('No session returned from code verification')
        return { error: 'Invalid or expired code. Please try again.' }
      }
    } catch (error) {
      console.error('Sign in with code error:', error)
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      console.log('Signing out user')
      await supabase.auth.signOut()
      setUser(null)
      setPlayer(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('Initializing auth state')
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }
        
        console.log('Initial session:', session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Fetch player data when user signs in
        if (session?.user?.email) {
          await fetchPlayer(session.user.email)
        } else {
          setPlayer(null)
        }
      } catch (error) {
        console.error('Error initializing auth state:', error)
        setSession(null)
        setUser(null)
        setPlayer(null)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      console.log('Session data:', session ? {
        user: session.user?.email,
        expires_at: session.expires_at,
        access_token: session.access_token ? 'present' : 'missing'
      } : 'null')
      
      try {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Fetch player data when user signs in
        if (session?.user?.email) {
          await fetchPlayer(session.user.email)
        } else {
          setPlayer(null)
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
        setSession(null)
        setUser(null)
        setPlayer(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    player,
    session,
    loading,
    signIn,
    signInWithCode,
    signOut,
    refreshPlayer
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

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
  const fetchPlayer = async (userId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching player data for user ID:', userId)
      }
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching player:', error)
        }
        setPlayer(null)
        return
      }

      // Check if player data is nullified (GDPR compliance)
      if (!data.name || !data.user_id) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Player data is nullified (account deleted)')
        }
        setPlayer(null)
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Player data fetched:', data)
      }
      setPlayer(data)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching player:', error)
      }
      setPlayer(null)
    }
  }

  // Refresh player data
  const refreshPlayer = async () => {
    if (user?.id) {
      await fetchPlayer(user.id)
    }
  }

  // Sign in with magic link
  const signIn = async (email: string): Promise<{ error: string | null }> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting sign in for:', email)
      }
      
      // Send magic link directly - let Supabase handle user validation
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false
        }
      })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Sign in error:', error)
        }
        // Check if it's a "user not found" error
        if (error.message.includes('User not found') || error.message.includes('Invalid login credentials')) {
          return { 
            error: 'This email is not registered. Please contact the admin to set up your account.' 
          }
        }
        // Check if it's a "signups not allowed" error (user doesn't exist)
        if (error.message.includes('Signups not allowed for otp')) {
          return { 
            error: 'This email is not registered. Please contact the admin to set up your account.' 
          }
        }
        return { error: error.message }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Magic link sent successfully')
      }
      return { error: null }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign in error:', error)
      }
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }

  // Sign in with one-time code
  const signInWithCode = async (email: string, code: string): Promise<{ error: string | null }> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting sign in with code for:', email)
      }
      
      // Verify the one-time code first
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Code verification error:', error)
        }
        // Check if it's a "user not found" error
        if (error.message.includes('User not found') || error.message.includes('Invalid login credentials')) {
          return { 
            error: 'This email is not registered. Please contact the admin to set up your account.' 
          }
        }
        // Check if it's a "signups not allowed" error (user doesn't exist)
        if (error.message.includes('Signups not allowed for otp')) {
          return { 
            error: 'This email is not registered. Please contact the admin to set up your account.' 
          }
        }
        return { error: error.message }
      }

      if (data.session) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Code verification successful, session established')
        }
        
        // Now check if the authenticated user has a valid player account
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('id, name, is_active, user_id')
          .eq('user_id', data.session.user.id)
          .single()

        if (playerError || !playerData) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Player not found or error:', playerError)
          }
          // Sign out the user since they don't have a valid player account
          await supabase.auth.signOut()
          return { 
            error: 'This email is not registered. Please contact the admin to set up your account.' 
          }
        }

        // Check if player account is active (not nullified)
        if (!playerData.is_active || !playerData.name || !playerData.user_id) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Player account deactivated or nullified')
          }
          // Sign out the user since their account is deactivated
          await supabase.auth.signOut()
          return { 
            error: 'Your account has been deactivated. Please contact the admin.' 
          }
        }

        return { error: null }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('No session returned from code verification')
        }
        return { error: 'Invalid or expired code. Please try again.' }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign in with code error:', error)
      }
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Signing out user')
      }
      await supabase.auth.signOut()
      setUser(null)
      setPlayer(null)
      setSession(null)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', error)
      }
    }
  }

  // Initialize auth state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing auth state')
    }
    
    const initializeAuth = async () => {
      try {
        setLoading(true)
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error getting initial session:', error)
          }
          setSession(null)
          setUser(null)
          setPlayer(null)
          setLoading(false)
          return
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Initial session:', session)
        }
        setSession(session)
        setUser(session?.user ?? null)

        // Fetch player data when user signs in
        if (session?.user?.id) {
          await fetchPlayer(session.user.id)
        } else {
          setPlayer(null)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error initializing auth state:', error)
        }
        setSession(null)
        setUser(null)
        setPlayer(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state change:', event, session?.user?.email)
      }
      
      try {
        setLoading(true)
        setSession(session)
        setUser(session?.user ?? null)

        // Fetch player data when user signs in
        if (session?.user?.id) {
          await fetchPlayer(session.user.id)
        } else {
          setPlayer(null)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error handling auth state change:', error)
        }
        setSession(null)
        setUser(null)
        setPlayer(null)
      } finally {
        setLoading(false)
      }
    })

    // Handle tab focus to refresh auth state
    const handleFocus = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Tab focused, refreshing auth state')
      }
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!error && session?.user?.id && session.user.id !== user?.id) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Session changed on focus, updating state')
          }
          setSession(session)
          setUser(session.user)
          await fetchPlayer(session.user.id)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error refreshing auth state on focus:', error)
        }
      }
    }

    // Handle page visibility changes (more reliable than focus for tab switching)
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Page became visible, refreshing auth state')
        }
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (!error && session?.user?.id && session.user.id !== user?.id) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Session changed on visibility change, updating state')
            }
            setSession(session)
            setUser(session.user)
            await fetchPlayer(session.user.id)
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error refreshing auth state on visibility change:', error)
          }
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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

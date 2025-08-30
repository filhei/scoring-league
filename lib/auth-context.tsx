'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  
  // Use refs to track state and prevent unnecessary updates
  const userRef = useRef<User | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const isInitializedRef = useRef(false)
  const lastAuthChangeRef = useRef<number>(0)
  const isTabVisibleRef = useRef(true)

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
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
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
      userRef.current = null
      sessionRef.current = null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', error)
      }
    }
  }

  // Debounced auth state update
  const debouncedAuthUpdate = (newSession: Session | null, newUser: User | null) => {
    // Don't process auth updates if tab is not visible (prevents unnecessary operations)
    if (!isTabVisibleRef.current && isInitializedRef.current) {
      return
    }

    const now = Date.now()
    const timeSinceLastChange = now - lastAuthChangeRef.current
    
    // Reduce debouncing timeout for better magic link detection
    if (timeSinceLastChange < 500 && isInitializedRef.current) {
      return
    }
    
    lastAuthChangeRef.current = now
    
    // Only update if the user/session actually changed
    const userChanged = userRef.current?.id !== newUser?.id
    const sessionChanged = sessionRef.current?.access_token !== newSession?.access_token
    
    if (userChanged || sessionChanged || (!userRef.current && newUser)) {
      setSession(newSession)
      setUser(newUser)
      userRef.current = newUser
      sessionRef.current = newSession

      // Fetch player data when user signs in
      if (newUser?.id) {
        fetchPlayer(newUser.id)
      } else {
        setPlayer(null)
      }
    }
  }

  // Initialize auth state - simplified to remove unnecessary checks
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        
        // Force session refresh to detect magic link authentication
        await supabase.auth.refreshSession()
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          debouncedAuthUpdate(null, null)
          setLoading(false)
          return
        }
        
        debouncedAuthUpdate(session, session?.user ?? null)
        isInitializedRef.current = true
      } catch (error) {
        console.error('Error initializing auth state:', error)
        debouncedAuthUpdate(null, null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes - with debouncing
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setLoading(true)
        debouncedAuthUpdate(session, session?.user ?? null)
      } catch (error) {
        console.error('Error handling auth state change:', error)
        debouncedAuthUpdate(null, null)
      } finally {
        setLoading(false)
      }
    })

    // Periodic session check to catch magic link authentication
    const sessionCheckInterval = setInterval(async () => {
      if (!isInitializedRef.current) return
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!error && session && !userRef.current) {
          debouncedAuthUpdate(session, session.user)
        }
      } catch (error) {
        console.error('Error in periodic session check:', error)
      }
    }, 2000) // Check every 2 seconds

    // Additional session check on page focus to catch magic link auth
    const handlePageFocus = async () => {
      if (!isInitializedRef.current) return
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!error && session && !userRef.current) {
          debouncedAuthUpdate(session, session.user)
        }
      } catch (error) {
        console.error('Error in page focus session check:', error)
      }
    }

    // Track tab visibility to prevent unnecessary operations
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden
      
      // Check for session changes when tab becomes visible
      if (!document.hidden) {
        handlePageFocus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handlePageFocus)

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionCheckInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handlePageFocus)
    }
  }, []) // Removed user?.id dependency to prevent cascading updates

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

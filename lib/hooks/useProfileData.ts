'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth-context'
import { supabase } from '../supabase'

interface PositionPreference {
  position: 'Målvakt' | 'Back' | 'Center' | 'Forward'
  preference: 'primary' | 'secondary' | null
}

interface ProfileData {
  name: string
  positions: PositionPreference[]
}

export function useProfileData() {
  const { user, player, loading: authLoading } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('useProfileData: user:', user?.email, 'player:', player?.id, 'authLoading:', authLoading)

  const fetchProfileData = useCallback(async () => {
    console.log('fetchProfileData called with user:', user?.email)
    if (!user?.id) {
      console.log('No user ID available')
      setLoading(false)
      setProfileData(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch player data
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (playerError) throw playerError

      console.log('Player data fetched:', playerData)
      
      // Get player ID from the player data we just fetched
      const playerId = playerData.id
      console.log('Player ID:', playerId)

      // Fetch position preferences
      console.log('Fetching position preferences for player ID:', playerId)
      const { data: positionsData, error: positionsError } = await supabase
        .from('player_positions')
        .select('position, preference')
        .eq('player_id', playerId)

      if (positionsError) throw positionsError
      console.log('Position preferences fetched:', positionsData)

      // Create position preferences array with all positions
      const allPositions: ('Målvakt' | 'Back' | 'Center' | 'Forward')[] = ['Målvakt', 'Back', 'Center', 'Forward']
      const positions: PositionPreference[] = allPositions.map(position => {
        const existingPreference = positionsData?.find(p => p.position === position)
        return {
          position,
          preference: (existingPreference?.preference as 'primary' | 'secondary') || null
        }
      })

      const newProfileData = {
        name: playerData.name,
        positions
      }
      console.log('Setting profile data:', newProfileData)
      setProfileData(newProfileData)
    } catch (err) {
      console.error('Error fetching profile data:', err)
      if (err instanceof Error) {
        setError(`Failed to fetch profile data: ${err.message}`)
      } else {
        setError('Failed to fetch profile data')
      }
      setProfileData(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      return
    }
    
    // If no user, clear data and stop loading
    if (!user?.id) {
      setProfileData(null)
      setLoading(false)
      setError(null)
      return
    }
    
    fetchProfileData()
  }, [user?.id, authLoading, fetchProfileData])

  return {
    profileData,
    loading: loading || authLoading,
    error,
    refetch: fetchProfileData
  }
}

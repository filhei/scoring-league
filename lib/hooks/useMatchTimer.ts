import { useState, useEffect, useCallback } from 'react'
import { MatchService } from '../match-service'
import type { Database } from '../../supabase/database.types'

type Match = Database['public']['Tables']['matches']['Row']

export interface UseMatchTimerReturn {
  currentDuration: number
  formattedTime: string
  minutes: number
  seconds: number
  isPaused: boolean
  isActive: boolean
  startMatch: () => Promise<void>
  pauseMatch: () => Promise<void>
  resumeMatch: () => Promise<void>
  endMatch: (winnerTeam?: 'A' | 'B' | null) => Promise<void>
  refreshMatch: () => void
}

export function useMatchTimer(match: Match | null, onMatchUpdate?: (match: Match) => void): UseMatchTimerReturn {
  const [currentDuration, setCurrentDuration] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Update timer state based on match
  useEffect(() => {
    console.log('useMatchTimer: Match changed:', match?.id, match?.match_status)
    if (!match) {
      console.log('useMatchTimer: No match available, resetting timer state')
      setCurrentDuration(0)
      setIsPaused(false)
      setIsActive(false)
      return
    }

    setIsPaused(match.match_status === 'paused')
    setIsActive(match.match_status === 'active')
    
    // Calculate initial duration
    const duration = MatchService.calculateCurrentDuration(match)
    setCurrentDuration(duration)
  }, [match])

  // Timer interval for active matches
  useEffect(() => {
    if (!match || !isActive || isPaused) return

    const interval = setInterval(() => {
      const duration = MatchService.calculateCurrentDuration(match)
      setCurrentDuration(duration)
    }, 1000)

    return () => clearInterval(interval)
  }, [match, isActive, isPaused])

  // Format time for display
  const { minutes, seconds, formatted: formattedTime } = MatchService.formatDuration(currentDuration)

  // Match control functions
  const startMatch = useCallback(async () => {
    if (!match) return
    
    const updatedMatch = await MatchService.startMatch(match.id)
    if (updatedMatch && onMatchUpdate) {
      onMatchUpdate(updatedMatch)
    }
  }, [match, onMatchUpdate])

  const pauseMatch = useCallback(async () => {
    if (!match) return
    
    const updatedMatch = await MatchService.pauseMatch(match.id)
    if (updatedMatch && onMatchUpdate) {
      onMatchUpdate(updatedMatch)
    }
  }, [match, onMatchUpdate])

  const resumeMatch = useCallback(async () => {
    if (!match) return
    
    const updatedMatch = await MatchService.resumeMatch(match.id)
    if (updatedMatch && onMatchUpdate) {
      onMatchUpdate(updatedMatch)
    }
  }, [match, onMatchUpdate])

  const endMatch = useCallback(async (winnerTeam?: 'A' | 'B' | null) => {
    console.log('useMatchTimer.endMatch: Called with winnerTeam:', winnerTeam, 'match:', match?.id, 'status:', match?.match_status)
    if (!match) {
      console.log('useMatchTimer.endMatch: No match available')
      return
    }
    
    console.log('useMatchTimer.endMatch: Calling MatchService.endMatch for match', match.id)
    const updatedMatch = await MatchService.endMatch(match.id, winnerTeam)
    console.log('useMatchTimer.endMatch: MatchService.endMatch returned:', updatedMatch)
    
    if (updatedMatch && onMatchUpdate) {
      console.log('useMatchTimer.endMatch: Calling onMatchUpdate with updated match')
      onMatchUpdate(updatedMatch)
    } else {
      console.log('useMatchTimer.endMatch: No updated match or no onMatchUpdate callback')
    }
  }, [match, onMatchUpdate])

  const refreshMatch = useCallback(() => {
    if (match) {
      const duration = MatchService.calculateCurrentDuration(match)
      setCurrentDuration(duration)
    }
  }, [match])

  return {
    currentDuration,
    formattedTime,
    minutes,
    seconds,
    isPaused,
    isActive,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    refreshMatch
  }
} 
import { useState, useEffect, useCallback, useRef } from 'react'
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
  isTimerBusy: boolean
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
  const [isTimerBusy, setIsTimerBusy] = useState(false)
  
  // Use refs to track previous values and prevent unnecessary updates
  const prevMatchId = useRef<string | null>(null)
  const prevMatchStatus = useRef<string | null>(null)
  const onMatchUpdateRef = useRef(onMatchUpdate)

  // Update ref when callback changes
  useEffect(() => {
    onMatchUpdateRef.current = onMatchUpdate
  }, [onMatchUpdate])

  // Update timer state based on match - only when match actually changes
  useEffect(() => {
    const matchId = match?.id
    const matchStatus = match?.match_status
    
    // Only update if match ID or status actually changed
    if (prevMatchId.current === matchId && prevMatchStatus.current === matchStatus) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useMatchTimer: Skipping update - no change in match ID or status')
      }
      return
    }
    
    console.log('useMatchTimer: Match changed:', matchId, matchStatus, 'prev:', prevMatchId.current, prevMatchStatus.current)
    
    if (!match) {
      console.log('useMatchTimer: No match available, resetting timer state')
      setCurrentDuration(0)
      setIsPaused(false)
      setIsActive(false)
      prevMatchId.current = null
      prevMatchStatus.current = null
      return
    }

    setIsPaused(match.match_status === 'paused')
    setIsActive(match.match_status === 'active')
    
    // Calculate initial duration
    const duration = MatchService.calculateCurrentDuration(match)
    console.log('useMatchTimer: Setting current duration to:', duration, 'for match status:', match.match_status)
    setCurrentDuration(duration)
    
    // Update refs
    prevMatchId.current = matchId || null
    prevMatchStatus.current = matchStatus || null
  }, [match?.id, match?.match_status])

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

  // Match control functions - memoized to prevent unnecessary re-renders
  const startMatch = useCallback(async () => {
    if (!match || isTimerBusy) return
    
    setIsTimerBusy(true)
    try {
      const updatedMatch = await MatchService.startMatch(match.id)
      if (updatedMatch && onMatchUpdateRef.current) {
        onMatchUpdateRef.current(updatedMatch)
      }
    } finally {
      setIsTimerBusy(false)
    }
  }, [match?.id, isTimerBusy])

  const pauseMatch = useCallback(async () => {
    if (!match || isTimerBusy) {
      console.log('useMatchTimer.pauseMatch: Skipping - no match or timer busy')
      return
    }
    
    setIsTimerBusy(true)
    try {
      console.log('useMatchTimer.pauseMatch: Starting pause for match:', match.id)
      const updatedMatch = await MatchService.pauseMatch(match.id)
      console.log('useMatchTimer.pauseMatch: Received updated match:', updatedMatch)
      if (updatedMatch && onMatchUpdateRef.current) {
        console.log('useMatchTimer.pauseMatch: Calling onMatchUpdate with updated match')
        onMatchUpdateRef.current(updatedMatch)
      }
    } finally {
      setIsTimerBusy(false)
    }
  }, [match?.id, isTimerBusy])

  const resumeMatch = useCallback(async () => {
    if (!match || isTimerBusy) {
      console.log('useMatchTimer.resumeMatch: Skipping - no match or timer busy')
      return
    }
    
    setIsTimerBusy(true)
    try {
      console.log('useMatchTimer.resumeMatch: Starting resume for match:', match.id)
      const updatedMatch = await MatchService.resumeMatch(match.id)
      console.log('useMatchTimer.resumeMatch: Received updated match:', updatedMatch)
      if (updatedMatch && onMatchUpdateRef.current) {
        console.log('useMatchTimer.resumeMatch: Calling onMatchUpdate with updated match')
        onMatchUpdateRef.current(updatedMatch)
      }
    } finally {
      setIsTimerBusy(false)
    }
  }, [match?.id, isTimerBusy])

  const endMatch = useCallback(async (winnerTeam?: 'A' | 'B' | null) => {
    console.log('useMatchTimer.endMatch: Called with winnerTeam:', winnerTeam, 'match:', match?.id, 'status:', match?.match_status)
    if (!match || isTimerBusy) {
      console.log('useMatchTimer.endMatch: No match available or timer busy')
      return
    }
    
    setIsTimerBusy(true)
    try {
      console.log('useMatchTimer.endMatch: Calling MatchService.endMatch for match', match.id)
      const updatedMatch = await MatchService.endMatch(match.id, winnerTeam)
      console.log('useMatchTimer.endMatch: MatchService.endMatch returned:', updatedMatch)
      
      if (updatedMatch && onMatchUpdateRef.current) {
        console.log('useMatchTimer.endMatch: Calling onMatchUpdate with updated match')
        onMatchUpdateRef.current(updatedMatch)
      } else {
        console.log('useMatchTimer.endMatch: No updated match or no onMatchUpdate callback')
      }
    } finally {
      setIsTimerBusy(false)
    }
  }, [match?.id, match?.match_status, isTimerBusy])

  const refreshMatch = useCallback(() => {
    if (match) {
      const duration = MatchService.calculateCurrentDuration(match)
      setCurrentDuration(duration)
    }
  }, [match?.id])

  return {
    currentDuration,
    formattedTime,
    minutes,
    seconds,
    isPaused,
    isActive,
    isTimerBusy,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    refreshMatch
  }
} 
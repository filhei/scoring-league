'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useMatchTimer } from './useMatchTimer'
import { useGameData } from './useGameData'
import { convertPlannedGameToActiveGameData } from '../game-utils'
import type { Player, Match, ActiveGameData, Score } from '../types'

// Game context type to track which game we're currently viewing
export interface GameContext {
  type: 'active' | 'planned' | 'selected-active'
  gameData: ActiveGameData
  matchId: string
}

export interface GameState {
  // Local state
  isSidesSwapped: boolean
  currentGameContext: GameContext | null
  showMatchesList: boolean
  userRequestedMatchesList: boolean
  hasInitialized: boolean
  localTeamA: Player[]
  localTeamB: Player[]
  isCreatingGame: boolean
  isStartingGame: boolean
  startingGameId: string | null
  selectedGameId: string | null
  isEndingGame: boolean
  
  // Actions
  setIsSidesSwapped: (swapped: boolean) => void
  setCurrentGameContext: (context: GameContext | null) => void
  setShowMatchesList: (show: boolean) => void
  setUserRequestedMatchesList: (requested: boolean) => void
  setLocalTeamA: (team: Player[]) => void
  setLocalTeamB: (team: Player[]) => void
  setIsCreatingGame: (creating: boolean) => void
  setIsStartingGame: (starting: boolean) => void
  setStartingGameId: (id: string | null) => void
  setSelectedGameId: (id: string | null) => void
  setIsEndingGame: (ending: boolean) => void
  
  // Computed values
  currentGameData: ActiveGameData | null
  teamAScore: number
  teamBScore: number
  currentTeamData: { teamA: Player[], teamB: Player[] }
  
  // Timer
  timer: ReturnType<typeof useMatchTimer>
  
  // Data fetching
  activeGame: ActiveGameData | null
  availablePlayers: Player[]
  allGames: Match[]
  loading: boolean
  playersLoading: boolean
  gameLoading: boolean
  allGamesLoading: boolean
  error: Error | null
  refreshGameData: () => void
}

export function useGameState(): GameState {
  // Local state
  const [isSidesSwapped, setIsSidesSwapped] = useState(false)
  const [currentGameContext, setCurrentGameContext] = useState<GameContext | null>(null)
  const [showMatchesList, setShowMatchesList] = useState(false)
  const [userRequestedMatchesList, setUserRequestedMatchesList] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [localTeamA, setLocalTeamA] = useState<Player[]>([])
  const [localTeamB, setLocalTeamB] = useState<Player[]>([])
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [startingGameId, setStartingGameId] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isEndingGame, setIsEndingGame] = useState(false)
  
  // Use refs to track previous values and prevent unnecessary updates
  const prevActiveGameId = useRef<string | null>(null)
  const prevActiveGameStatus = useRef<string | null>(null)
  const lastRefreshTime = useRef<number>(0)
  const stableMatchRef = useRef<Match | null>(null)
  const currentGameContextRef = useRef<GameContext | null>(null)
  
  // Update the ref whenever context changes
  useEffect(() => {
    currentGameContextRef.current = currentGameContext
  }, [currentGameContext])
  
  // Use React Query for data fetching
  const { 
    activeGame, 
    availablePlayers, 
    allGames, 
    loading,
    playersLoading,
    gameLoading,
    allGamesLoading,
    error: gameError,
    refreshGameData 
  } = useGameData()
  
  // Create a stable match reference for the timer
  const stableMatch = useMemo(() => {
    if (currentGameContext?.type !== 'active' || !currentGameContext?.gameData?.match) {
      stableMatchRef.current = null
      return null
    }
    
    const currentMatch = currentGameContext.gameData.match
    const prevMatch = stableMatchRef.current
    
    // Only update if the match actually changed (different ID or status)
    if (!prevMatch || 
        prevMatch.id !== currentMatch.id || 
        prevMatch.match_status !== currentMatch.match_status ||
        prevMatch.start_time !== currentMatch.start_time) {
      stableMatchRef.current = currentMatch
    }
    
    return stableMatchRef.current
  }, [currentGameContext?.type, currentGameContext?.gameData?.match?.id, currentGameContext?.gameData?.match?.match_status, currentGameContext?.gameData?.match?.start_time])
  
  // Stable callback for timer updates - prevents circular dependency
  const handleMatchUpdate = useCallback((updatedMatch: Match) => {
    if (isEndingGame) {
      return
    }
    
    // Prevent excessive refreshes - only refresh if enough time has passed
    const now = Date.now()
    if (now - lastRefreshTime.current < 2000) { // Increased to 2 seconds
      return
    }
    lastRefreshTime.current = now
    
    const currentContext = currentGameContextRef.current
    if (currentContext?.type === 'active' && updatedMatch) {
      setCurrentGameContext({
        type: 'active',
        gameData: {
          ...currentContext.gameData,
          match: updatedMatch
        },
        matchId: updatedMatch.id
      })
    }
    
    // Only refresh game data if the match status actually changed
    if (updatedMatch.match_status !== prevActiveGameStatus.current) {
      refreshGameData()
    }
  }, [isEndingGame, refreshGameData])
  
  // Timer hook - use stable match reference
  const timer = useMatchTimer(stableMatch, handleMatchUpdate)

  // Update current game context when activeGame changes - simplified
  useEffect(() => {
    if (isEndingGame) {
      return
    }
    
    const activeGameId = activeGame?.match.id
    const activeGameStatus = activeGame?.match.match_status
    
    // Only update if the game actually changed
    if (prevActiveGameId.current === activeGameId && prevActiveGameStatus.current === activeGameStatus) {
      return
    }
    
    if (activeGame) {
      setCurrentGameContext({
        type: activeGame.match.match_status === 'active' || activeGame.match.match_status === 'paused' ? 'active' : 'planned',
        gameData: activeGame,
        matchId: activeGame.match.id
      })
      
      setLocalTeamA([...activeGame.teamA])
      setLocalTeamB([...activeGame.teamB])
      
      if (isStartingGame && startingGameId && activeGame.match.id === startingGameId) {
        setIsStartingGame(false)
        setStartingGameId(null)
      }
      
      if (selectedGameId && activeGame.match.id === selectedGameId) {
        setSelectedGameId(null)
      }
      
      // Update refs
      prevActiveGameId.current = activeGameId || null
      prevActiveGameStatus.current = activeGameStatus || null
    } else {
      if (!isStartingGame) {
        setCurrentGameContext(null)
        setLocalTeamA([])
        setLocalTeamB([])
        prevActiveGameId.current = null
        prevActiveGameStatus.current = null
        stableMatchRef.current = null
      }
    }
  }, [activeGame?.match.id, activeGame?.match.match_status, isStartingGame, startingGameId, selectedGameId, isEndingGame])

  // Set initial state based on whether there's an active game - simplified
  useEffect(() => {
    if (!loading && !hasInitialized) {
      setHasInitialized(true)
      setUserRequestedMatchesList(false)
      if (activeGame) {
        setCurrentGameContext({
          type: 'active',
          gameData: activeGame,
          matchId: activeGame.match.id
        })
        setShowMatchesList(false)
      } else {
        setCurrentGameContext(null)
        setShowMatchesList(true)
      }
    }
  }, [activeGame?.match.id, loading, hasInitialized, gameError])

  // Update local state when currentGameContext changes - only when match ID changes
  useEffect(() => {
    if (currentGameContext) {
      setLocalTeamA([...currentGameContext.gameData.teamA])
      setLocalTeamB([...currentGameContext.gameData.teamB])
    } else {
      setLocalTeamA([])
      setLocalTeamB([])
    }
  }, [currentGameContext?.matchId])

  // Computed values
  const currentGameData = (currentGameContext?.gameData ?? null) as ActiveGameData | null
  
  const getCurrentTeamData = () => {
    if (!currentGameData) return { teamA: [], teamB: [] }
    
    // Always use the current game context data for both active and planned games
    // This ensures optimistic updates work correctly
    return {
      teamA: currentGameData.teamA,
      teamB: currentGameData.teamB
    }
  }

  const currentTeamData = getCurrentTeamData()
  
  // Calculate scores
  const teamAScore = currentGameData ? 
    currentGameData.scores.filter((score: Score) => score.team === 'A').length : 0
  const teamBScore = currentGameData ? 
    currentGameData.scores.filter((score: Score) => score.team === 'B').length : 0

  return {
    // State
    isSidesSwapped,
    currentGameContext,
    showMatchesList,
    userRequestedMatchesList,
    hasInitialized,
    localTeamA,
    localTeamB,
    isCreatingGame,
    isStartingGame,
    startingGameId,
    selectedGameId,
    isEndingGame,
    
    // Actions
    setIsSidesSwapped,
    setCurrentGameContext,
    setShowMatchesList,
    setUserRequestedMatchesList,
    setLocalTeamA,
    setLocalTeamB,
    setIsCreatingGame,
    setIsStartingGame,
    setStartingGameId,
    setSelectedGameId,
    setIsEndingGame,
    
    // Computed values
    currentGameData,
    teamAScore,
    teamBScore,
    currentTeamData,
    
    // Timer
    timer,
    
    // Data fetching
    activeGame: activeGame ?? null,
    availablePlayers,
    allGames,
    loading,
    playersLoading,
    gameLoading,
    allGamesLoading,
    error: gameError,
    refreshGameData
  }
} 
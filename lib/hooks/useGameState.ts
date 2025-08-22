'use client'

import { useState, useEffect } from 'react'
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
  
  // Use React Query for data fetching
  const { 
    activeGame, 
    availablePlayers, 
    allGames, 
    loading,
    playersLoading,
    gameLoading,
    allGamesLoading,
    refreshGameData 
  } = useGameData(selectedGameId || currentGameContext?.matchId)
  
  // Timer hook
  const timer = useMatchTimer(
    currentGameContext?.type === 'active' ? currentGameContext.gameData.match : null, 
    (updatedMatch) => {
      if (isEndingGame) {
        console.log('Timer callback: Skipping context update while ending game')
        return
      }
      
      if (currentGameContext?.type === 'active' && updatedMatch) {
        setCurrentGameContext({
          type: 'active',
          gameData: {
            ...currentGameContext.gameData,
            match: updatedMatch
          },
          matchId: updatedMatch.id
        })
      }
      refreshGameData()
    }
  )

  // Update current game context when activeGame changes
  useEffect(() => {
    if (isEndingGame) {
      console.log('ActiveGame effect: Skipping context update while ending game')
      return
    }
    
    if (activeGame) {
      console.log(`ActiveGame effect: Updating context to game ${activeGame.match.id.slice(0, 8)}... (${activeGame.match.match_status})`)
      setCurrentGameContext({
        type: activeGame.match.match_status === 'active' || activeGame.match.match_status === 'paused' ? 'active' : 'planned',
        gameData: activeGame,
        matchId: activeGame.match.id
      })
      
      setLocalTeamA([...activeGame.teamA])
      setLocalTeamB([...activeGame.teamB])
      
      if (isStartingGame && startingGameId && activeGame.match.id === startingGameId) {
        console.log('ActiveGame effect: Game start completed, clearing flags')
        setIsStartingGame(false)
        setStartingGameId(null)
      }
      
      if (selectedGameId && activeGame.match.id === selectedGameId) {
        console.log('ActiveGame effect: Selected game loaded, clearing selectedGameId')
        setSelectedGameId(null)
      }
    } else {
      if (!isStartingGame) {
        console.log('ActiveGame effect: No active game, clearing context')
        setCurrentGameContext(null)
        setLocalTeamA([])
        setLocalTeamB([])
      } else {
        console.log('ActiveGame effect: No active game from query, but starting game in progress, keeping context')
      }
    }
  }, [activeGame, isStartingGame, startingGameId, selectedGameId, isEndingGame])

  // Set initial state based on whether there's an active game
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
  }, [activeGame, loading, hasInitialized])

  // Update local state when currentGameContext changes
  useEffect(() => {
    if (currentGameContext) {
      console.log(`Updating local state for game context: ${currentGameContext.type} (ID: ${currentGameContext.matchId})`)
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
    
    if (currentGameContext) {
      return {
        teamA: localTeamA,
        teamB: localTeamB
      }
    }
    
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
    refreshGameData
  }
} 
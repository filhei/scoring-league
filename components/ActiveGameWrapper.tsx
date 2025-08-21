'use client'

import { useState, useRef } from 'react'
import { useMatchTimer } from '../lib/hooks/useMatchTimer'
import { useSnackbar } from '../lib/hooks/useSnackbar'
import { useGameData } from '../lib/hooks/useGameData'
import { getTeamScore, getAvailablePlayersForSelection, convertPlannedGameToActiveGameData } from '../lib/game-utils'
import { 
  addScore, 
  addPlayerToMatch, 
  removePlayerFromMatch, 
  updatePlayerTeam, 
  assignGoalkeeper,
  removeGoalkeeper,
  addPlayerToField,
  toggleVests,
  controlMatch,
  createMatch
} from '@/app/actions'
import type { GoalDialogState, PlayerSelectState, Player, Match, ActiveGameData } from '../lib/types'
import React from 'react' // Added missing import

// Components
import { Navigation } from './Navigation'
import { ActiveGame } from './ActiveGame'
import { PlayerSelectModal } from './PlayerSelectModal'
import { GoalDialog } from './GoalDialog'
import { Snackbar } from './Snackbar'
import { NoActiveGame } from './NoActiveGame'
import { MatchesList } from './MatchesList'
import { GameLoadingSkeleton } from './ui/loading-skeleton'

interface ActiveGameWrapperProps {
  initialActiveGame: any // We'll use React Query instead
  availablePlayers: Player[]
  allGames: Match[] // This will be replaced by React Query
}

// Game context type to track which game we're currently viewing
interface GameContext {
  type: 'active' | 'planned' | 'selected-active'
  gameData: ActiveGameData
  matchId: string
}

export function ActiveGameWrapper({ initialActiveGame, availablePlayers, allGames }: ActiveGameWrapperProps) {
  // Local state
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidesSwapped, setIsSidesSwapped] = useState(false)
  const [currentGameContext, setCurrentGameContext] = useState<GameContext | null>(null)
  const [showMatchesList, setShowMatchesList] = useState(false) // Start with false, will be set based on activeGame
  const [userRequestedMatchesList, setUserRequestedMatchesList] = useState(false) // Track when user explicitly wants matches list
  const [hasInitialized, setHasInitialized] = useState(false) // Track if we've done initial setup
  const [localTeamA, setLocalTeamA] = useState<Player[]>([])
  const [localTeamB, setLocalTeamB] = useState<Player[]>([])
  const [showPlayerSelect, setShowPlayerSelect] = useState<PlayerSelectState>({ 
    team: null, 
    isGoalkeeper: false 
  })
  const [goalDialog, setGoalDialog] = useState<GoalDialogState>({
    isOpen: false,
    team: null,
    scoringPlayer: null,
    assistingPlayer: null
  })
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [startingGameId, setStartingGameId] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isEndingGame, setIsEndingGame] = useState(false)
  
  const { snackbar, showSnackbar } = useSnackbar()
  
  // Use React Query for data fetching - use selectedGameId if available, otherwise currentGameContext
  const { 
    activeGame, 
    availablePlayers: queryAvailablePlayers, 
    allGames: queryAllGames, 
    loading,
    playersLoading,
    gameLoading,
    allGamesLoading,
    refreshGameData 
  } = useGameData(selectedGameId || currentGameContext?.matchId)
  
  // Timer hook - use current game context for active games
  const timer = useMatchTimer(
    currentGameContext?.type === 'active' ? currentGameContext.gameData.match : null, 
    (updatedMatch) => {
      // Don't update context if we're ending a game - this prevents flickering
      if (isEndingGame) {
        console.log('Timer callback: Skipping context update while ending game')
        return
      }
      
      // Update current game context with the updated match
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
      // Refresh game data when match updates
      refreshGameData()
    }
  )

  // Update current game context when activeGame changes
  React.useEffect(() => {
    // Don't update context if we're ending a game - this prevents flickering
    if (isEndingGame) {
      console.log('ActiveGame effect: Skipping context update while ending game')
      return
    }
    
    if (activeGame) {
      console.log(`ActiveGame effect: Updating context to game ${activeGame.match.id.slice(0, 8)}... (${activeGame.match.match_status})`)
      // Update the context with the game data from the query
      setCurrentGameContext({
        type: activeGame.match.match_status === 'active' || activeGame.match.match_status === 'paused' ? 'active' : 'planned',
        gameData: activeGame,
        matchId: activeGame.match.id
      })
      
      // Initialize local state
      setLocalTeamA([...activeGame.teamA])
      setLocalTeamB([...activeGame.teamB])
      
      // Clear starting game flags if this is the game we were starting
      if (isStartingGame && startingGameId && activeGame.match.id === startingGameId) {
        console.log('ActiveGame effect: Game start completed, clearing flags')
        setIsStartingGame(false)
        setStartingGameId(null)
      }
      
      // Clear selected game ID since we now have the game data
      if (selectedGameId && activeGame.match.id === selectedGameId) {
        console.log('ActiveGame effect: Selected game loaded, clearing selectedGameId')
        setSelectedGameId(null)
      }
    } else {
      // Only clear current game context if we're not in the process of starting a game
      // This prevents clearing the context when the query temporarily fails during game start
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

  // Set initial state based on whether there's an active game (only on first load)
  React.useEffect(() => {
    if (!loading && !hasInitialized) {
      setHasInitialized(true)
      setUserRequestedMatchesList(false) // Reset flag on initial load
      if (activeGame) {
        // If there's an active game, show it directly
        setCurrentGameContext({
          type: 'active',
          gameData: activeGame,
          matchId: activeGame.match.id
        })
        setShowMatchesList(false)
      } else {
        // If no active game, show the matches list
        setCurrentGameContext(null)
        setShowMatchesList(true)
      }
    }
  }, [activeGame, loading, hasInitialized])

  // Update local state when currentGameContext changes
  React.useEffect(() => {
    if (currentGameContext) {
      console.log(`Updating local state for game context: ${currentGameContext.type} (ID: ${currentGameContext.matchId})`)
      setLocalTeamA([...currentGameContext.gameData.teamA])
      setLocalTeamB([...currentGameContext.gameData.teamB])
    } else {
      // Clear local state when no game context
      setLocalTeamA([])
      setLocalTeamB([])
    }
  }, [currentGameContext?.matchId]) // Only sync when the match ID changes

  // Get the current game context (the game being viewed/edited)
  const getCurrentGameContext = (): ActiveGameData | null => {
    return currentGameContext?.gameData || null
  }

  // Calculate scores for the current game context
  const currentGameData = getCurrentGameContext()
  const teamAScore = currentGameData ? getTeamScore(currentGameData.scores, 'A') : 0
  const teamBScore = currentGameData ? getTeamScore(currentGameData.scores, 'B') : 0

  // Get current team data (using local state for reordering)
  const getCurrentTeamData = () => {
    if (!currentGameData) return { teamA: [], teamB: [] }
    
    // For both planned and active games, always use local state if we have a currentGameContext
    // This ensures that local state updates (like goalkeeper assignments) are immediately reflected
    if (currentGameContext) {
      return {
        teamA: localTeamA,
        teamB: localTeamB
      }
    }
    
    // Fallback to currentGameData if no context (shouldn't happen in normal flow)
    return {
      teamA: currentGameData.teamA,
      teamB: currentGameData.teamB
    }
  }

  // Helper function to ensure we're operating on the correct match
  const ensureCorrectMatch = (operation: string): boolean => {
    if (!currentGameContext) {
      console.error(`${operation}: No current game context`)
      showSnackbar('No game selected')
      return false
    }
    
    console.log(`${operation}: Operating on match ID ${currentGameContext.matchId}`)
    return true
  }

  // Event handlers
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleScoreIncrement = async (team: 'A' | 'B') => {
    if (!ensureCorrectMatch('Score increment')) return
    
    setGoalDialog({
      isOpen: true,
      team,
      scoringPlayer: null,
      assistingPlayer: null
    })
  }

  const handleGoalDialogPlayerClick = (player: Player) => {
    setGoalDialog(prev => {
      const isScoring = prev.scoringPlayer?.id === player.id
      const isAssisting = prev.assistingPlayer?.id === player.id
      
      if (isScoring) {
        if (!prev.assistingPlayer) {
          return { ...prev, scoringPlayer: null, assistingPlayer: player }
        } else {
          return { ...prev, scoringPlayer: null }
        }
      }
      
      if (isAssisting) {
        return { ...prev, assistingPlayer: null }
      }
      
      if (!prev.scoringPlayer) {
        return { ...prev, scoringPlayer: player }
      }
      
      if (!prev.assistingPlayer) {
        return { ...prev, assistingPlayer: player }
      }
      
      showSnackbar('Bara en målgörare och assisterande spelare kan väljas')
      return prev
    })
  }

  const handleGoalDialogSubmit = async () => {
    if (!ensureCorrectMatch('Goal dialog submit')) return
    if (!goalDialog.team) return

    try {
      const result = await addScore({
        matchId: currentGameContext!.matchId,
        team: goalDialog.team,
        scoringPlayerId: goalDialog.scoringPlayer?.id,
        assistingPlayerId: goalDialog.assistingPlayer?.id
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        return
      }

      if (result.data) {
        // Close dialog
        setGoalDialog({ isOpen: false, team: null, scoringPlayer: null, assistingPlayer: null })
        
        // Refresh game data to get updated scores
        if (currentGameContext?.type === 'planned') {
          // Update the selected planned game data
          const updatedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: updatedGameData,
            matchId: updatedGameData.match.id
          })
        } else {
          refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error adding score:', error)
      showSnackbar('Failed to add score')
    }
  }

  const handleGoalDialogCancel = () => {
    setGoalDialog({ isOpen: false, team: null, scoringPlayer: null, assistingPlayer: null })
  }

  const removeSelectedPlayer = (type: 'scoring' | 'assisting') => {
    setGoalDialog(prev => ({
      ...prev,
      [type === 'scoring' ? 'scoringPlayer' : 'assistingPlayer']: null
    }))
  }

  const handlePauseToggle = async () => {
    if (timer.isPaused) {
      await timer.resumeMatch()
    } else {
      await timer.pauseMatch()
    }
  }

  const handleEndMatch = async () => {
    if (!ensureCorrectMatch('End match')) return

    try {
      console.log('handleEndMatch: Starting to end match...')
      console.log('handleEndMatch: Current game context:', currentGameContext?.type, currentGameContext?.matchId)
      console.log('handleEndMatch: Timer match available:', !!timer)
      
      // Set ending game flag to prevent context updates during the process
      setIsEndingGame(true)
      
      const winnerTeam = teamAScore > teamBScore ? 'A' : teamBScore > teamAScore ? 'B' : null
      console.log('handleEndMatch: Winner team:', winnerTeam)
      console.log('handleEndMatch: Calling timer.endMatch...')
      await timer.endMatch(winnerTeam)
      console.log('handleEndMatch: timer.endMatch completed successfully')
      
      // Show success message
      const winnerText = winnerTeam ? `Team ${winnerTeam} wins!` : 'Match ended in a tie!'
      showSnackbar(`Match ended successfully. ${winnerText}`, 3000)
      
      // Go back to matches list after ending the match
      console.log('handleEndMatch: Going back to matches list')
      setCurrentGameContext(null)
      setUserRequestedMatchesList(true)
      setShowMatchesList(true)
      
      // Refresh all games data to reflect the status change
      refreshGameData()
      
      // Clear the ending game flag after a short delay to allow data to refresh
      setTimeout(() => {
        setIsEndingGame(false)
        console.log('handleEndMatch: Cleared ending game flag')
      }, 1000)
    } catch (error) {
      console.error('Error ending match:', error)
      showSnackbar('Failed to end match')
      // Clear the ending game flag on error
      setIsEndingGame(false)
    }
  }

  const handleEndMatchAndCreateNew = async () => {
    if (!ensureCorrectMatch('End match and create new')) return

    try {
      // Set ending game flag to prevent context updates during the process
      setIsEndingGame(true)
      
      // First end the current match
      const winnerTeam = teamAScore > teamBScore ? 'A' : teamBScore > teamAScore ? 'B' : null
      await timer.endMatch(winnerTeam)

      // Get current team data for the new match
      const currentTeamData = getCurrentTeamData()
      
      // Create new match with same team configuration
      const createResult = await createMatch({
        teamWithVests: currentGameContext!.gameData.match.team_with_vests as 'A' | 'B' | null,
        teamAPlayerIds: currentTeamData.teamA.map(player => player.id),
        teamBPlayerIds: currentTeamData.teamB.map(player => player.id),
        teamAGoalkeeperId: currentGameContext!.gameData.goalkeepers.teamA?.id || null,
        teamBGoalkeeperId: currentGameContext!.gameData.goalkeepers.teamB?.id || null
      })

      if (createResult.validationErrors || createResult.serverError) {
        showSnackbar('Failed to create new match')
        setIsEndingGame(false) // Clear flag on error
        return
      }

      if (createResult.data) {
        const winnerText = winnerTeam ? `Team ${winnerTeam} wins!` : 'Match ended in a tie!'
        showSnackbar(`Match ended successfully. ${winnerText} New match created with same teams!`, 4000)
        
        // Go back to matches list to show the new planned match
        console.log('handleEndMatchAndCreateNew: Going back to matches list')
        setCurrentGameContext(null)
        setUserRequestedMatchesList(true)
        setShowMatchesList(true)
        
        // Refresh all games data to reflect the status change and new match
        refreshGameData()
        
        // Clear the ending game flag after a short delay to allow data to refresh
        setTimeout(() => {
          setIsEndingGame(false)
          console.log('handleEndMatchAndCreateNew: Cleared ending game flag')
        }, 1000)
      }
    } catch (error) {
      console.error('Error ending match and creating new:', error)
      showSnackbar('Failed to end match and create new')
      // Clear the ending game flag on error
      setIsEndingGame(false)
    }
  }

  const handleSwapSides = () => {
    setIsSidesSwapped(!isSidesSwapped)
  }

  const handleVestToggle = async (team: 'A' | 'B') => {
    if (!ensureCorrectMatch('Vest toggle')) return
    
    try {
      const currentTeamWithVests = currentGameContext!.gameData.match.team_with_vests as 'A' | 'B' | null
      const newTeamWithVests = currentTeamWithVests === team ? null : team
      
      // If we're viewing a planned game, update local state immediately for instant feedback
      if (currentGameContext?.type === 'planned') {
        const updatedPlannedGame = {
          ...currentGameContext.gameData,
          match: {
            ...currentGameContext.gameData.match,
            team_with_vests: newTeamWithVests
          }
        }
        setCurrentGameContext({
          type: 'planned',
          gameData: updatedPlannedGame,
          matchId: currentGameContext.matchId
        })
      }
      
      const result = await toggleVests({
        matchId: currentGameContext!.matchId,
        team: newTeamWithVests
      })
      
      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        // Revert local state on error
        if (currentGameContext?.type === 'planned') {
          setCurrentGameContext({
            type: 'planned',
            gameData: currentGameContext.gameData,
            matchId: currentGameContext.matchId
          })
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        // Revert local state on error
        if (currentGameContext?.type === 'planned') {
          setCurrentGameContext({
            type: 'planned',
            gameData: currentGameContext.gameData,
            matchId: currentGameContext.matchId
          })
        }
        return
      }

      if (result.data) {
        if (currentGameContext?.type === 'planned') {
          // For planned games, we already updated the local state immediately above
          // No need to refresh from database since we have the correct state locally
          console.log('Vest toggle successful - keeping local state')
        } else {
          refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error toggling vests:', error)
      showSnackbar('Failed to update vests')
      // Revert local state on error
      if (currentGameContext?.type === 'planned') {
        setCurrentGameContext({
          type: 'planned',
          gameData: currentGameContext.gameData,
          matchId: currentGameContext.matchId
        })
      }
    }
  }

  const handleAddPlayer = (team: 'A' | 'B', isGoalkeeper: boolean = false) => {
    setShowPlayerSelect({ team, isGoalkeeper })
  }

  const handlePlayerSelect = async (player: Player, team: 'A' | 'B') => {
    if (!ensureCorrectMatch('Add player')) return

    try {
      // For planned games, update local state immediately for instant feedback
      if (currentGameContext?.type === 'planned') {
        if (showPlayerSelect.isGoalkeeper) {
          // Add goalkeeper
          setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...currentGameContext.gameData,
              goalkeepers: {
                ...currentGameContext.gameData.goalkeepers,
                [team === 'A' ? 'teamA' : 'teamB']: player
              }
            },
            matchId: currentGameContext.matchId
          })
        } else {
          // Add field player
          if (team === 'A') {
            const newTeamA = [...localTeamA, player]
            setLocalTeamA(newTeamA)
            setCurrentGameContext({
              type: 'planned',
              gameData: {
                ...currentGameContext.gameData,
                teamA: newTeamA
              },
              matchId: currentGameContext.matchId
            })
          } else {
            const newTeamB = [...localTeamB, player]
            setLocalTeamB(newTeamB)
            setCurrentGameContext({
              type: 'planned',
              gameData: {
                ...currentGameContext.gameData,
                teamB: newTeamB
              },
              matchId: currentGameContext.matchId
            })
          }
        }
      }

      const result = await addPlayerToMatch({
        matchId: currentGameContext!.matchId,
        playerId: player.id,
        team,
        isGoalkeeper: showPlayerSelect.isGoalkeeper
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        // Revert local state changes on error
        if (currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: currentGameContext.matchId
          })
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        // Revert local state changes on error
        if (currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: currentGameContext.matchId
          })
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.data) {
        // Close player select modal
        setShowPlayerSelect({ team: null, isGoalkeeper: false })
        
        // For active games, refresh from server
        if (currentGameContext?.type !== 'planned') {
          refreshGameData()
        }
        // For planned games, local state is already updated above
      }
    } catch (error) {
      console.error('Error adding player:', error)
      showSnackbar('Failed to add player')
      
      // Revert local state changes on error
      if (currentGameContext?.type === 'planned') {
        try {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: currentGameContext.matchId
          })
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        } catch (revertError) {
          console.error('Error reverting state:', revertError)
        }
      }
    }
  }

  const handleRemovePlayer = async (player: Player) => {
    if (!ensureCorrectMatch('Remove player')) return

    try {
      // For planned games, update local state immediately for instant feedback
      if (currentGameContext?.type === 'planned') {
        // Find which team the player is on and remove them locally
        const playerInTeamA = localTeamA.find(p => p.id === player.id)
        const playerInTeamB = localTeamB.find(p => p.id === player.id)
        
        if (playerInTeamA) {
          const newTeamA = localTeamA.filter(p => p.id !== player.id)
          setLocalTeamA(newTeamA)
          // Also update currentGameContext
          setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...currentGameContext.gameData,
              teamA: newTeamA
            },
            matchId: currentGameContext.matchId
          })
        } else if (playerInTeamB) {
          const newTeamB = localTeamB.filter(p => p.id !== player.id)
          setLocalTeamB(newTeamB)
          // Also update currentGameContext
          setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...currentGameContext.gameData,
              teamB: newTeamB
            },
            matchId: currentGameContext.matchId
          })
        }
      }

      const result = await removePlayerFromMatch({
        matchId: currentGameContext!.matchId,
        playerId: player.id
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        // Revert local state changes on error
        if (currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: currentGameContext.matchId
          })
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        // Revert local state changes on error
        if (currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: currentGameContext.matchId
          })
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.data) {
        // For active games, refresh from server
        if (currentGameContext?.type !== 'planned') {
          refreshGameData()
        }
        // For planned games, local state is already updated above
      }
    } catch (error) {
      console.error('Error removing player:', error)
      showSnackbar('Failed to remove player')
      
      // Revert local state changes on error
      if (currentGameContext?.type === 'planned') {
        try {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: currentGameContext.matchId
          })
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        } catch (revertError) {
          console.error('Error reverting state:', revertError)
        }
      }
    }
  }

  const handleSwitchPlayerTeam = async (player: Player, newTeam: 'A' | 'B', newIndex?: number) => {
    if (!ensureCorrectMatch('Switch player team')) return

    try {
      // Find the player's current position using local state (what's actually displayed)
      // If local state is empty, fall back to currentGameContext data
      const teamA = localTeamA.length > 0 ? localTeamA : currentGameContext!.gameData.teamA
      const teamB = localTeamB.length > 0 ? localTeamB : currentGameContext!.gameData.teamB
      
      const currentTeamA = teamA.find(p => p.id === player.id)
      const currentTeamB = teamB.find(p => p.id === player.id)
      
      // Check goalkeeper status from currentGameContext, but also consider if player might be a goalkeeper
      // that was recently moved to field position
      const isGoalkeeperA = currentGameContext!.gameData.goalkeepers.teamA?.id === player.id
      const isGoalkeeperB = currentGameContext!.gameData.goalkeepers.teamB?.id === player.id
      
      let currentTeam: 'A' | 'B' | null = null
      if (currentTeamA) currentTeam = 'A'
      else if (currentTeamB) currentTeam = 'B'
      else if (isGoalkeeperA) currentTeam = 'A'
      else if (isGoalkeeperB) currentTeam = 'B'
      
      if (!currentTeam) {
        console.error(`Player ${player.name} (${player.id}) not found in any team:`, {
          teamA: teamA.map(p => `${p.name} (${p.id.slice(0, 8)}...)`),
          teamB: teamB.map(p => `${p.name} (${p.id.slice(0, 8)}...)`),
          localTeamASize: localTeamA.length,
          localTeamBSize: localTeamB.length,
          goalkeepers: {
            teamA: currentGameContext!.gameData.goalkeepers.teamA?.name,
            teamB: currentGameContext!.gameData.goalkeepers.teamB?.name
          }
        })
        showSnackbar('Player not found in any team')
        return
      }
      
      const isCurrentlyGoalkeeper = isGoalkeeperA || isGoalkeeperB
      console.log(`Player ${player.name} current position:`, {
        team: currentTeam,
        isGoalkeeper: isCurrentlyGoalkeeper,
        localTeamASize: localTeamA.length,
        localTeamBSize: localTeamB.length,
        usingLocalState: localTeamA.length > 0 && localTeamB.length > 0,
        goalkeeperA: currentGameContext!.gameData.goalkeepers.teamA?.name,
        goalkeeperB: currentGameContext!.gameData.goalkeepers.teamB?.name
      })

      // Handle all drag and drop moves locally (both same-team and cross-team)
      if (newIndex !== undefined) {
        // Special case: Moving goalkeeper to field position
        if (isCurrentlyGoalkeeper && newIndex >= 0) {
          console.log(`Moving goalkeeper ${player.name} from team ${currentTeam} to field position ${newIndex} on team ${newTeam}`)
          
          // Handle local state updates first for instant feedback (for both planned and active games)
          if (currentTeam === newTeam) {
            // Same team: Remove from goalkeeper, add to field at specified position
            console.log(`Same team goalkeeper to field: ${player.name} to position ${newIndex}`)
            if (currentTeam === 'A') {
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              updateTeamState(newTeamA, localTeamB)
            } else {
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              updateTeamState(localTeamA, newTeamB)
            }
          } else {
            // Cross team: Remove from goalkeeper, add to other team's field
            console.log(`Cross team goalkeeper to field: ${player.name} from team ${currentTeam} to team ${newTeam} position ${newIndex}`)
            if (newTeam === 'A') {
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              updateTeamState(newTeamA, localTeamB)
            } else {
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              updateTeamState(localTeamA, newTeamB)
            }
          }
          
          // Also update goalkeeper removal in currentGameContext if applicable
          if (isCurrentlyGoalkeeper) {
            setCurrentGameContext(prev => {
              if (!prev) return prev
              return {
                ...prev,
                gameData: {
                  ...prev.gameData,
                  goalkeepers: {
                    ...prev.gameData.goalkeepers,
                    [currentTeam === 'A' ? 'teamA' : 'teamB']: null
                  }
                }
              }
            })
          }
          
          // Update database in background
          Promise.all([
            removeGoalkeeper({
              matchId: currentGameContext!.matchId,
              playerId: player.id
            }),
            addPlayerToField({
              matchId: currentGameContext!.matchId,
              playerId: player.id,
              team: newTeam
            })
          ]).then(([removeResult, addResult]) => {
            if (removeResult.validationErrors || removeResult.serverError || 
                addResult.validationErrors || addResult.serverError) {
              console.error('Failed to move goalkeeper to field:', {
                removeErrors: removeResult.validationErrors || removeResult.serverError,
                addErrors: addResult.validationErrors || addResult.serverError
              })
              showSnackbar('Warning: Goalkeeper move may not be saved')
            } else {
              console.log(`Successfully moved goalkeeper ${player.name} to field position`)
              // For both planned and active games, we don't need to refresh since local state is already updated
              // The local state updates provide instant feedback for both game types
            }
          }).catch(error => {
            console.error('Error moving goalkeeper to field:', error)
            showSnackbar('Failed to move goalkeeper to field position')
          })
          
          return
        }
        
        // Special case: Goalkeeper assignment (newIndex = -1)
        if (newIndex === -1) {
          // Check if we're swapping goalkeepers (dragging one goalkeeper to another goalkeeper position)
          const isGoalkeeperSwap = isCurrentlyGoalkeeper && currentTeam !== newTeam
          
          console.log(`Goalkeeper assignment case:`, {
            player: player.name,
            currentTeam,
            newTeam,
            isCurrentlyGoalkeeper,
            isGoalkeeperSwap,
            currentGoalkeeperA: currentGameContext!.gameData.goalkeepers.teamA?.name,
            currentGoalkeeperB: currentGameContext!.gameData.goalkeepers.teamB?.name
          })
          
          if (isGoalkeeperSwap) {
            console.log(`Swapping goalkeepers: ${player.name} (${currentTeam}) ↔ ${currentGameContext!.gameData.goalkeepers[newTeam === 'A' ? 'teamA' : 'teamB']?.name || 'None'} (${newTeam})`)
            
            // Get the other goalkeeper
            const otherGoalkeeper = currentGameContext!.gameData.goalkeepers[newTeam === 'A' ? 'teamA' : 'teamB']
            
            // Update local state for instant feedback (for both planned and active games)
            if (otherGoalkeeper) {
              // Both teams have goalkeepers - swap them
              // The other goalkeeper moves to the current goalkeeper's team field
              if (currentTeam === 'A') {
                // Current goalkeeper is from team A, moving to team B
                // Other goalkeeper (from team B) moves to team A field
                const newTeamA = [...localTeamA]
                newTeamA.push(otherGoalkeeper) // Add other goalkeeper to team A field
                updateTeamState(newTeamA, localTeamB)
              } else {
                // Current goalkeeper is from team B, moving to team A
                // Other goalkeeper (from team A) moves to team B field
                const newTeamB = [...localTeamB]
                newTeamB.push(otherGoalkeeper) // Add other goalkeeper to team B field
                updateTeamState(localTeamA, newTeamB)
              }
            } else {
              // Only one goalkeeper exists - just move the current one
              console.log(`Moving goalkeeper ${player.name} from team ${currentTeam} to team ${newTeam}`)
            }
            
            // Update goalkeepers in currentGameContext for both planned and active games
            // This must be done AFTER updating the local state to ensure proper synchronization
            setCurrentGameContext(prev => {
              if (!prev) return prev
              return {
                ...prev,
                gameData: {
                  ...prev.gameData,
                  goalkeepers: {
                    ...prev.gameData.goalkeepers,
                    [newTeam === 'A' ? 'teamA' : 'teamB']: player,
                    [currentTeam === 'A' ? 'teamA' : 'teamB']: otherGoalkeeper || null
                  }
                }
              }
            })
            
            // Also update local state to ensure goalkeeper is removed from field positions
            // This prevents the goalkeeper from appearing in both goalkeeper tile and field
            if (otherGoalkeeper) {
              // Remove the other goalkeeper from their current field position if they exist there
              const otherGoalkeeperInTeamA = localTeamA.find(p => p.id === otherGoalkeeper.id)
              const otherGoalkeeperInTeamB = localTeamB.find(p => p.id === otherGoalkeeper.id)
              
              if (otherGoalkeeperInTeamA) {
                const newTeamA = localTeamA.filter(p => p.id !== otherGoalkeeper.id)
                setLocalTeamA(newTeamA)
              }
              if (otherGoalkeeperInTeamB) {
                const newTeamB = localTeamB.filter(p => p.id !== otherGoalkeeper.id)
                setLocalTeamB(newTeamB)
              }
            }
            
            console.log(`Goalkeeper swap completed: ${player.name} ↔ ${otherGoalkeeper?.name || 'None'}`)
            console.log('Updated goalkeeper state:', {
              teamA: currentGameContext!.gameData.goalkeepers.teamA?.name,
              teamB: currentGameContext!.gameData.goalkeepers.teamB?.name,
              localTeamASize: localTeamA.length,
              localTeamBSize: localTeamB.length
            })
            
            // Update database - swap goalkeepers
            Promise.all([
              assignGoalkeeper({
                matchId: currentGameContext!.matchId,
                playerId: player.id,
                team: newTeam
              }),
              otherGoalkeeper ? assignGoalkeeper({
                matchId: currentGameContext!.matchId,
                playerId: otherGoalkeeper.id,
                team: currentTeam
              }) : Promise.resolve({ validationErrors: null, serverError: null })
            ]).then(([assignResult1, assignResult2]) => {
              if (assignResult1.validationErrors || assignResult1.serverError || 
                  assignResult2.validationErrors || assignResult2.serverError) {
                console.error('Failed to swap goalkeepers in database:', {
                  assign1Errors: assignResult1.validationErrors || assignResult1.serverError,
                  assign2Errors: assignResult2.validationErrors || assignResult2.serverError
                })
                showSnackbar('Warning: Goalkeeper swap may not be saved')
              } else {
                console.log(`Successfully swapped goalkeepers: ${player.name} ↔ ${otherGoalkeeper?.name || 'None'}`)
                // For both planned and active games, we don't need to refresh since local state is already updated
                // The local state updates provide instant feedback for both game types
              }
            }).catch(error => {
              console.error('Error swapping goalkeepers:', error)
              showSnackbar('Failed to swap goalkeepers')
            })
            
          } else {
            // Regular goalkeeper assignment (field player becoming goalkeeper)
            console.log(`Assigning ${player.name} as goalkeeper for team ${newTeam}`)
            console.log(`Field player ${player.name} (${currentTeam}) becoming goalkeeper for ${newTeam}`)
            
            // Get the current goalkeeper for the target team (if any)
            const currentGoalkeeper = currentGameContext!.gameData.goalkeepers[newTeam === 'A' ? 'teamA' : 'teamB']
            
            console.log(`Goalkeeper replacement: ${player.name} (${currentTeam}) → goalkeeper for ${newTeam}, current goalkeeper: ${currentGoalkeeper?.name || 'None'}`)
            
            // Remove player from current field position (for both planned and active games)
            if (currentTeam === 'A') {
              const currentIndex = localTeamA.findIndex(p => p.id === player.id)
              if (currentIndex !== -1) {
                const newTeamA = [...localTeamA]
                newTeamA.splice(currentIndex, 1)
                
                // If there was a goalkeeper in the target team, add them to their original team's field
                if (currentGoalkeeper) {
                  if (newTeam === 'A') {
                    // Player from team A becomes goalkeeper for team A, old goalkeeper goes to team A field
                    newTeamA.push(currentGoalkeeper)
                    console.log(`Same-team goalkeeper assignment: ${player.name} becomes goalkeeper for team A, ${currentGoalkeeper.name} moves to team A field`)
                    updateTeamState(newTeamA, localTeamB)
                  } else {
                    // Player from team A becomes goalkeeper for team B, old goalkeeper goes to team B field
                    const newTeamB = [...localTeamB]
                    newTeamB.push(currentGoalkeeper)
                    console.log(`Cross-team goalkeeper assignment: ${player.name} (team A) becomes goalkeeper for team B, ${currentGoalkeeper.name} moves to team B field`)
                    updateTeamState(newTeamA, newTeamB)
                  }
                } else {
                  console.log(`No current goalkeeper to replace: ${player.name} becomes goalkeeper for team ${newTeam}`)
                  updateTeamState(newTeamA, localTeamB)
                }
              }
            } else {
              const currentIndex = localTeamB.findIndex(p => p.id === player.id)
              if (currentIndex !== -1) {
                const newTeamB = [...localTeamB]
                newTeamB.splice(currentIndex, 1)
                
                // If there was a goalkeeper in the target team, add them to their original team's field
                if (currentGoalkeeper) {
                  if (newTeam === 'B') {
                    // Player from team B becomes goalkeeper for team B, old goalkeeper goes to team B field
                    newTeamB.push(currentGoalkeeper)
                    console.log(`Same-team goalkeeper assignment: ${player.name} becomes goalkeeper for team B, ${currentGoalkeeper.name} moves to team B field`)
                    updateTeamState(localTeamA, newTeamB)
                  } else {
                    // Player from team B becomes goalkeeper for team A, old goalkeeper goes to team A field
                    const newTeamA = [...localTeamA]
                    newTeamA.push(currentGoalkeeper)
                    console.log(`Cross-team goalkeeper assignment: ${player.name} (team B) becomes goalkeeper for team A, ${currentGoalkeeper.name} moves to team A field`)
                    updateTeamState(newTeamA, newTeamB)
                  }
                } else {
                  console.log(`No current goalkeeper to replace: ${player.name} becomes goalkeeper for team ${newTeam}`)
                  updateTeamState(localTeamA, newTeamB)
                }
              }
            }

            // Update goalkeeper in currentGameContext for both planned and active games
            // This must be done AFTER updating the local state to ensure proper synchronization
            setCurrentGameContext(prev => {
              if (!prev) return prev
              return {
                ...prev,
                gameData: {
                  ...prev.gameData,
                  goalkeepers: {
                    ...prev.gameData.goalkeepers,
                    [newTeam === 'A' ? 'teamA' : 'teamB']: player
                  }
                }
              }
            })
            
            // Only remove goalkeeper from field positions if they were already a goalkeeper (for swaps)
            // Don't remove field players who are becoming goalkeepers
            if (isCurrentlyGoalkeeper) {
              const goalkeeperInTeamA = localTeamA.find(p => p.id === player.id)
              const goalkeeperInTeamB = localTeamB.find(p => p.id === player.id)
              
              if (goalkeeperInTeamA) {
                const newTeamA = localTeamA.filter(p => p.id !== player.id)
                setLocalTeamA(newTeamA)
              }
              if (goalkeeperInTeamB) {
                const newTeamB = localTeamB.filter(p => p.id !== player.id)
                setLocalTeamB(newTeamB)
              }
            }
            
            console.log(`Goalkeeper assignment completed: ${player.name} is now goalkeeper for team ${newTeam}`)
            console.log('Updated goalkeeper state:', {
              teamA: currentGameContext!.gameData.goalkeepers.teamA?.name,
              teamB: currentGameContext!.gameData.goalkeepers.teamB?.name,
              localTeamASize: localTeamA.length,
              localTeamBSize: localTeamB.length
            })
            console.log('Final state update - goalkeeper assignment should be visible now')

            // Assign goalkeeper
            assignGoalkeeper({
              matchId: currentGameContext!.matchId,
              playerId: player.id,
              team: newTeam
            }).then(assignResult => {
              if (assignResult.validationErrors || assignResult.serverError) {
                console.error('Failed to assign goalkeeper to database:', assignResult.validationErrors || assignResult.serverError)
                showSnackbar('Warning: Goalkeeper assignment may not be saved')
              } else {
                console.log(`Successfully assigned ${player.name} as goalkeeper for team ${newTeam}`)
                // For both planned and active games, we don't need to refresh since local state is already updated
                // The local state updates provide instant feedback for both game types
              }
            }).catch(error => {
              console.error('Error assigning goalkeeper:', error)
              showSnackbar('Failed to assign goalkeeper')
            })
          }
          
          return
        }
        
        console.log(`Moving player ${player.name} from team ${currentTeam} to team ${newTeam} at position ${newIndex}`)
        
        if (currentTeam === newTeam) {
          // Same team reordering (for both planned and active games)
          if (currentTeam === 'A') {
            const currentIndex = localTeamA.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamA = [...localTeamA]
              const originalLength = newTeamA.length
              newTeamA.splice(currentIndex, 1) // Remove from current position
              
              // For same-team moves, the newIndex is based on the original array (including the dragged player)
              // After removing the player, we need to adjust the index:
              let adjustedIndex = newIndex
              if (currentIndex < newIndex) {
                // Moving forward: normally subtract 1, but if moving to the actual last position, use array end
                if (newIndex === originalLength - 1) {
                  // Moving to the last position: insert at end of shortened array
                  adjustedIndex = newTeamA.length
                } else {
                  // Normal forward move: subtract 1 for the removed element
                  adjustedIndex = newIndex - 1
                }
              }
              
              newTeamA.splice(adjustedIndex, 0, player) // Insert at adjusted position
              
              console.log(`Reordered in Team A: ${player.name} from index ${currentIndex} to ${adjustedIndex} (requested: ${newIndex})`)
              updateTeamState(newTeamA, localTeamB)
            }
          } else {
            const currentIndex = localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...localTeamB]
              const originalLength = newTeamB.length
              newTeamB.splice(currentIndex, 1) // Remove from current position
              
              // For same-team moves, the newIndex is based on the original array (including the dragged player)
              // After removing the player, we need to adjust the index:
              let adjustedIndex = newIndex
              if (currentIndex < newIndex) {
                // Moving forward: normally subtract 1, but if moving to the actual last position, use array end
                if (newIndex === originalLength - 1) {
                  // Moving to the last position: insert at end of shortened array
                  adjustedIndex = newTeamB.length
                } else {
                  // Normal forward move: subtract 1 for the removed element
                  adjustedIndex = newIndex - 1
                }
              }
              
              newTeamB.splice(adjustedIndex, 0, player) // Insert at adjusted position
              
              console.log(`Reordered in Team B: ${player.name} from index ${currentIndex} to ${adjustedIndex} (requested: ${newIndex})`)
              updateTeamState(localTeamA, newTeamB)
            }
          }
          
          // For same-team reordering, we don't need to update the database since the order is maintained locally
          // The database doesn't store player order, so this is purely a UI optimization
          console.log(`Same-team reordering completed locally for ${player.name}`)
          
        } else {
          // Cross-team move - update locally first for snappy UI, then sync to database (for both planned and active games)
          console.log(`Cross-team move: ${player.name} from team ${currentTeam} to team ${newTeam} at position ${newIndex}`)
          
          // Update local state immediately for instant visual feedback
          if (currentTeam === 'A' && newTeam === 'B') {
            // Remove from Team A
            const currentIndex = localTeamA.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamA = [...localTeamA]
              newTeamA.splice(currentIndex, 1)
              
              // Add to Team B at specified position
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              
              updateTeamState(newTeamA, newTeamB)
              console.log(`Locally moved ${player.name} from Team A (index ${currentIndex}) to Team B (index ${newIndex})`)
            }
          } else if (currentTeam === 'B' && newTeam === 'A') {
            // Remove from Team B
            const currentIndex = localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...localTeamB]
              newTeamB.splice(currentIndex, 1)
              
              // Add to Team A at specified position
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              
              updateTeamState(newTeamA, newTeamB)
              console.log(`Locally moved ${player.name} from Team B (index ${currentIndex}) to Team A (index ${newIndex})`)
            }
          }
          
          // Update database in the background (don't await - let it happen async)
          updatePlayerTeam({
            matchId: currentGameContext!.matchId,
            playerId: player.id,
            newTeam: newTeam
          }).then(result => {
            if (result.validationErrors || result.serverError) {
              console.error('Failed to sync team change to database:', result.validationErrors || result.serverError)
              showSnackbar('Warning: Team change may not be saved')
            } else {
              console.log(`Successfully synced ${player.name} team change to database`)
            }
          }).catch(error => {
            console.error('Error syncing team change to database:', error)
            showSnackbar('Warning: Team change may not be saved')
          })
        }
        
        return
      }

      // If moving between teams without specific index, use the server operations
      const removeResult = await removePlayerFromMatch({
        matchId: currentGameContext!.matchId,
        playerId: player.id
      })

      if (removeResult.validationErrors || removeResult.serverError) {
        showSnackbar('Failed to remove player from current team')
        return
      }

      // Then add them to the new team
      const addResult = await addPlayerToMatch({
        matchId: currentGameContext!.matchId,
        playerId: player.id,
        team: newTeam,
        isGoalkeeper: false // Assuming we're not switching goalkeepers via drag and drop
      })

      if (addResult.validationErrors) {
        showSnackbar('Invalid input data')
        return
      }

      if (addResult.serverError) {
        showSnackbar(addResult.serverError)
        return
      }

      if (addResult.data) {
        // Refresh game data to get updated teams
        if (currentGameContext?.type === 'planned') {
          // Update the selected planned game data
          const updatedGameData = await convertPlannedGameToActiveGameData(currentGameContext.gameData.match)
          setCurrentGameContext({
            type: 'planned',
            gameData: updatedGameData,
            matchId: updatedGameData.match.id
          })
        } else {
          refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error in handleSwitchPlayerTeam:', error)
      showSnackbar('Failed to process player team switch')
    }
  }

  const handleClosePlayerSelect = () => {
    setShowPlayerSelect({ team: null, isGoalkeeper: false })
  }

  const handleSelectPlannedGame = async (game: Match) => {
    try {
      const gameData = await convertPlannedGameToActiveGameData(game)
      setCurrentGameContext({
        type: 'planned',
        gameData: gameData,
        matchId: game.id
      })
    } catch (error) {
      console.error('Error loading planned game:', error)
      showSnackbar('Failed to load planned game')
    }
  }

  const handleStartPlannedGame = async () => {
    if (!ensureCorrectMatch('Start planned game')) return

    console.log(`Starting planned game ${currentGameContext!.matchId.slice(0, 8)}...`)

    // Set flags to prevent context clearing during the start process
    setIsStartingGame(true)
    setStartingGameId(currentGameContext!.matchId)

    // Immediately update UI by changing the match status in local state
    const updatedGameData = {
      ...currentGameContext!.gameData,
      match: {
        ...currentGameContext!.gameData.match,
        match_status: 'active' as const,
        start_time: new Date().toISOString()
      }
    }
    setCurrentGameContext({
      type: 'active', // Change to active type immediately
      gameData: updatedGameData,
      matchId: currentGameContext!.matchId
    })

    console.log('Updated local context to active, now updating database in background...')

    // Clear the starting game flags immediately since UI is updated
    setIsStartingGame(false)
    setStartingGameId(null)

    // Update database in background (non-blocking)
    controlMatch({
      matchId: currentGameContext!.gameData.match.id,
      action: 'start'
    }).then(result => {
      if (result.validationErrors || result.serverError) {
        console.error('Database update failed:', result.validationErrors || result.serverError)
        showSnackbar('Warning: Game start may not be saved')
        // Don't revert UI - let the user continue and the error will be handled by the refetch interval
      } else {
        console.log('Database update successful')
      }
    }).catch(error => {
      console.error('Error starting game:', error)
      showSnackbar('Warning: Game start may not be saved')
      // Don't revert UI - let the user continue and the error will be handled by the refetch interval
    })
  }

  const handleBackToMatchesList = () => {
    setCurrentGameContext(null) // Clear current game context
    setUserRequestedMatchesList(true)
    setShowMatchesList(true)
    
    // Refresh game data to ensure matches list shows latest state
    // This is especially important after starting a game or making other changes
    refreshGameData()
  }

  const handleSelectGame = async (game: Match) => {
    try {
      console.log(`Selecting game: ${game.id.slice(0, 8)}... (${game.match_status})`)
      setUserRequestedMatchesList(false) // Reset the flag when selecting a game
      
      // Clear ending game flag if user selects a different game
      if (isEndingGame) {
        console.log('handleSelectGame: Clearing ending game flag due to new game selection')
        setIsEndingGame(false)
      }
      
      // Set the selected game ID to trigger the targeted query
      setSelectedGameId(game.id)
      
      // Convert any game to ActiveGameData format, regardless of status
      const gameData = await convertPlannedGameToActiveGameData(game)
      
      // Set the appropriate context type based on game status
      const contextType = (game.match_status === 'active' || game.match_status === 'paused') ? 'active' : 'planned'
      
      console.log(`Setting game context to ${contextType} for game ${game.id.slice(0, 8)}...`)
      
      setCurrentGameContext({
        type: contextType,
        gameData: gameData,
        matchId: game.id
      })
      setShowMatchesList(false)
      
    } catch (error) {
      console.error('Error loading game:', error)
      showSnackbar('Failed to load game')
    }
  }

  const handleCreateNewGame = async () => {
    setIsCreatingGame(true)
    try {
      // Clear ending game flag if user creates a new game
      if (isEndingGame) {
        console.log('handleCreateNewGame: Clearing ending game flag due to new game creation')
        setIsEndingGame(false)
      }
      
      const result = await createMatch({})
      
      if (result.validationErrors) {
        showSnackbar('Invalid input data', 4000)
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError, 4000)
        return
      }

      if (result.data) {
        showSnackbar('New game created successfully!', 3000)
        // Refresh data to get the new game
        refreshGameData()
      }
    } catch (error) {
      showSnackbar('Failed to create game', 4000)
    } finally {
      setIsCreatingGame(false)
    }
  }

  // Helper function to update both local state and currentGameContext
  const updateTeamState = (newTeamA: Player[], newTeamB: Player[]) => {
    setLocalTeamA(newTeamA)
    setLocalTeamB(newTeamB)
    
    // Update currentGameContext for both planned and active games
    if (currentGameContext) {
      setCurrentGameContext({
        ...currentGameContext,
        gameData: {
          ...currentGameContext.gameData,
          teamA: newTeamA,
          teamB: newTeamB
        }
      })
    }
  }



  // Get available players for selection
  const availablePlayersForSelection = currentGameContext 
    ? getAvailablePlayersForSelection(queryAvailablePlayers, currentGameContext.gameData.teamA, currentGameContext.gameData.teamB, currentGameContext.gameData.goalkeepers)
    : queryAvailablePlayers

  // Show loading state only if we don't have any data to display
  // This prevents showing loading skeleton when we already have a game to display
  const shouldShowLoading = (playersLoading && queryAvailablePlayers.length === 0) || 
                           (gameLoading && !activeGame && !currentGameContext) ||
                           (allGamesLoading && queryAllGames.length === 0)
  
  if (shouldShowLoading) {
    return <GameLoadingSkeleton />
  }

  // Show selected planned game
  if (currentGameContext?.type === 'planned') {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        
        {/* Back button */}
        <div className="max-w-6xl mx-auto p-6 pb-0">
          <button
            onClick={handleBackToMatchesList}
            className={`mb-4 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            ← Back to Matches
          </button>
        </div>
        
        <ActiveGame
          activeGame={{
            ...currentGameContext.gameData,
            teamA: getCurrentTeamData().teamA,
            teamB: getCurrentTeamData().teamB
          }}
          timer={null} // No timer for planned games
          teamAScore={getTeamScore(currentGameContext.gameData.scores, 'A')}
          teamBScore={getTeamScore(currentGameContext.gameData.scores, 'B')}
          isDarkMode={isDarkMode}
          isSidesSwapped={isSidesSwapped}
          matchStatus={currentGameContext.gameData.match.match_status}
          onScoreIncrement={handleScoreIncrement}
          onPauseToggle={handlePauseToggle}
          onEndMatch={handleEndMatch}
          onStartMatch={handleStartPlannedGame}
          onEndMatchAndCreateNew={handleEndMatchAndCreateNew}
          onSwapSides={handleSwapSides}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onSwitchPlayerTeam={handleSwitchPlayerTeam}
          onVestToggle={handleVestToggle}
        />

        {/* Player Selection Modal */}
        <PlayerSelectModal
          showPlayerSelect={showPlayerSelect}
          availablePlayers={availablePlayersForSelection}
          isDarkMode={isDarkMode}
          onPlayerSelect={handlePlayerSelect}
          onClose={handleClosePlayerSelect}
        />

        {/* Goal Dialog */}
        <GoalDialog
          goalDialog={goalDialog}
          activeGame={currentGameContext.gameData}
          isDarkMode={isDarkMode}
          onPlayerClick={handleGoalDialogPlayerClick}
          onSubmit={handleGoalDialogSubmit}
          onCancel={handleGoalDialogCancel}
          onRemoveSelectedPlayer={removeSelectedPlayer}
        />

        {/* Snackbar */}
        <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
      </div>
    )
  }

  // Show matches list view
  if (showMatchesList) {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        <MatchesList 
          activeGame={activeGame || null}
          allGames={queryAllGames}
          isDarkMode={isDarkMode}
          onSelectGame={handleSelectGame}
          onCreateNewGame={handleCreateNewGame}
          isCreatingGame={isCreatingGame}
        />
        <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
      </div>
    )
  }

  // Show selected active game view
  if (currentGameContext?.type === 'active') {
    const displayGame = currentGameContext.gameData

    return (
      <div 
        className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        
        {/* Back button for active game view */}
        <div className="max-w-6xl mx-auto p-6 pb-0">
          <button
            onClick={handleBackToMatchesList}
            className={`mb-4 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            ← Back to Matches
          </button>
        </div>
        
        <ActiveGame
          activeGame={{
            ...displayGame,
            teamA: getCurrentTeamData().teamA,
            teamB: getCurrentTeamData().teamB
          }}
          timer={timer}
          teamAScore={teamAScore}
          teamBScore={teamBScore}
          isDarkMode={isDarkMode}
          isSidesSwapped={isSidesSwapped}
          matchStatus={displayGame.match.match_status}
          onScoreIncrement={handleScoreIncrement}
          onPauseToggle={handlePauseToggle}
          onEndMatch={handleEndMatch}
          onEndMatchAndCreateNew={handleEndMatchAndCreateNew}
          onSwapSides={handleSwapSides}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onSwitchPlayerTeam={handleSwitchPlayerTeam}
          onVestToggle={handleVestToggle}
        />

        {/* Player Selection Modal */}
        <PlayerSelectModal
          showPlayerSelect={showPlayerSelect}
          availablePlayers={availablePlayersForSelection}
          isDarkMode={isDarkMode}
          onPlayerSelect={handlePlayerSelect}
          onClose={handleClosePlayerSelect}
        />

        {/* Goal Dialog */}
        <GoalDialog
          goalDialog={goalDialog}
          activeGame={displayGame}
          isDarkMode={isDarkMode}
          onPlayerClick={handleGoalDialogPlayerClick}
          onSubmit={handleGoalDialogSubmit}
          onCancel={handleGoalDialogCancel}
          onRemoveSelectedPlayer={removeSelectedPlayer}
        />

        {/* Snackbar */}
        <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
      </div>
    )
  }

  // If no specific game is selected, show loading or fallback
  return <GameLoadingSkeleton />
} 
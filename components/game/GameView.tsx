'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameState } from '../../lib/hooks/useGameState'
import { useGameActions } from '../../lib/hooks/useGameActions'
import { useSnackbar } from '../../lib/hooks/useSnackbar'
import { useDarkMode } from '../../lib/hooks/useDarkMode'
import { useAuth } from '../../lib/auth-context'
import { GameLayout } from './GameLayout'
import { PlannedGameView } from './PlannedGameView'
import { ActiveGameView } from './ActiveGameView'
import { MatchesListView } from './MatchesListView'
import { NoActiveGame } from '../NoActiveGame'
import { GameLoadingSkeleton } from '../ui/loading-skeleton'

interface GameViewProps {
  initialActiveGame: any // We'll use React Query instead
  availablePlayers: any[] // This will be replaced by React Query
  allGames: any[] // This will be replaced by React Query
}

export function GameView({ initialActiveGame, availablePlayers, allGames }: GameViewProps) {
  
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  
  // Auth state
  const { user, player, loading: authLoading } = useAuth()
  const isAuthenticated = user && player
  
  // Game state management
  const gameState = useGameState()
  
  // Snackbar management
  const { snackbar } = useSnackbar()
  
  // Game actions
  const actions = useGameActions(gameState, gameState.timer)

  // Add a timeout fallback to prevent infinite loading - reduced timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [isTabVisible, setIsTabVisible] = useState(true)

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Simplified loading logic - only show loading for essential data
  const shouldShowLoading = authLoading || 
                           (!gameState.hasInitialized && (gameState.gameLoading || gameState.playersLoading))

  // Debug logging - only log when state actually changes
  
  useEffect(() => {
    // Don't start timeout if tab is not visible
    if (!isTabVisible) {
      return
    }

    if (shouldShowLoading && !loadingTimeout) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing display')
        setLoadingTimeout(true)
      }, 3000) // Further reduced to 3 second timeout
      
      return () => clearTimeout(timeout)
    } else if (!shouldShowLoading) {
      setLoadingTimeout(false)
    }
  }, [shouldShowLoading, loadingTimeout, isTabVisible])
  
  // Force display if tab becomes visible and we're still loading
  useEffect(() => {
    if (isTabVisible && shouldShowLoading && loadingTimeout) {
      setLoadingTimeout(false)
    }
  }, [isTabVisible, shouldShowLoading, loadingTimeout])
  
  if (shouldShowLoading && !loadingTimeout) {
    return <GameLoadingSkeleton />
  }

  // Show no active game view (handles both authenticated and anonymous users)
  if (!gameState.activeGame && !gameState.currentGameContext && !gameState.showMatchesList) {
    return <NoActiveGame isDarkMode={isDarkMode} onCreateNewGame={actions.handleCreateNewGame} />
  }

  // Show selected planned game
  if (gameState.currentGameContext?.type === 'planned') {
    return (
      <GameLayout 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={toggleDarkMode}
        showBackButton={true}
        onBackClick={actions.handleBackToMatchesList}
      >
        <PlannedGameView
          gameData={gameState.currentGameContext.gameData}
          currentTeamData={gameState.currentTeamData}
          isDarkMode={isDarkMode}
          isSidesSwapped={gameState.isSidesSwapped}
          actions={actions}
          snackbar={snackbar}
        />
      </GameLayout>
    )
  }

  // Show matches list view
  if (gameState.showMatchesList) {
    return (
      <GameLayout 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={toggleDarkMode}
      >
        <MatchesListView
          activeGame={gameState.activeGame}
          allGames={gameState.allGames}
          isDarkMode={isDarkMode}
          isCreatingGame={gameState.isCreatingGame}
          actions={actions}
          snackbar={snackbar}
        />
      </GameLayout>
    )
  }

  // Show selected active game view
  if (gameState.currentGameContext?.type === 'active') {
    return (
      <GameLayout 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={toggleDarkMode}
        showBackButton={true}
        onBackClick={actions.handleBackToMatchesList}
      >
        <ActiveGameView
          gameData={gameState.currentGameContext.gameData}
          currentTeamData={gameState.currentTeamData}
          isDarkMode={isDarkMode}
          isSidesSwapped={gameState.isSidesSwapped}
          actions={actions}
          snackbar={snackbar}
          timer={gameState.timer}
          teamAScore={gameState.teamAScore}
          teamBScore={gameState.teamBScore}
        />
      </GameLayout>
    )
  }

  // Fallback - should not reach here
  return <GameLoadingSkeleton />
} 
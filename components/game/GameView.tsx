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
  const { snackbar, showSnackbar } = useSnackbar()
  
  // Game actions
  const actions = useGameActions(gameState, showSnackbar)

  // Add a timeout fallback to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Show loading state if auth is loading or we're still loading essential data
  const shouldShowLoading = authLoading || 
                           (gameState.playersLoading && gameState.availablePlayers.length === 0) || 
                           (gameState.gameLoading && !gameState.hasInitialized) ||
                           (gameState.allGamesLoading && gameState.allGames.length === 0)

  // Debug logging - only log when state actually changes
  const debugLog = useCallback(() => {
    console.log('GameView loading state:', {
      authLoading,
      playersLoading: gameState.playersLoading,
      gameLoading: gameState.gameLoading,
      allGamesLoading: gameState.allGamesLoading,
      hasInitialized: gameState.hasInitialized,
      activeGame: !!gameState.activeGame,
      availablePlayersCount: gameState.availablePlayers.length,
      allGamesCount: gameState.allGames.length,
      shouldShowLoading,
      loadingTimeout
    })
  }, [authLoading, gameState.playersLoading, gameState.gameLoading, gameState.allGamesLoading, gameState.hasInitialized, gameState.activeGame, gameState.availablePlayers.length, gameState.allGames.length, shouldShowLoading, loadingTimeout])
  
  useEffect(() => {
    // Only log in development and when there are significant changes
    if (process.env.NODE_ENV === 'development') {
      debugLog()
    }
  }, [debugLog])
  
  useEffect(() => {
    if (shouldShowLoading && !loadingTimeout) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing display')
        setLoadingTimeout(true)
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    } else if (!shouldShowLoading) {
      setLoadingTimeout(false)
    }
  }, [shouldShowLoading, loadingTimeout])
  
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
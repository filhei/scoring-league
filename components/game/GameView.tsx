'use client'

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
  // Global dark mode state
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  
  // Auth state
  const { user, player, loading: authLoading } = useAuth()
  
  // Game state management
  const gameState = useGameState()
  
  // Snackbar management
  const { snackbar, showSnackbar } = useSnackbar()
  
  // Game actions
  const actions = useGameActions(gameState, showSnackbar)

  // Show loading state if auth is loading or we don't have any data to display
  const shouldShowLoading = authLoading || 
                           (gameState.playersLoading && gameState.availablePlayers.length === 0) || 
                           (gameState.gameLoading && !gameState.activeGame && !gameState.currentGameContext) ||
                           (gameState.allGamesLoading && gameState.allGames.length === 0)
  
  if (shouldShowLoading) {
    return <GameLoadingSkeleton />
  }

  // Show login prompt if user is not authenticated
  if (!user || !player) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className={`rounded-2xl p-8 transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="text-center">
            <div className={`text-6xl mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`}>
              🔐
            </div>
            <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Authentication Required
            </h2>
            <p className={`text-lg mb-8 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Please sign in to create and manage games.
            </p>
            <a
              href="/login"
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 inline-block ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } hover:scale-105 active:scale-95`}
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    )
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

  // Show NoActiveGame when there's no active game and no matches list (only for authenticated users)
  return (
    <NoActiveGame 
      isDarkMode={isDarkMode} 
      onCreateNewGame={actions.handleCreateNewGame}
    />
  )
} 
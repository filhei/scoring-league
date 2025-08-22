'use client'

import { MatchesList } from '../MatchesList'
import { Snackbar } from '../Snackbar'
import type { Match, ActiveGameData } from '../../lib/types'
import type { GameActions } from '../../lib/hooks/useGameActions'

interface MatchesListViewProps {
  activeGame: ActiveGameData | null
  allGames: Match[]
  isDarkMode: boolean
  isCreatingGame: boolean
  actions: GameActions
  snackbar: { isVisible: boolean; message: string }
}

export function MatchesListView({
  activeGame,
  allGames,
  isDarkMode,
  isCreatingGame,
  actions,
  snackbar
}: MatchesListViewProps) {
  return (
    <>
      <MatchesList 
        activeGame={activeGame}
        allGames={allGames}
        isDarkMode={isDarkMode}
        onSelectGame={actions.handleSelectGame}
        onCreateNewGame={actions.handleCreateNewGame}
        isCreatingGame={isCreatingGame}
      />
      <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
    </>
  )
} 
'use client'

import { ActiveGame } from '../ActiveGame'
import { PlayerSelectModal } from '../PlayerSelectModal'
import { GoalDialog } from '../GoalDialog'
import { Snackbar } from '../Snackbar'
import { getTeamScore } from '../../lib/game-utils'
import type { ActiveGameData, Player } from '../../lib/types'
import type { GameActions } from '../../lib/hooks/useGameActions'

interface ActiveGameViewProps {
  gameData: ActiveGameData
  currentTeamData: { teamA: Player[], teamB: Player[] }
  isDarkMode: boolean
  isSidesSwapped: boolean
  actions: GameActions
  snackbar: { isVisible: boolean; message: string }
  timer: any // Timer from useMatchTimer
  teamAScore: number
  teamBScore: number
}

export function ActiveGameView({
  gameData,
  currentTeamData,
  isDarkMode,
  isSidesSwapped,
  actions,
  snackbar,
  timer,
  teamAScore,
  teamBScore
}: ActiveGameViewProps) {
  return (
    <>
      <ActiveGame
        activeGame={{
          ...gameData,
          teamA: currentTeamData.teamA,
          teamB: currentTeamData.teamB
        }}
        timer={timer}
        teamAScore={teamAScore}
        teamBScore={teamBScore}
        isDarkMode={isDarkMode}
        isSidesSwapped={isSidesSwapped}
        matchStatus={gameData.match.match_status}
        onScoreIncrement={actions.handleScoreIncrement}
        onPauseToggle={actions.handlePauseToggle}
        onEndMatch={actions.handleEndMatch}
        onEndMatchAndCreateNew={actions.handleEndMatchAndCreateNew}
        onSwapSides={actions.handleSwapSides}
        onAddPlayer={actions.handleAddPlayer}
        onRemovePlayer={actions.handleRemovePlayer}
        onSwitchPlayerTeam={actions.handleSwitchPlayerTeam}
        onVestToggle={actions.handleVestToggle}
        onDeleteGame={actions.handleDeleteGame}
        onResetGame={actions.handleResetGame}
      />

      {/* Player Selection Modal */}
      <PlayerSelectModal
        showPlayerSelect={actions.showPlayerSelect}
        availablePlayers={actions.availablePlayersForSelection}
        isDarkMode={isDarkMode}
        onPlayerSelect={actions.handlePlayerSelect}
        onClose={actions.handleClosePlayerSelect}
      />

      {/* Goal Dialog */}
      <GoalDialog
        goalDialog={actions.goalDialog}
        activeGame={gameData}
        isDarkMode={isDarkMode}
        onPlayerClick={actions.handleGoalDialogPlayerClick}
        onSubmit={actions.handleGoalDialogSubmit}
        onCancel={actions.handleGoalDialogCancel}
        onRemoveSelectedPlayer={actions.removeSelectedPlayer}
      />

      {/* Snackbar */}
      <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
    </>
  )
} 
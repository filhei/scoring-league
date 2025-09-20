'use client'

import { ActiveGame } from '../ActiveGame'
import { PlayerSelectModal } from '../PlayerSelectModal'
import { GoalDialog } from '../GoalDialog'
import { LoadingOverlay } from '../ui/LoadingOverlay'
import { Snackbar } from '../Snackbar'
import { getTeamScore } from '../../lib/game-utils'
import type { ActiveGameData, Player } from '../../lib/types'
import type { GameActions } from '../../lib/hooks/useGameActions'

interface PlannedGameViewProps {
  gameData: ActiveGameData
  currentTeamData: { teamA: Player[], teamB: Player[] }
  isDarkMode: boolean
  isSidesSwapped: boolean
  actions: GameActions
  snackbar: { isVisible: boolean; message: string }
}

export function PlannedGameView({
  gameData,
  currentTeamData,
  isDarkMode,
  isSidesSwapped,
  actions,
  snackbar
}: PlannedGameViewProps) {
  return (
    <>
      <ActiveGame
        activeGame={{
          ...gameData,
          teamA: currentTeamData.teamA,
          teamB: currentTeamData.teamB
        }}
        timer={null} // No timer for planned games
        teamAScore={getTeamScore(gameData.scores, 'A')}
        teamBScore={getTeamScore(gameData.scores, 'B')}
        isDarkMode={isDarkMode}
        isSidesSwapped={isSidesSwapped}
        matchStatus={gameData.match.match_status}
        onScoreIncrement={actions.handleScoreIncrement}
        onPauseToggle={actions.handlePauseToggle}
        onEndMatch={actions.handleEndMatch}
        onStartMatch={actions.handleStartPlannedGame}
        onEndMatchAndCreateNew={actions.handleEndMatchAndCreateNew}
        onSwapSides={actions.handleSwapSides}
        onSwapGoalkeepers={actions.handleSwapGoalkeepers}
        onSwapFieldPlayers={actions.handleSwapFieldPlayers}
        onAddPlayer={actions.handleAddPlayer}
        onRemovePlayer={actions.handleRemovePlayer}
        onSwitchPlayerTeam={actions.handleSwitchPlayerTeam}
        onVestToggle={actions.handleVestToggle}
        onDeleteGame={actions.handleDeleteGame}
        onResetGame={actions.handleResetGame}
        onFillFromAttendees={actions.handleFillFromAttendees}
        onRandomizeTeams={actions.handleRandomizeTeams}
        isAuthenticated={actions.isAuthenticated}
        isPauseToggleBusy={actions.isPauseToggleBusy}
        isFillFromAttendeesLoading={actions.isFillFromAttendeesLoading}
        isRandomizeTeamsLoading={actions.isRandomizeTeamsLoading}
      />

      {/* Player Selection Modal */}
      <PlayerSelectModal
        showPlayerSelect={actions.showPlayerSelect}
        availablePlayers={actions.availablePlayersForSelection}
        isDarkMode={isDarkMode}
        onPlayerSelect={actions.handlePlayerSelect}
        onMultiPlayerSelect={actions.handleMultiPlayerSelect}
        onClose={actions.handleClosePlayerSelect}
        currentTeamA={currentTeamData.teamA}
        currentTeamB={currentTeamData.teamB}
        goalkeepers={gameData.goalkeepers}
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

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={actions.isFillFromAttendeesLoading || actions.isRandomizeTeamsLoading}
        message={actions.isFillFromAttendeesLoading ? "Fyller match från Bokat.se..." : "Slumpar lag..."}
        isDarkMode={isDarkMode}
      />
    </>
  )
} 
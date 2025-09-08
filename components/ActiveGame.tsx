import React, { useRef } from 'react'
import type { ActiveGameData, Player } from '../lib/types'
import type { UseMatchTimerReturn } from '../lib/hooks/useMatchTimer'
import { useDragAndDrop } from '../lib/hooks/useDragAndDrop'
import { DragImage, TeamDisplay, GameControls, GameSettingsDropdown } from './game'

interface ActiveGameProps {
  activeGame: ActiveGameData
  timer?: UseMatchTimerReturn | null
  teamAScore: number
  teamBScore: number
  isDarkMode: boolean
  isSidesSwapped: boolean
  matchStatus?: string
  onScoreIncrement: (team: 'A' | 'B') => void
  onPauseToggle: () => void
  onEndMatch: () => void
  onStartMatch?: () => void
  onEndMatchAndCreateNew?: () => void
  onSwapSides: () => void
  onSwapGoalkeepers?: () => void
  onAddPlayer: (team: 'A' | 'B', isGoalkeeper?: boolean) => void
  onRemovePlayer: (player: Player) => void
  onSwitchPlayerTeam: (player: Player, newTeam: 'A' | 'B', newIndex?: number) => void
  onVestToggle: (team: 'A' | 'B') => void
  onDeleteGame?: () => void
  onResetGame?: () => void
  isAuthenticated?: boolean
  isPauseToggleBusy?: boolean
}

export function ActiveGame({
  activeGame,
  timer,
  teamAScore,
  teamBScore,
  isDarkMode,
  isSidesSwapped,
  matchStatus,
  onScoreIncrement,
  onPauseToggle,
  onEndMatch,
  onStartMatch,
  onEndMatchAndCreateNew,
  onSwapSides,
  onSwapGoalkeepers,
  onAddPlayer,
  onRemovePlayer,
  onSwitchPlayerTeam,
  onVestToggle,
  onDeleteGame,
  onResetGame,
  isAuthenticated = true,
  isPauseToggleBusy = false
}: ActiveGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Use the drag and drop hook
  const {
    dragState,
    isDragging,
    dragImagePosition,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({ onSwitchPlayerTeam })

  // Determine display order based on swap state
  const leftTeam = isSidesSwapped ? 'B' : 'A'
  const rightTeam = isSidesSwapped ? 'A' : 'B'
  const leftScore = isSidesSwapped ? teamBScore : teamAScore
  const rightScore = isSidesSwapped ? teamAScore : teamBScore
  const leftPlayers = isSidesSwapped ? activeGame.teamB : activeGame.teamA
  const rightPlayers = isSidesSwapped ? activeGame.teamA : activeGame.teamB
  const leftGoalkeeper = isSidesSwapped ? activeGame.goalkeepers.teamB : activeGame.goalkeepers.teamA
  const rightGoalkeeper = isSidesSwapped ? activeGame.goalkeepers.teamA : activeGame.goalkeepers.teamB

  // Get players for a specific team (excluding goalkeeper)
  const getTeamPlayers = (team: 'A' | 'B') => {
    const players = team === leftTeam ? leftPlayers : rightPlayers
    const goalkeeper = team === leftTeam ? leftGoalkeeper : rightGoalkeeper
    return players.filter(p => p.id !== goalkeeper?.id)
  }

  // Enhanced drag start handler that includes team information
  const handlePlayerDragStart = (e: React.DragEvent, player: Player) => {
    const leftTeamPlayers = getTeamPlayers(leftTeam)
    const rightTeamPlayers = getTeamPlayers(rightTeam)
    handleDragStart(e, player, leftTeam, rightTeam, leftTeamPlayers, rightTeamPlayers, leftGoalkeeper, rightGoalkeeper)
  }

  // Enhanced drag over handler that includes team information
  const handlePlayerDragOver = (e: React.DragEvent, team: 'A' | 'B', players: Player[]) => {
    handleDragOver(e, team, players)
  }

  return (
    <div className="sm:max-w-6xl sm:mx-auto sm:p-6 p-4" ref={containerRef}>
      {/* Custom Drag Image */}
      <DragImage
        isVisible={!!dragState}
        player={dragState?.player || null}
        position={dragImagePosition}
        isDarkMode={isDarkMode}
        scores={activeGame.scores}
      />

      {/* Active Game Pane */}
      <div className={`sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 transition-colors duration-300 ${
        isDarkMode
          ? 'sm:bg-gray-800 sm:border sm:border-gray-700'
          : 'sm:bg-gray-50 sm:border sm:border-gray-200'
      }`}>
        {/* Title */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl md:text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {matchStatus === 'planned' ? 'Planerad match' : 'Aktiv match'}
              <span className="text-xs md:text-sm font-normal ml-2 opacity-60">
                (# {activeGame.match.gameCount || 'N/A'})
              </span>
            </h2>
          </div>
          {isAuthenticated && (
            <GameSettingsDropdown
              isDarkMode={isDarkMode}
              onDeleteGame={onDeleteGame}
              onResetGame={onResetGame}
              onSwapSides={onSwapSides}
              onSwapGoalkeepers={onSwapGoalkeepers}
              matchStatus={matchStatus || activeGame.match.match_status}
            />
          )}
        </div>

        {/* Game Controls */}
        <GameControls
          timer={timer}
          leftScore={leftScore}
          rightScore={rightScore}
          leftTeam={leftTeam}
          rightTeam={rightTeam}
          isDarkMode={isDarkMode}
          teamWithVests={activeGame.match.team_with_vests as 'A' | 'B' | null}
          matchStatus={matchStatus || activeGame.match.match_status}
          scores={activeGame.scores}
          teamAPlayers={activeGame.teamA}
          teamBPlayers={activeGame.teamB}
          goalkeepers={activeGame.goalkeepers}
          onScoreIncrement={onScoreIncrement}
          onPauseToggle={onPauseToggle}
          onEndMatch={onEndMatch}
          onStartMatch={onStartMatch}
          onEndMatchAndCreateNew={onEndMatchAndCreateNew}
          onSwapSides={onSwapSides}
          onVestToggle={onVestToggle}
          isAuthenticated={isAuthenticated}
          isPauseToggleBusy={isPauseToggleBusy}
        />

        {/* Teams Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Left Team */}
          <TeamDisplay
            team={leftTeam}
            players={getTeamPlayers(leftTeam)}
            goalkeeper={leftGoalkeeper}
            isDarkMode={isDarkMode}
            scores={activeGame.scores}
            dragState={dragState}
            onDragOver={handlePlayerDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragStart={handlePlayerDragStart}
            onDragEnd={handleDragEnd}
            onAddPlayer={onAddPlayer}
            onRemovePlayer={onRemovePlayer}
            matchStatus={matchStatus}
            isAuthenticated={isAuthenticated}
            teamWithVests={activeGame.match.team_with_vests as 'A' | 'B' | null}
            onVestToggle={onVestToggle}
          />

          {/* Right Team */}
          <TeamDisplay
            team={rightTeam}
            players={getTeamPlayers(rightTeam)}
            goalkeeper={rightGoalkeeper}
            isDarkMode={isDarkMode}
            scores={activeGame.scores}
            dragState={dragState}
            onDragOver={handlePlayerDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragStart={handlePlayerDragStart}
            onDragEnd={handleDragEnd}
            onAddPlayer={onAddPlayer}
            onRemovePlayer={onRemovePlayer}
            matchStatus={matchStatus}
            isAuthenticated={isAuthenticated}
            teamWithVests={activeGame.match.team_with_vests as 'A' | 'B' | null}
            onVestToggle={onVestToggle}
          />
        </div>
      </div>
    </div>
  )
} 
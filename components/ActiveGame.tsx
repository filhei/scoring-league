import React, { useRef } from 'react'
import type { ActiveGameData, Player } from '../lib/types'
import type { UseMatchTimerReturn } from '../lib/hooks/useMatchTimer'
import { useDragAndDrop } from '../lib/hooks/useDragAndDrop'
import { DragImage, TeamDisplay, GameControls } from './game'

interface ActiveGameProps {
  activeGame: ActiveGameData
  timer: UseMatchTimerReturn
  teamAScore: number
  teamBScore: number
  isDarkMode: boolean
  isSidesSwapped: boolean
  onScoreIncrement: (team: 'A' | 'B') => void
  onPauseToggle: () => void
  onEndMatch: () => void
  onSwapSides: () => void
  onAddPlayer: (team: 'A' | 'B', isGoalkeeper?: boolean) => void
  onRemovePlayer: (player: Player) => void
  onSwitchPlayerTeam: (player: Player, newTeam: 'A' | 'B', newIndex?: number) => void
  onVestToggle: (team: 'A' | 'B') => void
}

export function ActiveGame({
  activeGame,
  timer,
  teamAScore,
  teamBScore,
  isDarkMode,
  isSidesSwapped,
  onScoreIncrement,
  onPauseToggle,
  onEndMatch,
  onSwapSides,
  onAddPlayer,
  onRemovePlayer,
  onSwitchPlayerTeam,
  onVestToggle
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
    <div className="max-w-6xl mx-auto p-6" ref={containerRef}>
      {/* Custom Drag Image */}
      <DragImage
        isVisible={!!dragState}
        player={dragState?.player || null}
        position={dragImagePosition}
        isDarkMode={isDarkMode}
        scores={activeGame.scores}
      />

      {/* Active Game Pane */}
      <div className={`rounded-2xl p-8 mb-8 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        {/* Title */}
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Active Game
          </h2>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
            }`}
          >
            ⚙️ Edit
          </button>
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
          onScoreIncrement={onScoreIncrement}
          onPauseToggle={onPauseToggle}
          onEndMatch={onEndMatch}
          onSwapSides={onSwapSides}
          onVestToggle={onVestToggle}
        />

        {/* Teams Display */}
        <div className="grid grid-cols-2 gap-6">
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
          />
        </div>
      </div>
    </div>
  )
} 
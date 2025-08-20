import React from 'react'
import type { Player } from '../../lib/types'
import { PlayerTile } from './PlayerTile'
import { GoalkeeperTile } from './GoalkeeperTile'
import { DropPlaceholder } from './DropPlaceholder'
import type { DragState } from '../../lib/hooks/useDragAndDrop'

interface TeamDisplayProps {
  team: 'A' | 'B'
  players: Player[]
  goalkeeper: Player | null
  isDarkMode: boolean
  scores: any[] // Add scores parameter
  dragState: DragState | null
  onDragOver: (e: React.DragEvent, team: 'A' | 'B', players: Player[]) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, team: 'A' | 'B') => void
  onDragStart: (e: React.DragEvent, player: Player) => void
  onDragEnd: (e: React.DragEvent) => void
  onAddPlayer: (team: 'A' | 'B', isGoalkeeper?: boolean) => void
  onRemovePlayer: (player: Player) => void
}

export function TeamDisplay({
  team,
  players,
  goalkeeper,
  isDarkMode,
  scores,
  dragState,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onAddPlayer,
  onRemovePlayer
}: TeamDisplayProps) {
  const isDragging = !!dragState

  // Debug log to track team rendering
  React.useEffect(() => {
    console.log(`TeamDisplay: Rendering team ${team} with ${players.length} players, goalkeeper: ${goalkeeper?.name || 'none'}`)
  }, [team, players.length, goalkeeper?.name])

  // Render drop placeholder for a specific position
  const renderDropPlaceholder = (index: number) => {
    if (!dragState || dragState.currentTeam !== team || dragState.currentIndex !== index) {
      return null
    }

    const placeholderKey = index === -1 ? `goalkeeper-placeholder-${team}` : `drop-placeholder-${team}-${index}`
    const placeholderText = index === -1 ? `Make ${dragState.player.name} goalkeeper` : `Drop ${dragState.player.name} here`

    return (
      <div
        key={placeholderKey}
        data-drop-placeholder
        className="h-12 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200"
        style={{
          borderColor: 'var(--accent-blue)',
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          margin: '4px 0'
        }}
      >
        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          {placeholderText}
        </span>
      </div>
    )
  }

  // Render team players with drop placeholders
  const renderTeamPlayers = () => {
    const elements: React.ReactElement[] = []

    // Add goalkeeper first (no separate placeholder needed)
    const isGoalkeeperDragTarget = dragState?.currentTeam === team && dragState.currentIndex === -1
    elements.push(
      <GoalkeeperTile
        key="goalkeeper"
        goalkeeper={goalkeeper}
        team={team}
        isDarkMode={isDarkMode}
        scores={scores}
        onAddPlayer={onAddPlayer}
        onRemovePlayer={onRemovePlayer}
        onDragOver={(e) => onDragOver(e, team, players)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, team)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        isDragTarget={isGoalkeeperDragTarget}
        draggedPlayerName={dragState?.player.name}
        isDragging={isDragging}
        dragState={dragState}
      />
    )

    // Add field players with potential drop placeholders
    for (let i = 0; i <= players.length; i++) {
      // Show drop placeholder before this position if needed
      if (dragState?.currentTeam === team && dragState.currentIndex === i) {
        const placeholder = renderDropPlaceholder(i)
        if (placeholder) elements.push(placeholder)
      }

      // Show player tile (if this position has a player)
      if (i < players.length) {
        elements.push(
          <PlayerTile
            key={players[i].id}
            player={players[i]}
            team={team}
            index={i}
            isGoalkeeper={false}
            isDarkMode={isDarkMode}
            isDragging={isDragging}
            dragState={dragState}
            scores={scores}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onRemovePlayer={onRemovePlayer}
          />
        )
      }
    }

    return elements
  }

  return (
    <div 
      data-team-container
      data-team={team}
      className="space-y-2"
      onDragOver={(e) => onDragOver(e, team, players)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, team)}
    >
      {renderTeamPlayers()}
      
      {/* Add Player Button */}
      <button 
        onClick={() => onAddPlayer(team, false)}
        className="w-full px-4 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
        style={{
          borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
          color: isDarkMode ? '#9ca3af' : '#6b7280'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue)'
          e.currentTarget.style.color = 'var(--accent-blue)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'
          e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280'
        }}
      >
        + Add Player
      </button>
    </div>
  )
} 
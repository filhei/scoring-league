import React from 'react'
import type { Player } from '../../lib/types'
import { getPlayerStats, formatPlayerStats } from '../../lib/game-utils'
import type { DragState } from '../../lib/hooks/useDragAndDrop'
import { getRemoveButtonStyles } from '../../lib/utils/component-styles'

interface PlayerTileProps {
  player: Player
  team: 'A' | 'B'
  index: number
  isGoalkeeper: boolean
  isDarkMode: boolean
  isDragging: boolean
  dragState: DragState | null
  scores: any[] // Using any[] for now, should be replaced with proper type
  onDragStart?: (e: React.DragEvent, player: Player) => void
  onDragEnd?: (e: React.DragEvent) => void
  onRemovePlayer?: (player: Player) => void
  isAuthenticated?: boolean
}

export function PlayerTile({
  player,
  team,
  index,
  isGoalkeeper,
  isDarkMode,
  isDragging,
  dragState,
  scores,
  onDragStart,
  onDragEnd,
  onRemovePlayer,
  isAuthenticated = true
}: PlayerTileProps) {
  const isBeingDragged = isDragging && dragState?.player.id === player.id

  // Hide the tile completely if it's being dragged
  if (isBeingDragged) {
    return null
  }

  return (
    <div
      data-player-tile
      draggable={!isGoalkeeper} // Goalkeepers can't be dragged
      onDragStart={(e) => !isGoalkeeper && onDragStart?.(e, player)}
      onDragEnd={onDragEnd}
      className={`group px-3 md:px-4 py-3 md:py-2 rounded-lg border transition-all duration-200 ${
        isDarkMode
          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      } ${!isGoalkeeper ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex justify-between items-start md:items-center gap-2">
        <span className={`font-medium text-sm md:text-base break-words flex-1 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          {player.name || 'Unknown Player'}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs md:text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {formatPlayerStats(getPlayerStats(player.id, scores))}
          </span>
          {!isGoalkeeper && isAuthenticated && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemovePlayer?.(player)
              }}
              className={`${getRemoveButtonStyles(isDarkMode, false)} w-6 h-6 md:w-5 md:h-5 text-sm md:text-xs flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300`}
              title="remove from team"
            >
              −
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 
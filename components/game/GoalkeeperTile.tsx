import React from 'react'
import type { Player } from '../../lib/types'
import { getPlayerStats, formatPlayerStats } from '../../lib/game-utils'
import { getRemoveButtonStyles } from '../../lib/utils/component-styles'

interface GoalkeeperTileProps {
  goalkeeper: Player | null
  team: 'A' | 'B'
  isDarkMode: boolean
  scores: any[] // Add scores parameter
  onAddPlayer?: (team: 'A' | 'B', isGoalkeeper?: boolean) => void
  onRemovePlayer?: (player: Player) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragStart?: (e: React.DragEvent, player: Player) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragTarget?: boolean // New prop to indicate if this is currently a drag target
  draggedPlayerName?: string // New prop for the dragged player name
  isDragging?: boolean // Prop to indicate if any drag is in progress
  dragState?: { player: Player } | null // New prop for the drag state
}

export function GoalkeeperTile({
  goalkeeper,
  team,
  isDarkMode,
  scores,
  onAddPlayer,
  onRemovePlayer,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  isDragTarget = false,
  draggedPlayerName,
  isDragging = false,
  dragState
}: GoalkeeperTileProps) {
  // Show empty goalkeeper tile when the goalkeeper is being dragged
  const isGoalkeeperBeingDragged = isDragging && dragState && goalkeeper && dragState.player.id === goalkeeper.id
  const displayGoalkeeper = isGoalkeeperBeingDragged ? null : goalkeeper

  return (
    <div 
      data-goalkeeper-tile
      data-team={team}
      draggable={!!goalkeeper && !isGoalkeeperBeingDragged} // Only draggable if there's a goalkeeper and it's not being dragged
      onDragStart={(e) => goalkeeper && !isGoalkeeperBeingDragged && onDragStart?.(e, goalkeeper)}
      onDragEnd={onDragEnd}
      className={`group px-3 md:px-4 py-3 md:py-2 rounded-lg border transition-all duration-300 ${
        isDragTarget
          ? `border-2 ${isDarkMode ? 'border-blue-400 bg-blue-900/20' : 'border-blue-500 bg-blue-50'}`
          : !displayGoalkeeper 
            ? `cursor-pointer ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
              }`
            : isDarkMode
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-100 border-gray-200'
      } ${goalkeeper && !isGoalkeeperBeingDragged ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => !displayGoalkeeper && onAddPlayer?.(team, true)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex justify-between items-start md:items-center gap-2">
        <div className="flex-1">
          <div 
            className="text-xs font-bold mb-1 transition-colors duration-300"
            style={{
              color: isDragTarget ? (isDarkMode ? '#60a5fa' : '#3b82f6') : 'var(--accent-blue)'
            }}
          >
            {isDragTarget ? `GÖR ${draggedPlayerName?.toUpperCase()} MÅLVAKT` : 'MÅLVAKT'}
          </div>
          <span className={`font-medium text-sm md:text-base break-words transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {displayGoalkeeper ? (displayGoalkeeper.name || 'Okänd Spelare') : 'Ingen målvakt'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {displayGoalkeeper ? (
            <>
              <span className={`text-xs md:text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatPlayerStats(getPlayerStats(displayGoalkeeper.id, scores))}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemovePlayer?.(displayGoalkeeper)
                }}
                className={`${getRemoveButtonStyles(isDarkMode, false)} w-6 h-6 md:w-5 md:h-5 text-sm md:text-xs flex items-center justify-center`}
                title="remove from team"
              >
                −
              </button>
            </>
          ) : (
            <div className={`text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
              isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
            }`}>
              + Add
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
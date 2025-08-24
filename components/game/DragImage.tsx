import React from 'react'
import type { Player } from '../../lib/types'
import { getPlayerStats, formatPlayerStats } from '../../lib/game-utils'

interface DragImageProps {
  isVisible: boolean
  player: Player | null
  position: { x: number; y: number }
  isDarkMode: boolean
  scores: any[] // Using any[] for now, should be replaced with proper type
}

export function DragImage({ isVisible, player, position, isDarkMode, scores }: DragImageProps) {
  if (!isVisible || !player) return null

  return (
    <div
      className="fixed pointer-events-none z-50 px-4 py-2 rounded-lg border shadow-xl transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
        borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.5)',
        opacity: 0.95,
        transform: 'translate(-50%, -50%)',
        width: '200px',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="flex justify-between items-center">
        <span className={`font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          {player.name || 'Unknown Player'}
        </span>
        <span className={`text-sm ml-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {formatPlayerStats(getPlayerStats(player.id, scores))}
        </span>
      </div>
    </div>
  )
} 
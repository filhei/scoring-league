import React from 'react'
import type { Player } from '../../lib/types'

interface DropPlaceholderProps {
  player: Player
  isDarkMode: boolean
}

export function DropPlaceholder({ player, isDarkMode }: DropPlaceholderProps) {
  return (
    <div
      data-drop-placeholder
      className="h-12 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200"
      style={{
        borderColor: 'var(--accent-blue)',
        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        margin: '4px 0'
      }}
    >
      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
        Drop {player.name || 'Unknown Player'} here
      </span>
    </div>
  )
} 
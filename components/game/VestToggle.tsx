import React from 'react'

interface VestToggleProps {
  team: 'A' | 'B'
  hasVests: boolean
  isDarkMode: boolean
  isAreaHovered: boolean
  onToggle: (team: 'A' | 'B') => void
}

export function VestToggle({ team, hasVests, isDarkMode, isAreaHovered, onToggle }: VestToggleProps) {
  const shouldShow = hasVests || isAreaHovered
  
  if (!shouldShow) return <div className="w-6 h-6" /> // Placeholder to maintain spacing
  
  return (
    <button
      onClick={() => onToggle(team)}
      className={`w-6 h-6 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
        isDarkMode
          ? 'text-gray-400 hover:text-white'
          : 'text-gray-500 hover:text-gray-800'
      }`}
      title={hasVests ? 'Remove vests' : 'Add vests'}
    >
      <span 
        className={`text-lg transition-opacity duration-200 ${
          hasVests ? 'opacity-100' : 'opacity-60'
        }`}
      >
        🦺
      </span>
    </button>
  )
} 
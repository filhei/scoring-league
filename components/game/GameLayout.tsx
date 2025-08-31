'use client'

import { ReactNode } from 'react'

interface GameLayoutProps {
  children: ReactNode
  isDarkMode: boolean
  onToggleDarkMode: () => void
  showBackButton?: boolean
  onBackClick?: () => void
}

export function GameLayout({ 
  children, 
  isDarkMode, 
  onToggleDarkMode, 
  showBackButton = false, 
  onBackClick 
}: GameLayoutProps) {
  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)'
      }}
    >
      {showBackButton && onBackClick && (
        <div className="sm:max-w-6xl sm:mx-auto sm:p-6 sm:pb-0 p-4">
          <button
            onClick={onBackClick}
            className={`mb-4 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            ← Back to Matches
          </button>
        </div>
      )}
      
      {children}
    </div>
  )
} 
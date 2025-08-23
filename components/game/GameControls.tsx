import React, { useState } from 'react'
import type { UseMatchTimerReturn } from '../../lib/hooks/useMatchTimer'
import { VestToggle } from './VestToggle'

interface GameControlsProps {
  timer?: UseMatchTimerReturn | null
  leftScore: number
  rightScore: number
  leftTeam: 'A' | 'B'
  rightTeam: 'A' | 'B'
  isDarkMode: boolean
  teamWithVests: 'A' | 'B' | null
  matchStatus: string
  onScoreIncrement: (team: 'A' | 'B') => void
  onPauseToggle: () => void
  onEndMatch: () => void
  onStartMatch?: () => void
  onEndMatchAndCreateNew?: () => void
  onSwapSides: () => void
  onVestToggle: (team: 'A' | 'B') => void
  isAuthenticated?: boolean
}

export function GameControls({
  timer,
  leftScore,
  rightScore,
  leftTeam,
  rightTeam,
  isDarkMode,
  teamWithVests,
  matchStatus,
  onScoreIncrement,
  onPauseToggle,
  onEndMatch,
  onStartMatch,
  onEndMatchAndCreateNew,
  onSwapSides,
  onVestToggle,
  isAuthenticated = true
}: GameControlsProps) {
  const [leftTeamHovered, setLeftTeamHovered] = useState(false)
  const [rightTeamHovered, setRightTeamHovered] = useState(false)
  const [showEndConfirmation, setShowEndConfirmation] = useState(false)

  const handleEndMatchClick = () => {
    setShowEndConfirmation(true)
  }

  const handleConfirmEndMatch = () => {
    setShowEndConfirmation(false)
    onEndMatch()
  }

  const handleEndMatchAndCreateNew = () => {
    setShowEndConfirmation(false)
    onEndMatchAndCreateNew?.()
  }

  const handleCancelEndMatch = () => {
    setShowEndConfirmation(false)
  }

  return (
    <>
      {/* Game Time and Pause */}
      <div className="relative flex justify-center items-center mb-8">
        <div className={`text-4xl font-mono font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {timer?.formattedTime || '00:00'}
        </div>
        {matchStatus !== 'planned' && timer && isAuthenticated && (
          <div className="absolute left-1/2 ml-32 flex items-center space-x-2">
            <button
              onClick={onPauseToggle}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 text-white hover:bg-gray-800'
                  : 'border-gray-300 hover:border-gray-400 text-gray-800 hover:bg-gray-50'
              }`}
            >
              {timer.isPaused ? (
                <div className="w-0 h-0 border-l-[6px] border-l-current border-y-[4px] border-y-transparent ml-0.5"></div>
              ) : (
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-3 bg-current"></div>
                  <div className="w-0.5 h-3 bg-current"></div>
                </div>
              )}
            </button>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {timer.isPaused ? 'Resume' : 'Pause'}
            </span>
          </div>
        )}
      </div>

      {/* Score Row */}
      <div className="flex justify-center items-center space-x-16 mb-8">
        {matchStatus !== 'planned' && isAuthenticated && (
          <button
            onClick={() => onScoreIncrement(leftTeam)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 text-white"
            style={{
              backgroundColor: 'var(--accent-blue)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)'
            }}
          >
            +
          </button>
        )}
        <div className={`text-8xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {leftScore} - {rightScore}
        </div>
        {matchStatus !== 'planned' && isAuthenticated && (
          <button
            onClick={() => onScoreIncrement(rightTeam)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 text-white"
            style={{
              backgroundColor: 'var(--accent-blue)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)'
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Start/End Match Button */}
      <div className="flex justify-center mb-8">
        {isAuthenticated && (matchStatus === 'planned' ? (
          <button
            onClick={onStartMatch}
            className="px-5 py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-white"
            style={{
              backgroundColor: 'var(--goal-color)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--goal-color-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--goal-color)'
            }}
          >
            Start Game
          </button>
        ) : (
          <button
            onClick={handleEndMatchClick}
            className="px-5 py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-white"
            style={{
              backgroundColor: 'var(--accent-red)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-red-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-red)'
            }}
          >
            End Match
          </button>
        ))}
      </div>

      {/* Teams Header */}
      <div className="flex justify-between items-center mb-6">
        <div 
          className="flex items-center space-x-2 group"
          onMouseEnter={() => setLeftTeamHovered(true)}
          onMouseLeave={() => setLeftTeamHovered(false)}
        >
          <h3 
            className="text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Team {leftTeam}
          </h3>
          <VestToggle
            team={leftTeam}
            hasVests={teamWithVests === leftTeam}
            isDarkMode={isDarkMode}
            isAreaHovered={leftTeamHovered}
            onToggle={onVestToggle}
          />
        </div>
        
        <button
          onClick={onSwapSides}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-110 ${
            isDarkMode
              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Byt sida"
        >
          ⇄
        </button>
        
        <div 
          className="flex items-center space-x-2 group"
          onMouseEnter={() => setRightTeamHovered(true)}
          onMouseLeave={() => setRightTeamHovered(false)}
        >
          <VestToggle
            team={rightTeam}
            hasVests={teamWithVests === rightTeam}
            isDarkMode={isDarkMode}
            isAreaHovered={rightTeamHovered}
            onToggle={onVestToggle}
          />
          <h3 
            className="text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Team {rightTeam}
          </h3>
        </div>
      </div>

      {/* End Match Confirmation Dialog */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${
            isDarkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              End Match?
            </h3>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Are you sure you want to end this match? This action cannot be undone.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleCancelEndMatch}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndMatch}
                className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white"
                style={{
                  backgroundColor: 'var(--accent-red)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-red-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-red)'
                }}
              >
                End Match
              </button>
              <button
                onClick={handleEndMatchAndCreateNew}
                className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white"
                style={{
                  backgroundColor: 'var(--goal-color)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--goal-color-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--goal-color)'
                }}
              >
                End Match & Create New
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
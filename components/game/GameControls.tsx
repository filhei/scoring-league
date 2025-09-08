import React, { useState } from 'react'
import type { UseMatchTimerReturn } from '../../lib/hooks/useMatchTimer'
import type { Score, Player } from '../../lib/types'
import { VestToggle } from './VestToggle'
import { ScorersDisplay } from './ScorersDisplay'

interface GameControlsProps {
  timer?: UseMatchTimerReturn | null
  leftScore: number
  rightScore: number
  leftTeam: 'A' | 'B'
  rightTeam: 'A' | 'B'
  isDarkMode: boolean
  teamWithVests: 'A' | 'B' | null
  matchStatus: string
  scores: Score[]
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
  onScoreIncrement: (team: 'A' | 'B') => void
  onPauseToggle: () => void
  onEndMatch: () => void
  onStartMatch?: () => void
  onEndMatchAndCreateNew?: () => void
  onSwapSides: () => void
  onVestToggle: (team: 'A' | 'B') => void
  isAuthenticated?: boolean
  isPauseToggleBusy?: boolean
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
  scores,
  teamAPlayers,
  teamBPlayers,
  goalkeepers,
  onScoreIncrement,
  onPauseToggle,
  onEndMatch,
  onStartMatch,
  onEndMatchAndCreateNew,
  onSwapSides,
  onVestToggle,
  isAuthenticated = true,
  isPauseToggleBusy = false
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
      <div className="relative flex justify-center items-center mb-6 md:mb-8">
        <div className={`text-3xl md:text-4xl font-mono font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {timer?.formattedTime || '00:00'}
        </div>
        {matchStatus !== 'planned' && timer && isAuthenticated && (
          <div className="absolute left-1/2 ml-20 md:ml-32 flex items-center space-x-2">
            <button
              onClick={onPauseToggle}
              disabled={timer.isTimerBusy || isPauseToggleBusy}
              className={`w-8 h-8 md:w-8 md:h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                timer.isTimerBusy || isPauseToggleBusy
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-110 active:scale-95'
              } ${
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
            <span className={`text-xs font-medium transition-colors duration-300 hidden sm:inline ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {timer.isTimerBusy || isPauseToggleBusy ? 'Uppdaterar...' : (timer.isPaused ? 'Fortsätt' : 'Pausa')}
            </span>
          </div>
        )}
      </div>

      {/* Score Row */}
      <div className="flex justify-center items-center space-x-8 md:space-x-16 mb-6 md:mb-8">
        {matchStatus !== 'planned' && isAuthenticated && (
          <button
            onClick={() => onScoreIncrement(leftTeam)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 text-white"
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
        <div className={`text-6xl md:text-8xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {leftScore} - {rightScore}
        </div>
        {matchStatus !== 'planned' && isAuthenticated && (
          <button
            onClick={() => onScoreIncrement(rightTeam)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 text-white"
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

      {/* Scorers Display */}
      <ScorersDisplay
        scores={scores}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        goalkeepers={goalkeepers}
        isDarkMode={isDarkMode}
      />

      {/* Start/End Match Button */}
      <div className="flex justify-center mb-6 md:mb-8">
        {isAuthenticated && (matchStatus === 'planned' ? (
          <button
            onClick={onStartMatch}
            className="px-6 py-2 md:px-5 md:py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 text-white"
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
            Starta Match
          </button>
        ) : (
          <button
            onClick={handleEndMatchClick}
            className="px-6 py-2 md:px-5 md:py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 text-white"
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
            Avsluta Match
          </button>
        ))}
      </div>

      {/* Teams Header - Desktop Only */}
      <div className="hidden md:flex justify-between items-center mb-4 md:mb-6">
        <div 
          className="flex items-center space-x-2 group"
          onMouseEnter={() => setLeftTeamHovered(true)}
          onMouseLeave={() => setLeftTeamHovered(false)}
        >
          <h3 
            className="text-lg md:text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Lag {leftTeam}
          </h3>
          <VestToggle
            team={leftTeam}
            hasVests={teamWithVests === leftTeam}
            isDarkMode={isDarkMode}
            isAreaHovered={leftTeamHovered}
            onToggle={onVestToggle}
            isAuthenticated={isAuthenticated}
          />
        </div>
        
        {isAuthenticated && (
          <button
            onClick={onSwapSides}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
              isDarkMode
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title="Byt sida"
          >
            ⇄
          </button>
        )}
        
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
            isAuthenticated={isAuthenticated}
          />
          <h3 
            className="text-lg md:text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Lag {rightTeam}
          </h3>
        </div>
      </div>

      {/* End Match Confirmation Dialog */}
      {showEndConfirmation && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        >
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${
            isDarkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Avsluta Match?
            </h3>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Är du säker på att du vill avsluta denna match? Denna åtgärd kan inte ångras.
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
                Avbryt
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
                Avsluta Match
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
                Avsluta Match & Skapa Ny
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
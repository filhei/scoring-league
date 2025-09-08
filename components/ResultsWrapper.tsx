'use client'

import { useState } from 'react'
import { Navigation } from './Navigation'
import { PastGamesList } from './PastGamesList'
import { useDarkMode } from '../lib/hooks/useDarkMode'
import type { PastGameData, PastGameDetailedData } from '../lib/types'

interface ResultsWrapperProps {
  pastGames: PastGameData[]
  getPastGameDetailed: (matchId: string) => Promise<PastGameDetailedData | null>
}

export function ResultsWrapper({ pastGames, getPastGameDetailed }: ResultsWrapperProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [selectedGame, setSelectedGame] = useState<PastGameDetailedData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGameSelect = async (matchId: string) => {
    setLoading(true)
    try {
      const gameData = await getPastGameDetailed(matchId)
      if (gameData) {
        setSelectedGame(gameData)
      }
    } catch (error) {
      console.error('Error loading game details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToResults = () => {
    setSelectedGame(null)
  }

  if (selectedGame) {
    // Import PastGameView dynamically to avoid circular dependencies
    const { PastGameView } = require('./game/PastGameView')
    return (
      <>
        <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="sm:container sm:mx-auto sm:px-4 sm:py-8 p-4">
          <button
            onClick={handleBackToResults}
            className={`mb-4 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            ← Tillbaka till resultat
          </button>
          <PastGameView
            gameData={selectedGame}
            isDarkMode={isDarkMode}
            isSidesSwapped={false}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="sm:container sm:mx-auto sm:px-4 sm:py-8 p-4">
        <h1 className={`text-3xl font-bold mb-8 text-center transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Resultat
        </h1>
        <PastGamesList 
          pastGames={pastGames} 
          isDarkMode={isDarkMode} 
          onGameSelect={handleGameSelect}
          loading={loading}
        />
      </div>
    </>
  )
} 
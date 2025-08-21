'use client'

import { Navigation } from './Navigation'
import { ScoreboardTable } from './ScoreboardTable'
import { useDarkMode } from '../lib/hooks/useDarkMode'
import type { PlayerStats } from '../lib/types'

interface ScoreboardWrapperProps {
  scoreboardData: PlayerStats[]
}

export function ScoreboardWrapper({ scoreboardData }: ScoreboardWrapperProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <>
      <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold mb-8 text-center transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Poängliga
        </h1>
        <ScoreboardTable scoreboardData={scoreboardData} />
      </div>
    </>
  )
} 
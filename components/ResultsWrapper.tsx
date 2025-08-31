'use client'

import { Navigation } from './Navigation'
import { PastGamesList } from './PastGamesList'
import { useDarkMode } from '../lib/hooks/useDarkMode'
import type { PastGameData } from '../lib/types'

interface ResultsWrapperProps {
  pastGames: PastGameData[]
}

export function ResultsWrapper({ pastGames }: ResultsWrapperProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <>
      <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="sm:container sm:mx-auto sm:px-4 sm:py-8 p-4">
        <h1 className={`text-3xl font-bold mb-8 text-center transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Past Game Results
        </h1>
        <PastGamesList pastGames={pastGames} isDarkMode={isDarkMode} />
      </div>
    </>
  )
} 
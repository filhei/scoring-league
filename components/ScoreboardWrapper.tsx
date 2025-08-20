'use client'

import { useState } from 'react'
import { Navigation } from './Navigation'
import { ScoreboardTable } from './ScoreboardTable'
import type { PlayerStats } from '../lib/types'

interface ScoreboardWrapperProps {
  scoreboardData: PlayerStats[]
}

export function ScoreboardWrapper({ scoreboardData }: ScoreboardWrapperProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

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
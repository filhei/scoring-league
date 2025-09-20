'use client'
import { ScoreboardTable } from './ScoreboardTable'
import { useDarkMode } from '../lib/hooks/useDarkMode'
import { useAuth } from '../lib/auth-context'
import type { PlayerStats } from '../lib/types'

interface ScoreboardWrapperProps {
  scoreboardData: PlayerStats[]
}

export function ScoreboardWrapper({ scoreboardData }: ScoreboardWrapperProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { player } = useAuth()

  const currentPlayerId = player?.id ?? undefined
  const top10 = scoreboardData.slice(0, 10)
  const userRow = currentPlayerId ? scoreboardData.find(s => s.player.id === currentPlayerId) : undefined
  const isInTop10 = currentPlayerId ? top10.some(s => s.player.id === currentPlayerId) : false
  const visibleData = userRow && !isInTop10 ? [...top10, userRow] : top10

  return (
    <>
      <div className="sm:container sm:mx-auto sm:px-4 sm:py-8 p-4">
        <h1 className={`text-3xl font-bold mb-8 text-center transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Tabell
        </h1>
        <ScoreboardTable scoreboardData={visibleData} isDarkMode={isDarkMode} currentPlayerId={currentPlayerId} />
        <div className={`mt-6 text-center text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Endast topp 10 visas. {(!currentPlayerId || (!isInTop10 && !userRow)) && (
            <>Logga in för att se din placering.</>
          )}
        </div>
      </div>
    </>
  )
} 
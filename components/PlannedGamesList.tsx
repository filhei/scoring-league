'use client'

import type { Match } from '../lib/types'

interface PlannedGamesListProps {
  plannedGames: Match[]
  isDarkMode: boolean
  onSelectGame: (game: Match) => void
}

export function PlannedGamesList({ plannedGames, isDarkMode, onSelectGame }: PlannedGamesListProps) {
  if (plannedGames.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto p-6 mb-6">
      <div className={`rounded-2xl p-6 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Planned Games
        </h3>
        <div className="space-y-3">
          {plannedGames.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game)}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Game #{game.id.slice(0, 8)}
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Created: {new Date(game.created_at!).toLocaleString()}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDarkMode
                    ? 'bg-blue-900 text-blue-200'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  Planned
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 
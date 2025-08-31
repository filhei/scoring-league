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
    <div className="sm:max-w-6xl sm:mx-auto sm:p-6 p-4 mb-6">
      <div className={`sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300 ${
        isDarkMode
          ? 'sm:bg-gray-800 sm:border sm:border-gray-700'
          : 'sm:bg-gray-50 sm:border sm:border-gray-200'
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
              className={`w-full p-4 sm:rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${
                isDarkMode
                  ? 'sm:bg-gray-700 hover:sm:bg-gray-600 sm:border sm:border-gray-600'
                  : 'sm:bg-white hover:sm:bg-gray-50 sm:border sm:border-gray-200 hover:sm:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Game {game.gameCount || 'N/A'}
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
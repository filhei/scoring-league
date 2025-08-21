'use client'

import type { Match, ActiveGameData } from '../lib/types'

interface MatchesListProps {
  activeGame: ActiveGameData | null
  allGames: Match[]
  isDarkMode: boolean
  onSelectGame: (game: Match) => void
  onCreateNewGame: () => void
  isCreatingGame?: boolean
}

export function MatchesList({ activeGame, allGames, isDarkMode, onSelectGame, onCreateNewGame, isCreatingGame = false }: MatchesListProps) {
  // Filter games by status
  const plannedGames = allGames.filter(game => game.match_status === 'planned')
  const activeGames = allGames.filter(game => game.match_status === 'active' || game.match_status === 'paused')
  
  // Show all games (active and planned)
  const allGamesToShow = [...activeGames, ...plannedGames]

  // Debug logging
  console.log('MatchesList:', {
    totalGames: allGames.length,
    plannedGames: plannedGames.length,
    activeGames: activeGames.length,
    activeGameId: activeGame?.match.id,
    gamesToShow: allGamesToShow.length,
    gamesToShowIds: allGamesToShow.map(g => `${g.id.slice(0, 8)}... (${g.match_status})`)
  })

  if (allGamesToShow.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className={`rounded-2xl p-8 transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="text-center">
            <div className={`text-6xl mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`}>
              ⚽
            </div>
            <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              No Games Available
            </h2>
            <p className={`text-lg mb-8 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Create a new match to get started.
            </p>
            <button
              onClick={onCreateNewGame}
              disabled={isCreatingGame}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white'
              } ${
                isCreatingGame ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              }`}
            >
              {isCreatingGame ? 'Creating Game...' : 'Create New Game'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className={`rounded-2xl p-6 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            All Games
          </h3>
          <button
            onClick={onCreateNewGame}
            disabled={isCreatingGame}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white'
                : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white'
            } ${
              isCreatingGame ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            {isCreatingGame ? 'Creating...' : '+ New Game'}
          </button>
        </div>
        <div className="space-y-3">
          {allGamesToShow.map((game) => {
            const isActive = game.match_status === 'active' || game.match_status === 'paused'
            const isPlanned = game.match_status === 'planned'
            const isCurrentActiveGame = activeGame && game.id === activeGame.match.id
            
            return (
              <button
                key={game.id}
                onClick={() => {
                  console.log(`MatchesList: Clicked on game ${game.id.slice(0, 8)}... (${game.match_status})`)
                  onSelectGame(game)
                }}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${
                  isCurrentActiveGame
                    ? isDarkMode
                      ? 'bg-blue-700 hover:bg-blue-600 border-2 border-blue-500'
                      : 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-500'
                    : isDarkMode
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
                      {isActive 
                        ? `Started: ${new Date(game.start_time!).toLocaleString()}`
                        : `Created: ${new Date(game.created_at!).toLocaleString()}`
                      }
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isCurrentActiveGame
                      ? isDarkMode
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-blue-100 text-blue-800'
                      : isActive
                        ? isDarkMode
                          ? 'bg-green-900 text-green-200'
                          : 'bg-green-100 text-green-800'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isCurrentActiveGame ? 'Current' : isActive ? 'Active' : 'Planned'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
} 
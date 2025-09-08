import type { PastGameData } from '../lib/types'
import { PastGameCard } from './PastGameCard'

interface PastGamesListProps {
  pastGames: PastGameData[]
  isDarkMode?: boolean
}

export function PastGamesList({ pastGames, isDarkMode = false }: PastGamesListProps) {
  if (pastGames.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500 dark:text-gray-400">Inga resultat att visa.</p>
      </div>
    )
  }

  // Group games by date
  const groupedGames = pastGames.reduce((groups, game) => {
    const date = new Date(game.match.start_time)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD for consistent grouping
    const dateHeader = date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).replace(/^./, (match) => match.toUpperCase())

    if (!groups[dateKey]) {
      groups[dateKey] = {
        header: dateHeader,
        games: []
      }
    }
    
    groups[dateKey].games.push(game)
    return groups
  }, {} as Record<string, { header: string; games: PastGameData[] }>)

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedGames).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => {
        const group = groupedGames[dateKey]
        return (
          <div key={dateKey} className="space-y-4">
            {/* Date Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                {group.header}
              </h2>
            </div>
            
            {/* Games for this date */}
            <div className="space-y-4">
              {group.games.map((game) => (
                <PastGameCard key={game.match.id} game={game} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
} 
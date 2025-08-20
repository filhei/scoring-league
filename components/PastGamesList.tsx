import type { PastGameData } from '../lib/types'
import { PastGameCard } from './PastGameCard'

interface PastGamesListProps {
  pastGames: PastGameData[]
}

export function PastGamesList({ pastGames }: PastGamesListProps) {
  if (pastGames.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500 dark:text-gray-400">No past games found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pastGames.map((game) => (
        <PastGameCard key={game.match.id} game={game} />
      ))}
    </div>
  )
} 
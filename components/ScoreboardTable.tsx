import type { PlayerStats } from '../lib/types'

interface ScoreboardTableProps {
  scoreboardData: PlayerStats[]
}

export function ScoreboardTable({ scoreboardData }: ScoreboardTableProps) {
  if (scoreboardData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500 dark:text-gray-400">No scoreboard data available.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Games
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Sessions
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              W
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              L
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Goals
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Assists
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Points
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {scoreboardData.map((player, index) => (
            <tr 
              key={player.player.id} 
              className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
              }`}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {player.rank}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                {player.player.name || 'Unknown Player'}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                {player.gamesPlayed}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                {player.sessionsPlayed}
              </td>
              <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400 font-medium">
                {player.wins}
              </td>
              <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 font-medium">
                {player.losses}
              </td>
              <td className="px-4 py-3 text-sm text-center text-blue-600 dark:text-blue-400 font-medium">
                {player.goals}
              </td>
              <td className="px-4 py-3 text-sm text-center text-purple-600 dark:text-purple-400 font-medium">
                {player.assists}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white font-bold">
                {player.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 
import type { PlayerStats } from '../lib/types'

interface ScoreboardTableProps {
  scoreboardData: PlayerStats[]
  isDarkMode?: boolean
}

export function ScoreboardTable({ scoreboardData, isDarkMode = false }: ScoreboardTableProps) {
  if (scoreboardData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500 dark:text-gray-400">Ingen poängdata tillgänglig.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full sm:border sm:rounded-lg sm:shadow-sm ${
        isDarkMode
          ? 'sm:bg-gray-800 sm:border-gray-700'
          : 'sm:bg-gray-50 sm:border-gray-200'
      }`}>
        <thead className={`${
          isDarkMode ? 'sm:bg-gray-700' : 'sm:bg-gray-100'
        }`}>
                      <tr>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Placering
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Namn
              </th>
              <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Matcher
              </th>
              <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Sessioner
              </th>
              <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                V
              </th>
              <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                F
              </th>
              <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Mål
              </th>
              <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Assist
              </th>
              <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Poäng
              </th>
            </tr>
        </thead>
        <tbody className={`sm:divide-y ${
          isDarkMode ? 'sm:divide-gray-700' : 'sm:divide-gray-200'
        }`}>
          {scoreboardData.map((player, index) => (
            <tr 
              key={player.player.id} 
              className={`transition-colors ${
                isDarkMode ? 'sm:hover:bg-gray-700' : 'sm:hover:bg-gray-50'
              }`}
            >
              <td className={`px-4 py-3 text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.rank}
              </td>
              <td className={`px-4 py-3 text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.player.name || 'Okänd Spelare'}
              </td>
              <td className={`px-4 py-3 text-sm text-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.gamesPlayed}
              </td>
              <td className={`px-4 py-3 text-sm text-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.sessionsPlayed}
              </td>
              <td className={`px-4 py-3 text-sm text-center font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.wins}
              </td>
              <td className={`px-4 py-3 text-sm text-center font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.losses}
              </td>
              <td className={`px-4 py-3 text-sm text-center font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.goals}
              </td>
              <td className={`px-4 py-3 text-sm text-center font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.assists}
              </td>
              <td className={`px-4 py-3 text-sm text-center font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {player.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 
import type { PastGameData } from '../lib/types'

interface PastGameCardProps {
  game: PastGameData
}

export function PastGameCard({ game }: PastGameCardProps) {
  const { match, teamA, teamB, goalkeepers, scores, teamWithVests } = game
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTeamIcon = (team: 'A' | 'B') => {
    return team === 'A' ? '🔵' : '🔴'
  }

  const getVestIcon = (team: 'A' | 'B') => {
    return teamWithVests === team ? '🟡' : null
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        {/* Teams and Scores Column */}
        <div className="flex-1 space-y-3">
          {/* Team A Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTeamIcon('A')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {goalkeepers.teamA?.name || 'No goalkeeper'}
                </span>
                {getVestIcon('A') && (
                  <span className="text-lg">{getVestIcon('A')}</span>
                )}
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{scores.teamA}</span>
          </div>

          {/* Team B Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTeamIcon('B')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {goalkeepers.teamB?.name || 'No goalkeeper'}
                </span>
                {getVestIcon('B') && (
                  <span className="text-lg">{getVestIcon('B')}</span>
                )}
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{scores.teamB}</span>
          </div>
        </div>

        {/* Date and Time Column - Vertically Centered */}
        <div className="flex items-center ml-6 pl-6 border-l border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {formatDateTime(match.start_time)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
import type { PastGameData } from '../lib/types'

// PastGameCard component for displaying past game results
interface PastGameCardProps {
  game: PastGameData
  isDarkMode?: boolean
  onGameSelect?: (matchId: string) => void
  loading?: boolean
}

export function PastGameCard({ 
  game, 
  isDarkMode = false, 
  onGameSelect, 
  loading = false 
}: PastGameCardProps) {
  const { match, teamA, teamB, goalkeepers, scores, teamWithVests } = game
  
  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'In Progress'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))
    
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getVestIcon = (team: 'A' | 'B') => {
    return teamWithVests === team ? '🦺' : null
  }

  const getTeamDisplayName = (team: 'A' | 'B') => {
    const goalkeeper = team === 'A' ? goalkeepers.teamA : goalkeepers.teamB
    return goalkeeper?.name || `Lag ${team}`
  }

  const isWinner = (team: 'A' | 'B') => {
    const teamScore = team === 'A' ? scores.teamA : scores.teamB
    const otherScore = team === 'A' ? scores.teamB : scores.teamA
    return teamScore > otherScore
  }

  const isDraw = scores.teamA === scores.teamB

  const handleClick = () => {
    if (onGameSelect && !loading) {
      onGameSelect(match.id)
    }
  }

  return (
    <div 
      className={`sm:border sm:rounded-lg p-4 sm:p-6 sm:shadow-sm transition-all duration-200 ${
        onGameSelect 
          ? 'cursor-pointer hover:sm:shadow-md hover:scale-[1.02] active:scale-[0.98]' 
          : 'transition-shadow'
      } ${
        isDarkMode
          ? 'sm:bg-gray-800 sm:border-gray-700'
          : 'sm:bg-gray-50 sm:border-gray-200'
      }`}
      onClick={handleClick}
    >
      <div className="flex min-h-[120px]">
        {/* Teams Column */}
        <div className="flex-1 space-y-3">
          {/* Team A Row */}
          <div className={`flex items-center justify-between p-2 rounded ${
            !isDraw && isWinner('A') 
              ? isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              : ''
          }`}>
            <div className="flex items-center space-x-2">
              <span className="w-6 text-center">
                {getVestIcon('A') || ' '}
              </span>
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {getTeamDisplayName('A')}
              </span>
            </div>
            <span className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{scores.teamA}</span>
          </div>

          {/* Team B Row */}
          <div className={`flex items-center justify-between p-2 rounded ${
            !isDraw && isWinner('B') 
              ? isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              : ''
          }`}>
            <div className="flex items-center space-x-2">
              <span className="w-6 text-center">
                {getVestIcon('B') || ' '}
              </span>
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {getTeamDisplayName('B')}
              </span>
            </div>
            <span className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{scores.teamB}</span>
          </div>
        </div>

                  {/* Duration Column with Full Height Divider */}
        <div className="relative flex items-center justify-center ml-6 pl-6 w-24">
          {/* Full height divider */}
          <div className={`absolute left-0 top-0 bottom-0 w-px ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          <div className="text-center">
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatDuration(match.start_time, match.end_time)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
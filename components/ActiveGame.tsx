import type { ActiveGameData, Player } from '../lib/types'
import { getPlayerStats, formatPlayerStats } from '../lib/game-utils'
import type { UseMatchTimerReturn } from '../lib/hooks/useMatchTimer'

interface ActiveGameProps {
  activeGame: ActiveGameData
  timer: UseMatchTimerReturn
  teamAScore: number
  teamBScore: number
  isDarkMode: boolean
  isSidesSwapped: boolean
  onScoreIncrement: (team: 'A' | 'B') => void
  onPauseToggle: () => void
  onEndMatch: () => void
  onSwapSides: () => void
  onAddPlayer: (team: 'A' | 'B', isGoalkeeper?: boolean) => void
  onRemovePlayer: (player: Player) => void
}

export function ActiveGame({
  activeGame,
  timer,
  teamAScore,
  teamBScore,
  isDarkMode,
  isSidesSwapped,
  onScoreIncrement,
  onPauseToggle,
  onEndMatch,
  onSwapSides,
  onAddPlayer,
  onRemovePlayer
}: ActiveGameProps) {
  // Determine display order based on swap state
  const leftTeam = isSidesSwapped ? 'B' : 'A'
  const rightTeam = isSidesSwapped ? 'A' : 'B'
  const leftScore = isSidesSwapped ? teamBScore : teamAScore
  const rightScore = isSidesSwapped ? teamAScore : teamBScore
  const leftPlayers = isSidesSwapped ? activeGame.teamB : activeGame.teamA
  const rightPlayers = isSidesSwapped ? activeGame.teamA : activeGame.teamB
  const leftGoalkeeper = isSidesSwapped ? activeGame.goalkeepers.teamB : activeGame.goalkeepers.teamA
  const rightGoalkeeper = isSidesSwapped ? activeGame.goalkeepers.teamA : activeGame.goalkeepers.teamB
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Active Game Pane */}
      <div className={`rounded-2xl p-8 mb-8 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        {/* Title */}
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Active Game
          </h2>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
            }`}
          >
            ⚙️ Edit
          </button>
        </div>

        {/* Game Time and Pause */}
        <div className="relative flex justify-center items-center mb-8">
          <div className={`text-4xl font-mono font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {timer.formattedTime}
          </div>
          <div className="absolute left-1/2 ml-32 flex items-center space-x-2">
            <button
              onClick={onPauseToggle}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 text-white hover:bg-gray-800'
                  : 'border-gray-300 hover:border-gray-400 text-gray-800 hover:bg-gray-50'
              }`}
            >
              {timer.isPaused ? (
                <div className="w-0 h-0 border-l-[6px] border-l-current border-y-[4px] border-y-transparent ml-0.5"></div>
              ) : (
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-3 bg-current"></div>
                  <div className="w-0.5 h-3 bg-current"></div>
                </div>
              )}
            </button>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {timer.isPaused ? 'Resume' : 'Pause'}
            </span>
          </div>
        </div>

        {/* Score Row */}
        <div className="flex justify-center items-center space-x-16 mb-8">
          <button
            onClick={() => onScoreIncrement(leftTeam)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 text-white"
            style={{
              backgroundColor: 'var(--accent-blue)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)'
            }}
          >
            +
          </button>
          <div className={`text-8xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {leftScore} - {rightScore}
          </div>
          <button
            onClick={() => onScoreIncrement(rightTeam)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 text-white"
            style={{
              backgroundColor: 'var(--accent-blue)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)'
            }}
          >
            +
          </button>
        </div>

        {/* End Match Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={onEndMatch}
            className="px-5 py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-white"
            style={{
              backgroundColor: 'var(--accent-red)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-red-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-red)'
            }}
          >
            End Match
          </button>
        </div>

        {/* Teams Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 
            className="text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Team {leftTeam}
          </h3>
          <button
            onClick={onSwapSides}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title="Byt sida"
          >
            ⇄
          </button>
          <h3 
            className="text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Team {rightTeam}
          </h3>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Team */}
          <div className="space-y-2">
            {/* Goalkeeper */}
            <div 
              className={`group px-4 py-2 rounded-lg border transition-all duration-300 ${
                !leftGoalkeeper 
                  ? `cursor-pointer ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                    }`
                  : isDarkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-100 border-gray-200'
              }`}
              onClick={() => !leftGoalkeeper && onAddPlayer(leftTeam, true)}
            >
              <div className="relative">
                <div 
                  className="text-xs font-bold mb-1 transition-colors duration-300"
                  style={{
                    color: 'var(--accent-blue)'
                  }}
                >
                  GOALKEEPER
                </div>
                {leftGoalkeeper ? (
                  <>
                    <div className="flex items-center justify-between pr-6">
                      <span className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {leftGoalkeeper.name}
                      </span>
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatPlayerStats(getPlayerStats(leftGoalkeeper.id, activeGame.scores))}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemovePlayer(leftGoalkeeper!)
                      }}
                      className={`absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                        isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                      }`}
                      title="remove from team"
                    >
                      −
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between pr-6">
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Ingen målvakt
                      </span>
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                        style={{ minHeight: '1.7em', display: 'inline-block' }}
                      >
                        &nbsp;
                      </span>
                    </div>
                    <div className={`absolute top-1/2 right-0 -translate-y-1/2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                      isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                    }`}>
                      + Add
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Field Players */}
            {leftPlayers.filter(p => p.id !== leftGoalkeeper?.id).map((player) => (
              <div key={player.id} className={`group px-4 py-2 rounded-lg border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {player.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm transition-colors duration-300 pr-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatPlayerStats(getPlayerStats(player.id, activeGame.scores))}
                    </span>
                    <button
                      onClick={() => onRemovePlayer(player)}
                      className={`opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                        isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                      }`}
                      title="remove from team"
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Player Button */}
            <button 
              onClick={() => onAddPlayer(leftTeam, false)}
              className="w-full px-4 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.color = 'var(--accent-blue)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'
                e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280'
              }}
            >
              + Add Player
            </button>
          </div>

          {/* Right Team */}
          <div className="space-y-2">
            {/* Goalkeeper */}
            <div 
              className={`group px-4 py-2 rounded-lg border transition-all duration-300 ${
                !rightGoalkeeper 
                  ? `cursor-pointer ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                    }`
                  : isDarkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-100 border-gray-200'
              }`}
              onClick={() => !rightGoalkeeper && onAddPlayer(rightTeam, true)}
            >
              <div className="relative">
                <div 
                  className="text-xs font-bold mb-1 transition-colors duration-300"
                  style={{
                    color: 'var(--accent-blue)'
                  }}
                >
                  GOALKEEPER
                </div>
                {rightGoalkeeper ? (
                  <>
                    <div className="flex items-center justify-between pr-6">
                      <span className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {rightGoalkeeper.name}
                      </span>
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatPlayerStats(getPlayerStats(rightGoalkeeper.id, activeGame.scores))}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemovePlayer(rightGoalkeeper!)
                      }}
                      className={`absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                        isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                      }`}
                      title="remove from team"
                    >
                      −
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between pr-6">
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Ingen målvakt
                      </span>
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                        style={{ minHeight: '1.7em', display: 'inline-block' }}
                      >
                        &nbsp;
                      </span>
                    </div>
                    <div className={`absolute top-1/2 right-0 -translate-y-1/2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                      isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                    }`}>
                      + Add
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Field Players */}
            {rightPlayers.filter(p => p.id !== rightGoalkeeper?.id).map((player) => (
              <div key={player.id} className={`group px-4 py-2 rounded-lg border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {player.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm transition-colors duration-300 pr-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatPlayerStats(getPlayerStats(player.id, activeGame.scores))}
                    </span>
                    <button
                      onClick={() => onRemovePlayer(player)}
                      className={`opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                        isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                      }`}
                      title="remove from team"
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Player Button */}
            <button 
              onClick={() => onAddPlayer(rightTeam, false)}
              className="w-full px-4 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.color = 'var(--accent-blue)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'
                e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280'
              }}
            >
              + Add Player
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
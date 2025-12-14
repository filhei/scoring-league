import type { GoalDialogState, ActiveGameData, Player } from '../lib/types'

interface GoalDialogProps {
  goalDialog: GoalDialogState
  activeGame: ActiveGameData | null
  isDarkMode: boolean
  onPlayerClick: (player: Player) => void
  onSubmit: () => void
  onCancel: () => void
  onRemoveSelectedPlayer: (type: 'scoring' | 'assisting') => void
}

export function GoalDialog({
  goalDialog,
  activeGame,
  isDarkMode,
  onPlayerClick,
  onSubmit,
  onCancel,
  onRemoveSelectedPlayer
}: GoalDialogProps) {
  if (!goalDialog.isOpen || !activeGame) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
    >
      <div className={`rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header and Selected Players */}
        <div className="mb-6">
          <div className="flex gap-6">
            {/* Title Column */}
            <div className="flex-shrink-0 w-24 h-20 flex flex-col justify-center">
              <h3 className={`text-xl font-bold mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Nytt mål
              </h3>

            </div>
            
            {/* Score Tiles Column */}
            <div className="flex-1 h-20 flex flex-col justify-center space-y-2">
              {/* Goal Tile */}
              <div className="flex items-center gap-2">
                <div className="w-10">
                  <span 
                    className={`text-xs font-medium transition-colors duration-300 ${
                      goalDialog.scoringPlayer 
                        ? 'text-green-500' 
                        : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Mål:
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-between px-2 py-1.5 rounded-md border transition-colors duration-300"
                     style={{
                       backgroundColor: goalDialog.scoringPlayer 
                         ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.1)')
                         : (isDarkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(156, 163, 175, 0.1)'),
                       borderColor: goalDialog.scoringPlayer ? 'var(--goal-color)' : (isDarkMode ? '#4B5563' : '#9CA3AF')
                     }}>
                  <span className={`text-sm font-medium truncate transition-colors duration-300 ${
                    goalDialog.scoringPlayer
                      ? (isDarkMode ? 'text-white' : 'text-gray-900')
                      : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                  }`}>
                    {goalDialog.scoringPlayer ? (goalDialog.scoringPlayer.name || 'Okänd spelare') : 'Ingen vald'}
                  </span>
                  {goalDialog.scoringPlayer && (
                    <button
                      onClick={() => onRemoveSelectedPlayer('scoring')}
                      className={`ml-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 hover:scale-110 ${
                        isDarkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-sm font-bold">×</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Assist Tile */}
              <div className="flex items-center gap-2">
                <div className="w-10">
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    goalDialog.assistingPlayer 
                      ? 'text-blue-500' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Assist:
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-between px-2 py-1.5 rounded-md border transition-colors duration-300"
                     style={{
                       backgroundColor: goalDialog.assistingPlayer 
                         ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)')
                         : (isDarkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(156, 163, 175, 0.1)'),
                       borderColor: goalDialog.assistingPlayer ? 'var(--assist-color)' : (isDarkMode ? '#4B5563' : '#9CA3AF')
                     }}>
                  <span className={`text-sm font-medium truncate transition-colors duration-300 ${
                    goalDialog.assistingPlayer
                      ? (isDarkMode ? 'text-white' : 'text-gray-900')
                      : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                  }`}>
                    {goalDialog.assistingPlayer ? (goalDialog.assistingPlayer.name || 'Okänd spelare') : 'Ingen vald'}
                  </span>
                  {goalDialog.assistingPlayer && (
                    <button
                      onClick={() => onRemoveSelectedPlayer('assisting')}
                      className={`ml-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 hover:scale-110 ${
                        isDarkMode
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-sm font-bold">×</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-hidden min-h-0 mt-4">
          <div className="max-h-80 overflow-y-auto space-y-0 pr-1">
            {/* Scoring Team Players */}
            {goalDialog.team && (
              <>
                {/* Scoring Team Header */}
                <div className="mb-3 px-2 py-2 rounded-lg transition-colors duration-300"
                     style={{
                       backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'
                     }}>
                  <p className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    Välj poängläggare
                  </p>
                </div>
                
                {/* Regular players for scoring team */}
                {(goalDialog.team === 'A' ? activeGame.teamA : activeGame.teamB)
                  .filter(player => {
                    const scoringTeamGoalkeeper = goalDialog.team === 'A' ? activeGame.goalkeepers.teamA : activeGame.goalkeepers.teamB
                    return !scoringTeamGoalkeeper || player.id !== scoringTeamGoalkeeper.id
                  })
                  .map((player) => {
                  const isScoring = goalDialog.scoringPlayer?.id === player.id
                  const isAssisting = goalDialog.assistingPlayer?.id === player.id
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => onPlayerClick(player)}
                      className={`w-full px-2 py-1.5 text-left rounded-sm transition-[background-color] duration-150 box-border ${
                        isScoring
                          ? isDarkMode
                            ? 'bg-gray-600'
                            : 'bg-gray-300'
                          : isAssisting
                            ? isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                            : isDarkMode
                              ? 'bg-gray-900 hover:bg-gray-800'
                              : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center min-w-0">
                        <span className={`font-medium transition-colors duration-300 truncate flex-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {player.name || 'Okänd spelare'}
                        </span>
                        <div className="flex space-x-2 flex-shrink-0 ml-2">
                          {isScoring && (
                            <span className="text-sm px-2 py-1 rounded font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--goal-color)' }}>
                              Mål
                            </span>
                          )}
                          {isAssisting && (
                            <span className="text-sm px-2 py-1 rounded transition-colors duration-300"
                                  style={{ color: 'var(--assist-color)' }}>
                              Assist
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}

                {/* Goalkeeper for scoring team */}
                {(goalDialog.team === 'A' ? activeGame.goalkeepers.teamA : activeGame.goalkeepers.teamB) && (
                  (() => {
                    const goalkeeper = goalDialog.team === 'A' ? activeGame.goalkeepers.teamA : activeGame.goalkeepers.teamB
                    if (!goalkeeper) return null
                    
                    const isScoring = goalDialog.scoringPlayer?.id === goalkeeper.id
                    const isAssisting = goalDialog.assistingPlayer?.id === goalkeeper.id
                    
                    return (
                      <button
                        key={goalkeeper.id}
                        onClick={() => onPlayerClick(goalkeeper)}
                        className={`w-full px-2 py-1.5 text-left rounded-sm transition-[background-color] duration-150 box-border ${
                          isScoring
                            ? isDarkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                            : isAssisting
                              ? isDarkMode
                                ? 'bg-gray-700'
                                : 'bg-gray-200'
                              : isDarkMode
                                ? 'bg-gray-900 hover:bg-gray-800'
                                : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center min-w-0">
                          <span className={`font-medium transition-colors duration-300 truncate flex-1 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {goalkeeper.name || 'Okänd Spelare'}
                          </span>
                          <div className="flex space-x-2 flex-shrink-0 ml-2">
                            {isScoring && (
                              <span className="text-sm px-2 py-1 rounded font-semibold transition-colors duration-300"
                                    style={{ color: 'var(--goal-color)' }}>
                                Mål
                              </span>
                            )}
                            {isAssisting && (
                              <span className="text-sm px-2 py-1 rounded transition-colors duration-300"
                                    style={{ color: 'var(--assist-color)' }}>
                                Assist
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })()
                )}

                {/* Separator */}
                <div className={`my-4 border-t transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-300'
                }`}></div>
                
                {/* Opponent Team Header */}
                <div className="mb-2 px-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide transition-colors duration-300 ${
                    isDarkMode ? 'text-red-400/70' : 'text-red-500/70'
                  }`}>
                    Motståndare
                  </p>
                </div>
                
                {/* Regular players for opponent team */}
                {(goalDialog.team === 'A' ? activeGame.teamB : activeGame.teamA)
                  .filter(player => {
                    const opponentTeamGoalkeeper = goalDialog.team === 'A' ? activeGame.goalkeepers.teamB : activeGame.goalkeepers.teamA
                    return !opponentTeamGoalkeeper || player.id !== opponentTeamGoalkeeper.id
                  })
                  .map((player) => {
                  const isScoring = goalDialog.scoringPlayer?.id === player.id
                  const isAssisting = goalDialog.assistingPlayer?.id === player.id
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => onPlayerClick(player)}
                      className={`w-full px-2 py-1.5 text-left rounded-sm transition-[background-color] duration-150 box-border opacity-50 ${
                        isScoring
                          ? isDarkMode
                            ? 'bg-gray-600'
                            : 'bg-gray-300'
                          : isAssisting
                            ? isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                            : isDarkMode
                              ? 'bg-gray-900 hover:bg-gray-800'
                              : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center min-w-0">
                        <span className={`font-medium transition-colors duration-300 truncate flex-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {player.name || 'Okänd spelare'}
                        </span>
                        <div className="flex space-x-2 flex-shrink-0 ml-2">
                          {isScoring && (
                            <span className="text-sm px-2 py-1 rounded font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--goal-color)' }}>
                              Mål
                            </span>
                          )}
                          {isAssisting && (
                            <span className="text-sm px-2 py-1 rounded transition-colors duration-300"
                                  style={{ color: 'var(--assist-color)' }}>
                              Assist
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}

                {/* Goalkeeper for opponent team */}
                {(goalDialog.team === 'A' ? activeGame.goalkeepers.teamB : activeGame.goalkeepers.teamA) && (
                  (() => {
                    const goalkeeper = goalDialog.team === 'A' ? activeGame.goalkeepers.teamB : activeGame.goalkeepers.teamA
                    if (!goalkeeper) return null
                    
                    const isScoring = goalDialog.scoringPlayer?.id === goalkeeper.id
                    const isAssisting = goalDialog.assistingPlayer?.id === goalkeeper.id
                    
                    return (
                      <button
                        key={goalkeeper.id}
                        onClick={() => onPlayerClick(goalkeeper)}
                        className={`w-full px-2 py-1.5 text-left rounded-sm transition-[background-color] duration-150 box-border opacity-50 ${
                          isScoring
                            ? isDarkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                            : isAssisting
                              ? isDarkMode
                                ? 'bg-gray-700'
                                : 'bg-gray-200'
                              : isDarkMode
                                ? 'bg-gray-900 hover:bg-gray-800'
                                : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center min-w-0">
                          <span className={`font-medium transition-colors duration-300 truncate flex-1 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {goalkeeper.name || 'Okänd Spelare'}
                          </span>
                          <div className="flex space-x-2 flex-shrink-0 ml-2">
                            {isScoring && (
                              <span className="text-sm px-2 py-1 rounded font-semibold transition-colors duration-300"
                                    style={{ color: 'var(--goal-color)' }}>
                                Mål
                              </span>
                            )}
                            {isAssisting && (
                              <span className="text-sm px-2 py-1 rounded transition-colors duration-300"
                                    style={{ color: 'var(--assist-color)' }}>
                                Assist
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })()
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Avbryt
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 text-white"
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
            OK
          </button>
        </div>
      </div>
    </div>
  )
} 
import type { Player, PlayerSelectState } from '../lib/types'
import React from 'react' // Added missing import for React

interface PlayerSelectModalProps {
  showPlayerSelect: PlayerSelectState
  availablePlayers: Player[]
  isDarkMode: boolean
  onPlayerSelect: (player: Player, team: 'A' | 'B') => void
  onClose: () => void
  // New props for multi-selection
  onMultiPlayerSelect?: (players: Player[], team: 'A' | 'B') => void
  currentTeamA?: Player[]
  currentTeamB?: Player[]
  // Add goalkeepers information
  goalkeepers?: { teamA: Player | null; teamB: Player | null }
}

export function PlayerSelectModal({ 
  showPlayerSelect, 
  availablePlayers, 
  isDarkMode, 
  onPlayerSelect, 
  onClose,
  onMultiPlayerSelect,
  currentTeamA = [],
  currentTeamB = [],
  goalkeepers = { teamA: null, teamB: null }
}: PlayerSelectModalProps) {
  if (!showPlayerSelect.team) return null

  // For planned games with multi-selection
  if (showPlayerSelect.isMultiSelect) {
    return <MultiPlayerSelectModal
      team={showPlayerSelect.team}
      availablePlayers={availablePlayers}
      isDarkMode={isDarkMode}
      onPlayerSelect={onMultiPlayerSelect!}
      onClose={onClose}
      currentTeamA={currentTeamA}
      currentTeamB={currentTeamB}
      goalkeepers={goalkeepers}
    />
  }

  // For active games - single player selection (existing behavior)
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
    >
      <div className={`rounded-2xl p-6 max-w-md w-full mx-4 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Select {showPlayerSelect.isGoalkeeper ? 'Goalkeeper' : 'Player'} for Team {showPlayerSelect.team}
        </h3>
        
        <div className="max-h-60 overflow-y-auto space-y-2">
          {availablePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                onPlayerSelect(player, showPlayerSelect.team!)
                onClose()
              }}
              className={`w-full p-4 text-left rounded-lg transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {player.name || 'Okänd spelare'}
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full font-medium transition-colors duration-300 text-white"
            style={{
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              color: isDarkMode ? '#ffffff' : '#1f2937'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#d1d5db'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#e5e7eb'
            }}
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}

// New component for multi-player selection in planned games
interface MultiPlayerSelectModalProps {
  team: 'A' | 'B'
  availablePlayers: Player[]
  isDarkMode: boolean
  onPlayerSelect: (players: Player[], team: 'A' | 'B') => void
  onClose: () => void
  currentTeamA: Player[]
  currentTeamB: Player[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
}

function MultiPlayerSelectModal({
  team,
  availablePlayers,
  isDarkMode,
  onPlayerSelect,
  onClose,
  currentTeamA,
  currentTeamB,
  goalkeepers
}: MultiPlayerSelectModalProps) {
  const [selectedPlayers, setSelectedPlayers] = React.useState<Set<string>>(new Set())
  
  // Initialize selected players with current team members (including goalkeepers)
  React.useEffect(() => {
    const currentTeam = team === 'A' ? currentTeamA : currentTeamB
    const currentGoalkeeper = team === 'A' ? goalkeepers.teamA : goalkeepers.teamB
    
    const currentPlayerIds = new Set(currentTeam.map(p => p.id))
    
    // Add goalkeeper to selected players if exists
    if (currentGoalkeeper) {
      currentPlayerIds.add(currentGoalkeeper.id)
    }
    
    setSelectedPlayers(currentPlayerIds)
  }, [team, currentTeamA, currentTeamB, goalkeepers])

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(playerId)) {
        newSet.delete(playerId)
      } else {
        newSet.add(playerId)
      }
      return newSet
    })
  }

  const handleConfirm = () => {
    // For planned games, we want to assign the selected players to the team
    // The selected players should replace the current team members
    const selectedPlayerObjects = availablePlayers.filter(p => selectedPlayers.has(p.id))
    
    // Note: The goalkeeper handling is done separately in the game actions
    // This function only handles field players, goalkeepers are managed through
    // the goalkeeper tile add/remove functionality
    onPlayerSelect(selectedPlayerObjects, team)
    onClose()
  }

  // Sort players: available players first, then players from other team
  const otherTeam = team === 'A' ? currentTeamB : currentTeamA
  const otherGoalkeeper = team === 'A' ? goalkeepers.teamB : goalkeepers.teamA
  
  const otherTeamIds = new Set(otherTeam.map(p => p.id))
  // Add goalkeeper to other team IDs if exists
  if (otherGoalkeeper) {
    otherTeamIds.add(otherGoalkeeper.id)
  }
  
  const sortedPlayers = [...availablePlayers].sort((a, b) => {
    const aInOtherTeam = otherTeamIds.has(a.id)
    const bInOtherTeam = otherTeamIds.has(b.id)
    
    if (aInOtherTeam && !bInOtherTeam) return 1
    if (!aInOtherTeam && bInOtherTeam) return -1
    return (a.name || '').localeCompare(b.name || '')
  })

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
    >
      <div className={`rounded-2xl p-6 max-w-lg w-full mx-4 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Select Players for Team {team}
        </h3>
        
        <div className="max-h-80 overflow-y-auto space-y-2 mb-6">
          {sortedPlayers.map((player) => {
            const isSelected = selectedPlayers.has(player.id)
            const isInOtherTeam = otherTeamIds.has(player.id)
            
            return (
              <button
                key={player.id}
                onClick={() => handlePlayerToggle(player.id)}
                className={`w-full p-4 text-left rounded-lg transition-colors duration-300 flex items-center space-x-3 ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-blue-700 hover:bg-blue-600 border border-blue-500'
                      : 'bg-blue-50 hover:bg-blue-100 border border-blue-500'
                    : isInOtherTeam
                      ? isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-500 border border-gray-500 opacity-70'
                        : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 opacity-70'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : isDarkMode
                      ? 'border-gray-400'
                      : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                {/* Player name */}
                <div className={`font-medium transition-colors duration-300 ${
                  isSelected
                    ? isDarkMode ? 'text-white' : 'text-gray-800'
                    : isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {player.name || 'Okänd spelare'}
                  {isInOtherTeam && (
                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
                      isDarkMode
                        ? 'bg-gray-500 text-gray-200'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      Team {team === 'A' ? 'B' : 'A'}
                    </span>
                  )}
                  {/* Show goalkeeper indicator if this player is the current goalkeeper */}
                  {(team === 'A' ? goalkeepers.teamA?.id === player.id : goalkeepers.teamB?.id === player.id) && (
                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
                      isDarkMode
                        ? 'bg-yellow-600 text-yellow-100'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      GK
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        
        <div className="flex justify-between items-center">
          <div className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {selectedPlayers.size} spelare vald{selectedPlayers.size !== 1 ? 'a' : ''}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full font-medium transition-colors duration-300 text-white"
              style={{
                backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                color: isDarkMode ? '#ffffff' : '#1f2937'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#d1d5db'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#e5e7eb'
              }}
            >
              Avbryt
            </button>
            
            <button
              onClick={handleConfirm}
              className="px-6 py-2 rounded-full font-medium transition-colors duration-300 text-white"
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
    </div>
  )
} 
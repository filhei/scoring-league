import type { Player, PlayerSelectState } from '../lib/types'

interface PlayerSelectModalProps {
  showPlayerSelect: PlayerSelectState
  availablePlayers: Player[]
  isDarkMode: boolean
  onPlayerSelect: (player: Player, team: 'A' | 'B') => void
  onClose: () => void
}

export function PlayerSelectModal({ 
  showPlayerSelect, 
  availablePlayers, 
  isDarkMode, 
  onPlayerSelect, 
  onClose 
}: PlayerSelectModalProps) {
  if (!showPlayerSelect.team) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
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
              className={`w-full p-4 text-left rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {player.name}
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 text-white"
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
} 
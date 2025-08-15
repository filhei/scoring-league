interface NoActiveGameProps {
  isDarkMode: boolean
}

export function NoActiveGame({ isDarkMode }: NoActiveGameProps) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className={`rounded-2xl p-8 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="text-center">
          <div className={`text-6xl mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
            ⚽
          </div>
          <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            No Active Game
          </h2>
          <p className={`text-lg transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Start a new match to see the game status here.
          </p>
        </div>
      </div>
    </div>
  )
} 
import { DarkModeToggle } from './DarkModeToggle'

interface NavigationProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function Navigation({ isDarkMode, onToggleDarkMode }: NavigationProps) {
  return (
    <div className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gray-900/80 border-gray-700'
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className={`text-2xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Scoring League
        </h1>
        <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
      </div>
    </div>
  )
} 
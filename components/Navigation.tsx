import Link from 'next/link'
import { DarkModeToggle } from './DarkModeToggle'
import { ProfileDropdown } from './ProfileDropdown'

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
        <div className="flex items-center space-x-8">
          <Link 
            href="/" 
            className={`text-2xl font-bold transition-colors duration-300 hover:opacity-80 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}
          >
            Scoring League
          </Link>
          <nav className="flex space-x-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Matches
            </Link>
            <Link 
              href="/results" 
              className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Results
            </Link>
            <Link 
              href="/scoreboard" 
              className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Poängliga
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
          <ProfileDropdown />
        </div>
      </div>
    </div>
  )
} 
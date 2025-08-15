import type { SnackbarState } from '../lib/types'

interface SnackbarProps {
  snackbar: SnackbarState
  isDarkMode: boolean
}

export function Snackbar({ snackbar, isDarkMode }: SnackbarProps) {
  if (!snackbar.isVisible) return null

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 z-[100] ${
      isDarkMode
        ? 'bg-gray-700 border border-gray-600 text-white'
        : 'bg-white border border-gray-300 text-gray-900'
    }`}>
      <div className="flex items-center space-x-2">
        <span className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>⚠️</span>
        <span className="text-sm font-medium">{snackbar.message}</span>
      </div>
    </div>
  )
} 
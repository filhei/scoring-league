interface LoadingOverlayProps {
  isVisible: boolean
  message: string
  isDarkMode?: boolean
}

export function LoadingOverlay({ isVisible, message, isDarkMode = false }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${
      isDarkMode ? 'bg-gray-900 bg-opacity-20' : 'bg-gray-500 bg-opacity-15'
    }`}>
      <div className={`flex flex-col items-center p-8 rounded-lg shadow-lg pointer-events-auto ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Loading spinner - matching the project's pattern */}
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" 
          style={{ borderBottomColor: 'var(--accent-blue)' }}
        ></div>
        
        {/* Loading message */}
        <p className="text-lg font-medium text-center">
          {message}
        </p>
      </div>
    </div>
  )
}

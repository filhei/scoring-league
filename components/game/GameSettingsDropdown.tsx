import React, { useState, useRef, useEffect } from 'react'

interface GameSettingsDropdownProps {
  isDarkMode: boolean
  onDeleteGame?: () => void
  onResetGame?: () => void
  onSwapSides?: () => void
  matchStatus?: string
}

export function GameSettingsDropdown({ isDarkMode, onDeleteGame, onResetGame, onSwapSides, matchStatus }: GameSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDeleteClick = () => {
    setIsOpen(false)
    setShowDeleteConfirmation(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteConfirmation(false)
    onDeleteGame?.()
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false)
  }

  const handleResetClick = () => {
    setIsOpen(false)
    setShowResetConfirmation(true)
  }

  const handleConfirmReset = () => {
    setShowResetConfirmation(false)
    onResetGame?.()
  }

  const handleCancelReset = () => {
    setShowResetConfirmation(false)
  }

  return (
    <>
      {/* Settings Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${
            isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
          }`}
          title="Settings"
        >
          <div className="flex flex-col space-y-0.5">
            <div className={`w-1 h-1 rounded-full ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
            }`}></div>
            <div className={`w-1 h-1 rounded-full ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
            }`}></div>
            <div className={`w-1 h-1 rounded-full ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
            }`}></div>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50 ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="py-1">
              {/* Swap Teams - Mobile Only */}
              {onSwapSides && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onSwapSides()
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 md:hidden ${
                    isDarkMode
                      ? 'text-blue-400 hover:bg-gray-700 hover:text-blue-300'
                      : 'text-blue-600 hover:bg-gray-50 hover:text-blue-700'
                  }`}
                >
                  Swap Teams
                </button>
              )}
              {onResetGame && matchStatus !== 'planned' && (
                <button
                  onClick={handleResetClick}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-yellow-400 hover:bg-gray-700 hover:text-yellow-300'
                      : 'text-yellow-600 hover:bg-gray-50 hover:text-yellow-700'
                  }`}
                >
                  Reset Game
                </button>
              )}
              {onDeleteGame && (
                <button
                  onClick={handleDeleteClick}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-red-400 hover:bg-gray-700 hover:text-red-300'
                      : 'text-red-600 hover:bg-gray-50 hover:text-red-700'
                  }`}
                >
                  Delete Game
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${
            isDarkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Reset Game?
            </h3>
                         <p className={`mb-6 ${
               isDarkMode ? 'text-gray-300' : 'text-gray-600'
             }`}>
               This will reset the timer to zero and remove all goals, but keep the teams. The game will be paused. This action cannot be undone.
             </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelReset}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white"
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
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${
            isDarkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Delete Game?
            </h3>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Are you sure you want to delete this game? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white"
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
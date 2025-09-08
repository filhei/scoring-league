import React, { useState, useRef, useEffect } from 'react'

interface GameSettingsDropdownProps {
  isDarkMode: boolean
  onDeleteGame?: () => void
  onResetGame?: () => void
  onSwapSides?: () => void
  onSwapGoalkeepers?: () => void
  matchStatus?: string
}

export function GameSettingsDropdown({ isDarkMode, onDeleteGame, onResetGame, onSwapSides, onSwapGoalkeepers, matchStatus }: GameSettingsDropdownProps) {
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
                  <span className="inline-flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Byt sida
                  </span>
                </button>
              )}
              {/* Swap Goalkeepers - Mobile Only */}
              {onSwapGoalkeepers && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onSwapGoalkeepers()
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 md:hidden ${
                    isDarkMode
                      ? 'text-green-400 hover:bg-gray-700 hover:text-green-300'
                      : 'text-green-600 hover:bg-gray-50 hover:text-green-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Byt målvakter
                  </span>
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
                  <span className="inline-flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Starta om match
                  </span>
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
                  <span className="inline-flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h10" />
                    </svg>
                    Släng match
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirmation && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        >
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${
            isDarkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Starta om match?
            </h3>
                         <p className={`mb-6 ${
               isDarkMode ? 'text-gray-300' : 'text-gray-600'
             }`}>
               Tiden kommer att återställas till noll och alla mål kommer att tas bort, men lagen behålls. Kan ej ångras.
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
                Avbryt
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
                Starta om match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        >
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 ${
            isDarkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ta bort match?
            </h3>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Är du säker på att du vill ta bort matchen? Kan ej ångras.
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
                Avbryt
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
                Ta bort match
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
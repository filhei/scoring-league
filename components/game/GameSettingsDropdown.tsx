import React, { useState, useRef, useEffect } from 'react'

interface GameSettingsDropdownProps {
  isDarkMode: boolean
  onDeleteGame?: () => void
  onResetGame?: () => void
  onSwapSides?: () => void
  onSwapGoalkeepers?: () => void
  onSwapFieldPlayers?: () => void
  onFillFromAttendees?: () => void
  onRandomizeTeams?: () => void
  matchStatus?: string
  isFillFromAttendeesLoading?: boolean
  isRandomizeTeamsLoading?: boolean
}

export function GameSettingsDropdown({ isDarkMode, onDeleteGame, onResetGame, onSwapSides, onSwapGoalkeepers, onSwapFieldPlayers, onFillFromAttendees, onRandomizeTeams, matchStatus, isFillFromAttendeesLoading = false, isRandomizeTeamsLoading = false }: GameSettingsDropdownProps) {
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
                      ? 'text-white hover:bg-gray-700 hover:text-white'
                      : 'text-black hover:bg-gray-50 hover:text-black'
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
                      ? 'text-white hover:bg-gray-700 hover:text-white'
                      : 'text-black hover:bg-gray-50 hover:text-black'
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
              {/* Swap Field Players */}
              {onSwapFieldPlayers && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onSwapFieldPlayers()
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-white hover:bg-gray-700 hover:text-white'
                      : 'text-black hover:bg-gray-50 hover:text-black'
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
                    Byt utespelare
                  </span>
                </button>
              )}
              {/* Fill from Attendees */}
              {onFillFromAttendees && (
                <button
                  onClick={() => {
                    if (!isFillFromAttendeesLoading) {
                      setIsOpen(false)
                      onFillFromAttendees()
                    }
                  }}
                  disabled={isFillFromAttendeesLoading}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 ${
                    isFillFromAttendeesLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : isDarkMode
                      ? 'text-white hover:bg-gray-700 hover:text-white'
                      : 'text-black hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {isFillFromAttendeesLoading ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    )}
                    {isFillFromAttendeesLoading ? 'Autofyller...' : 'Autofyll från Bokat.se'}
                  </span>
                </button>
              )}
              {/* Randomize Teams */}
              {onRandomizeTeams && (
                <button
                  onClick={() => {
                    if (!isRandomizeTeamsLoading) {
                      setIsOpen(false)
                      onRandomizeTeams()
                    }
                  }}
                  disabled={isRandomizeTeamsLoading}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 ${
                    isRandomizeTeamsLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'text-white hover:bg-gray-700 hover:text-white'
                        : 'text-black hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {isRandomizeTeamsLoading ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    )}
                    {isRandomizeTeamsLoading ? 'Slumpar...' : 'Slumpa lag'}
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
               Timern och målen nollställs, men lagen behålls.
               
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
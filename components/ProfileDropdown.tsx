'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/auth-context'
import { useDarkMode } from '../lib/hooks/useDarkMode'

export function ProfileDropdown() {
  const { isDarkMode } = useDarkMode()
  const { user, player, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  // If not authenticated, show sign in button
  if (!user) {
    return (
      <Link
        href="/login"
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isDarkMode 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }`}
        aria-label="Profile menu"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {player && (
            <div className={`px-4 py-2 text-sm border-b ${
              isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
            }`}>
              <div className="font-medium">{player.name || 'Okänd Spelare'}</div>
              <div className="text-xs opacity-75">{user.email}</div>
            </div>
          )}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-2 text-sm transition-colors ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

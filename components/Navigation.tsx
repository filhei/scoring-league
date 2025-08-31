'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DarkModeToggle } from './DarkModeToggle'
import { ProfileDropdown } from './ProfileDropdown'

interface NavigationProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function Navigation({ isDarkMode, onToggleDarkMode }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element
      if (!target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gray-900/80 border-gray-700'
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left side - Hamburger menu and title */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {/* Hamburger Menu Button - Visible only on mobile */}
          <button
            onClick={toggleMobileMenu}
            className="hamburger-button md:hidden p-2 rounded-md transition-colors duration-200 flex-shrink-0"
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`block w-5 h-0.5 transition-all duration-300 ${
                isDarkMode ? 'bg-white' : 'bg-gray-800'
              } ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
              <span className={`block w-5 h-0.5 transition-all duration-300 mt-1 ${
                isDarkMode ? 'bg-white' : 'bg-gray-800'
              } ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-5 h-0.5 transition-all duration-300 mt-1 ${
                isDarkMode ? 'bg-white' : 'bg-gray-800'
              } ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
            </div>
          </button>

          <Link 
            href="/" 
            className={`font-bold transition-colors duration-300 hover:opacity-80 whitespace-nowrap overflow-hidden text-ellipsis ${
              isDarkMode ? 'text-white' : 'text-black'
            } text-lg sm:text-xl md:text-2xl`}
          >
            Poängliga
          </Link>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Matcher
            </Link>
            <Link 
              href="/results" 
              className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Resultat
            </Link>
            <Link 
              href="/scoreboard" 
              className={`text-sm font-medium transition-colors duration-300 hover:opacity-80 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Tabell
            </Link>
          </nav>
        </div>

        {/* Right side - Dark mode toggle (desktop only) and profile dropdown */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Dark mode toggle - hidden on mobile, shown in menu instead */}
          <div className="hidden md:block">
            <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
          </div>
          <div className="pr-2">
            <ProfileDropdown />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu md:hidden absolute top-full left-0 right-0 z-50">
          <div className={`border-t transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
          }`}>
            <nav className="px-6 py-4 space-y-4">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-base font-medium transition-colors duration-300 hover:opacity-80 py-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Matcher
              </Link>
              <Link 
                href="/results" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-base font-medium transition-colors duration-300 hover:opacity-80 py-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Resultat
              </Link>
              <Link 
                href="/scoreboard" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-base font-medium transition-colors duration-300 hover:opacity-80 py-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Tabell
              </Link>
              
              {/* Dark mode toggle in mobile menu */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between py-2">
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Mörkt Läge
                  </span>
                  <DarkModeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
} 
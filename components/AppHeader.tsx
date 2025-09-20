'use client'

import { Navigation } from './Navigation'
import { useDarkMode } from '../lib/hooks/useDarkMode'

export function AppHeader() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  return <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
}



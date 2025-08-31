'use client'

import { Suspense, useState, useEffect } from 'react'
import { Navigation } from '../components/Navigation'
import { ActiveGameWrapper } from '../components/ActiveGameWrapper'
import { GameLoadingSkeleton } from '../components/ui/loading-skeleton'
import { useAuth } from '../lib/auth-context'
import { useDarkMode } from '../lib/hooks/useDarkMode'
import type { ActiveGameData, Player, Match } from '../lib/types'

// PROMPT:
// Regarding drag and drop of goalkeepers.

// Issues:

// When dragged, the player who was goalie should behave exactly like any other dragged player. Use the same logic and code. Refactor if necessary


// Wanted behavior:
// The goalie tile in the list should remain when dragstart on a goalie, but it should display the "empty state" (which has the text "ingen målvakt"), because there should always be a goalie tile at the top of each team, even if there is no assigned goalie. At the same time, a dragfeedback should appear by the mouse which should be exactly the same as when a field player is dragged. The same logic should apply, so any player (including one dragged from the goalie position) should be placeable in any list position of both teams, including both goalie positions)

// Therefore we need to fix the drag and drop from a goalie tile specifically to behave like the other players, with the exception that the original tile is also left in place (but altered)

// Are these instructions clear? Ask me to clarify if you need anything. Condense the information to maximum readability and be concise.

export default function Home() {
  const { user, player, loading } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)

  // Hide welcome banner after 3 seconds when user logs in
  useEffect(() => {
    if (user && player) {
      setShowWelcomeBanner(true)
      const timer = setTimeout(() => {
        setShowWelcomeBanner(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    } else {
      setShowWelcomeBanner(false)
    }
  }, [user, player])

  if (loading) {
    return <GameLoadingSkeleton />
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'sm:bg-gray-900 text-white' : 'sm:bg-gray-50 text-gray-900'
    }`}>
      <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      
      {/* Auth Status Banner */}
      {user && player && showWelcomeBanner && (
        <div className={`px-4 py-2 text-sm transition-opacity duration-500 sm:px-6 ${
          isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
        }`}>
          Välkommen tillbaka, {player.name || 'Okänd Spelare'}! 
          {!user.email_confirmed_at && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-400">
              (Kontrollera din e-post för att bekräfta ditt konto)
            </span>
          )}
        </div>
      )}

      <main className="sm:max-w-6xl sm:mx-auto sm:px-6 sm:py-8">
        <Suspense fallback={<GameLoadingSkeleton />}>
          <ActiveGameWrapper 
            initialActiveGame={null}
            availablePlayers={[]}
            allGames={[]}
          />
        </Suspense>
      </main>
    </div>
  )
}

import { Suspense } from 'react'
import { supabase } from '../lib/supabase'
import { Navigation } from '../components/Navigation'
import { NoActiveGame } from '../components/NoActiveGame'
import { ActiveGameWrapper } from '../components/ActiveGameWrapper'
import { GameLoadingSkeleton } from '../components/ui/loading-skeleton'
import type { ActiveGameData, Player, Match } from '../lib/types'

// PROMPT:
// Regarding drag and drop of goalkeepers.

// Issues:

// When dragged, the player who was goalie should behave exactly like any other dragged player. Use the same logic and code. Refactor if necessary


// Wanted behavior:
// The goalie tile in the list should remain when dragstart on a goalie, but it should display the "empty state" (which has the text "ingen målvakt"), because there should always be a goalie tile at the top of each team, even if there is no assigned goalie. At the same time, a dragfeedback should appear by the mouse which should be exactly the same as when a field player is dragged. The same logic should apply, so any player (including one dragged from the goalie position) should be placeable in any list position of both teams, including both goalie positions)

// Therefore we need to fix the drag and drop from a goalie tile specifically to behave like the other players, with the exception that the original tile is also left in place (but altered)

// Are these instructions clear? Ask me to clarify if you need anything. Condense the information to maximum readability and be concise.

// Server-side data fetching
async function getAvailablePlayers(): Promise<Player[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching available players:', error)
    return []
  }

  return players || []
}

async function getActiveGame(): Promise<ActiveGameData | null> {
  try {
    // Get active or paused match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .in('match_status', ['active', 'paused'])
      .single()

    if (matchError) {
      if (matchError.code === 'PGRST116') return null // No active match
      throw matchError
    }

    if (!match) return null

    // Get match players
    const { data: matchPlayers, error: playersError } = await supabase
      .from('match_players')
      .select(`
        *,
        players (*)
      `)
      .eq('match_id', match.id)

    if (playersError) throw playersError

    // Get scores
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('*')
      .eq('match_id', match.id)

    if (scoresError) throw scoresError

    if (matchPlayers) {
      const teamA = matchPlayers
        .filter(mp => mp.team === 'A' && !mp.is_goalkeeper)
        .map(mp => mp.players)
        .filter(Boolean) as Player[]
      
      const teamB = matchPlayers
        .filter(mp => mp.team === 'B' && !mp.is_goalkeeper)
        .map(mp => mp.players)
        .filter(Boolean) as Player[]

      const goalkeepers = {
        teamA: matchPlayers.find(mp => mp.team === 'A' && mp.is_goalkeeper)?.players || null,
        teamB: matchPlayers.find(mp => mp.team === 'B' && mp.is_goalkeeper)?.players || null
      }

      return {
        match,
        teamA,
        teamB,
        scores: scores || [],
        goalkeepers
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching active game:', error)
    return null
  }
}

async function getPlannedGames(): Promise<Match[]> {
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('match_status', 'planned')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching planned games:', error)
      return []
    }

    return matches || []
  } catch (error) {
    console.error('Error fetching planned games:', error)
    return []
  }
}

export default async function Home() {
  const [activeGame, availablePlayers, plannedGames] = await Promise.all([
    getActiveGame(),
    getAvailablePlayers(),
    getPlannedGames()
  ])

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Suspense fallback={<GameLoadingSkeleton />}>
        <ActiveGameWrapper 
          initialActiveGame={activeGame}
          availablePlayers={availablePlayers}
          plannedGames={plannedGames}
        />
      </Suspense>
    </div>
  )
}

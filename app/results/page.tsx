import { Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { ResultsWrapper } from '../../components/ResultsWrapper'
import { GameLoadingSkeleton } from '../../components/ui/loading-skeleton'
import type { PastGameData } from '../../lib/types'

// Server-side data fetching for past games
async function getPastGames(): Promise<PastGameData[]> {
  try {
    // Get finished matches
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('match_status', 'finished')
      .order('start_time', { ascending: false })

    if (matchError) throw matchError

    if (!matches || matches.length === 0) return []

    // Get match players and scores for all matches
    const matchIds = matches.map(match => match.id)
    
    const { data: matchPlayers, error: playersError } = await supabase
      .from('match_players')
      .select(`
        *,
        players (*)
      `)
      .in('match_id', matchIds)

    if (playersError) throw playersError

    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('*')
      .in('match_id', matchIds)

    if (scoresError) throw scoresError

    // Process data into PastGameData format
    const pastGames: PastGameData[] = matches.map(match => {
      const matchPlayerData = matchPlayers?.filter(mp => mp.match_id === match.id) || []
      const matchScores = scores?.filter(s => s.match_id === match.id) || []

      const teamA = matchPlayerData
        .filter(mp => mp.team === 'A' && !mp.is_goalkeeper)
        .map(mp => mp.players)
        .filter(Boolean) as any[]

      const teamB = matchPlayerData
        .filter(mp => mp.team === 'B' && !mp.is_goalkeeper)
        .map(mp => mp.players)
        .filter(Boolean) as any[]

      const goalkeepers = {
        teamA: matchPlayerData.find(mp => mp.team === 'A' && mp.is_goalkeeper)?.players || null,
        teamB: matchPlayerData.find(mp => mp.team === 'B' && mp.is_goalkeeper)?.players || null
      }

      const teamAScore = matchScores.filter(s => s.team === 'A').length
      const teamBScore = matchScores.filter(s => s.team === 'B').length

      return {
        match,
        teamA,
        teamB,
        goalkeepers,
        scores: {
          teamA: teamAScore,
          teamB: teamBScore
        },
        teamWithVests: match.team_with_vests
      }
    })

    return pastGames
  } catch (error) {
    console.error('Error fetching past games:', error)
    return []
  }
}

export default async function ResultsPage() {
  const pastGames = await getPastGames()

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Suspense fallback={<GameLoadingSkeleton />}>
        <ResultsWrapper pastGames={pastGames} />
      </Suspense>
    </div>
  )
} 
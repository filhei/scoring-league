import { Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { ScoreboardWrapper } from '../../components/ScoreboardWrapper'
import { GameLoadingSkeleton } from '../../components/ui/loading-skeleton'
import type { PlayerStats } from '../../lib/types'

// Server-side data fetching for scoreboard
async function getScoreboardData(): Promise<PlayerStats[]> {
  try {
    // Get all finished matches
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('match_status', 'finished')

    if (matchError) throw matchError

    if (!matches || matches.length === 0) return []

    // Get all match players and scores
    const matchIds = matches.map(match => match.id)
    
    const { data: matchPlayers, error: playersError } = await supabase
      .from('match_players')
      .select(`
        *,
        players (*),
        matches (start_time)
      `)
      .in('match_id', matchIds)

    if (playersError) throw playersError

    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select(`
        *,
        scoring_player:players!scores_scoring_player_id_fkey (*),
        assisting_player:players!scores_assisting_player_id_fkey (*)
      `)
      .in('match_id', matchIds)

    if (scoresError) throw scoresError

    // Process data into PlayerStats format
    const playerStatsMap = new Map<string, {
      player: any,
      gamesPlayed: number,
      sessionsPlayed: Set<string>,
      wins: number,
      losses: number,
      goals: number,
      assists: number,
      points: number
    }>()

    // Initialize all players who participated in any match
    matchPlayers?.forEach(mp => {
      if (mp.players) {
        const playerId = mp.players.id
        if (!playerStatsMap.has(playerId)) {
          playerStatsMap.set(playerId, {
            player: mp.players,
            gamesPlayed: 0,
            sessionsPlayed: new Set(),
            wins: 0,
            losses: 0,
            goals: 0,
            assists: 0,
            points: 0
          })
        }
      }
    })

    // Calculate statistics for each match
    matches.forEach(match => {
      const matchPlayerData = matchPlayers?.filter(mp => mp.match_id === match.id) || []
      const matchScores = scores?.filter(s => s.match_id === match.id) || []
      
      // Get team scores
      const teamAScore = matchScores.filter(s => s.team === 'A').length
      const teamBScore = matchScores.filter(s => s.team === 'B').length
      
      // Determine winner
      const winner = teamAScore > teamBScore ? 'A' : teamBScore > teamAScore ? 'B' : null
      
      // Get unique session date
      const sessionDate = new Date(match.start_time).toDateString()
      
      // Update player statistics
      matchPlayerData.forEach(mp => {
        if (mp.players) {
          const playerId = mp.players.id
          const stats = playerStatsMap.get(playerId)
          
          if (stats) {
            stats.gamesPlayed++
            stats.sessionsPlayed.add(sessionDate)
            
            if (winner) {
              if (mp.team === winner) {
                stats.wins++
              } else {
                stats.losses++
              }
            }
          }
        }
      })
      
      // Update goals and assists
      matchScores.forEach(score => {
        if (score.scoring_player) {
          const stats = playerStatsMap.get(score.scoring_player.id)
          if (stats) {
            stats.goals++
          }
        }
        
        if (score.assisting_player) {
          const stats = playerStatsMap.get(score.assisting_player.id)
          if (stats) {
            stats.assists++
          }
        }
      })
    })

    // Calculate points and convert to array
    const playerStats: PlayerStats[] = Array.from(playerStatsMap.values()).map((stats, index) => ({
      player: stats.player,
      rank: 0, // Will be set after sorting
      gamesPlayed: stats.gamesPlayed,
      sessionsPlayed: stats.sessionsPlayed.size,
      wins: stats.wins,
      losses: stats.losses,
      goals: stats.goals,
      assists: stats.assists,
      points: stats.goals * 3 + stats.assists * 1 // 3 points per goal, 1 point per assist
    }))

    // Sort by ranking criteria: points (desc), goals (desc), wins (desc), name (asc)
    playerStats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goals !== a.goals) return b.goals - a.goals
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.player.name.localeCompare(b.player.name)
    })

    // Add rank
    return playerStats.map((stats, index) => ({
      ...stats,
      rank: index + 1
    }))

  } catch (error) {
    console.error('Error fetching scoreboard data:', error)
    return []
  }
}

export default async function ScoreboardPage() {
  const scoreboardData = await getScoreboardData()

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Suspense fallback={<GameLoadingSkeleton />}>
        <ScoreboardWrapper scoreboardData={scoreboardData} />
      </Suspense>
    </div>
  )
} 
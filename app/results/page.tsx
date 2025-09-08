'use client'

import { Suspense, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ResultsWrapper } from '../../components/ResultsWrapper'
import { GameLoadingSkeleton } from '../../components/ui/loading-skeleton'
import type { PastGameData, PastGameDetailedData } from '../../lib/types'

// Client-side data fetching for past games
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

    // Calculate game count for all matches
    const { data: allMatches, error: countError } = await supabase
      .from('matches')
      .select('id, created_at')
      .order('created_at', { ascending: true })

    if (countError) throw countError

    // Create a map of match ID to game count
    const gameCountMap = new Map<string, number>()
    allMatches?.forEach((match, index) => {
      gameCountMap.set(match.id, index + 1)
    })

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
        match: {
          ...match,
          gameCount: gameCountMap.get(match.id) || 1
        },
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

// Client-side data fetching for detailed past game
async function getPastGameDetailed(matchId: string): Promise<PastGameDetailedData | null> {
  try {
    // Get the specific match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .eq('match_status', 'finished')
      .single()

    if (matchError || !match) return null

    // Calculate game count by finding position in all matches (chronological order)
    const { data: allMatches, error: countError } = await supabase
      .from('matches')
      .select('id, created_at')
      .order('created_at', { ascending: true })

    if (countError) return null

    const gameCount = allMatches?.findIndex(m => m.id === match.id) + 1 || 1

    // Add game count to match
    const matchWithCount = { ...match, gameCount }

    // Get match players
    const { data: matchPlayers, error: playersError } = await supabase
      .from('match_players')
      .select(`
        *,
        players (*)
      `)
      .eq('match_id', matchId)

    if (playersError) return null

    // Get all scores for this match
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('*')
      .eq('match_id', matchId)
      .order('score_time', { ascending: true })

    if (scoresError) return null

    const teamA = matchPlayers
      ?.filter(mp => mp.team === 'A' && !mp.is_goalkeeper)
      .map(mp => mp.players)
      .filter(Boolean) as any[] || []

    const teamB = matchPlayers
      ?.filter(mp => mp.team === 'B' && !mp.is_goalkeeper)
      .map(mp => mp.players)
      .filter(Boolean) as any[] || []

    const goalkeepers = {
      teamA: matchPlayers?.find(mp => mp.team === 'A' && mp.is_goalkeeper)?.players || null,
      teamB: matchPlayers?.find(mp => mp.team === 'B' && mp.is_goalkeeper)?.players || null
    }

    return {
      match: matchWithCount,
      teamA,
      teamB,
      goalkeepers,
      scores: scores || [],
      teamWithVests: match.team_with_vests
    }
  } catch (error) {
    console.error('Error fetching detailed past game:', error)
    return null
  }
}

export default function ResultsPage() {
  const [pastGames, setPastGames] = useState<PastGameData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPastGames = async () => {
      try {
        const games = await getPastGames()
        setPastGames(games)
      } catch (error) {
        console.error('Error fetching past games:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPastGames()
  }, [])

  if (loading) {
    return <GameLoadingSkeleton />
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Suspense fallback={<GameLoadingSkeleton />}>
        <ResultsWrapper pastGames={pastGames} getPastGameDetailed={getPastGameDetailed} />
      </Suspense>
    </div>
  )
} 
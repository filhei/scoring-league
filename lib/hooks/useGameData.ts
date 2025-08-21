import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { ActiveGameData, Player, Match } from '../types'

// Data fetching functions
async function fetchAvailablePlayers(): Promise<Player[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_active', true)

  if (error) throw error
  return players || []
}

async function fetchActiveGame(): Promise<ActiveGameData | null> {
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
}

async function fetchAllGames(): Promise<Match[]> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .in('match_status', ['planned', 'active', 'paused'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return matches || []
}

async function fetchGameById(gameId: string): Promise<ActiveGameData | null> {
  // Fetch a specific game by ID regardless of status
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', gameId)
    .single()

  if (matchError) {
    if (matchError.code === 'PGRST116') return null // Game not found
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
}

export function useGameData(targetGameId?: string) {
  const queryClient = useQueryClient()

  // Query for available players
  const { data: availablePlayers = [], isLoading: playersLoading } = useQuery({
    queryKey: ['availablePlayers'],
    queryFn: fetchAvailablePlayers,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Query for active game - use targeted query if we have a specific game ID
  const { 
    data: activeGame, 
    isLoading: gameLoading, 
    error: gameError 
  } = useQuery({
    queryKey: targetGameId ? ['game', targetGameId] : ['activeGame'],
    queryFn: targetGameId ? () => fetchGameById(targetGameId) : fetchActiveGame,
    refetchInterval: 5000, // Real-time updates every 5 seconds
    staleTime: 0, // Always consider stale for real-time data
  })

  // Query for all games
  const { 
    data: allGames = [], 
    isLoading: allGamesLoading 
  } = useQuery({
    queryKey: ['allGames'],
    queryFn: fetchAllGames,
    refetchInterval: 5000, // Real-time updates every 5 seconds
    staleTime: 0, // Always consider stale for real-time data
  })

  // Mutation for refreshing game data
  const refreshGameData = () => {
    if (targetGameId) {
      queryClient.invalidateQueries({ queryKey: ['game', targetGameId] })
    } else {
      queryClient.invalidateQueries({ queryKey: ['activeGame'] })
    }
    queryClient.invalidateQueries({ queryKey: ['allGames'] })
  }

  return {
    activeGame,
    availablePlayers,
    allGames,
    loading: playersLoading || gameLoading || allGamesLoading,
    // More granular loading states for better UX
    playersLoading,
    gameLoading,
    allGamesLoading,
    error: gameError,
    refreshGameData
  }
} 
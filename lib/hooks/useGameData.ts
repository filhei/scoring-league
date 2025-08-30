import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from '../auth-context'
import type { ActiveGameData, Player, Match } from '../types'

// Data fetching functions
async function fetchAvailablePlayers(): Promise<Player[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_active', true)
    .not('name', 'is', null) // Ensure name is not nullified
    .not('user_id', 'is', null) // Ensure user_id is not nullified

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

  // Calculate game count by finding position in all matches (chronological order)
  const { data: allMatches, error: countError } = await supabase
    .from('matches')
    .select('id, created_at')
    .order('created_at', { ascending: true })

  if (countError) throw countError

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
      match: matchWithCount,
      teamA,
      teamB,
      scores: scores || [],
      goalkeepers
    }
  }

  return null
}

async function fetchAllGames(): Promise<Match[]> {
  // First, get all matches to calculate the correct game count
  const { data: allMatches, error: allMatchesError } = await supabase
    .from('matches')
    .select('id, created_at')
    .order('created_at', { ascending: true })

  if (allMatchesError) throw allMatchesError

  // Create a map of match ID to game count
  const gameCountMap = new Map<string, number>()
  allMatches?.forEach((match, index) => {
    gameCountMap.set(match.id, index + 1)
  })

  // Now get the filtered matches (planned, active, paused)
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .in('match_status', ['planned', 'active', 'paused'])
    .order('created_at', { ascending: true })

  if (error) throw error
  
  // Add game count to each match using the map
  const matchesWithCount = (matches || []).map((match) => ({
    ...match,
    gameCount: gameCountMap.get(match.id) || 1
  }))
  
  return matchesWithCount
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

  // Calculate game count by finding position in all matches (chronological order)
  const { data: allMatches, error: countError } = await supabase
    .from('matches')
    .select('id, created_at')
    .order('created_at', { ascending: true })

  if (countError) throw countError

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
      match: matchWithCount,
      teamA,
      teamB,
      scores: scores || [],
      goalkeepers
    }
  }

  return null
}

export function useGameData() {
  const queryClient = useQueryClient()
  const { user, player, loading: authLoading } = useAuth()

  // Query for available players - very infrequent updates
  const { data: availablePlayers = [], isLoading: playersLoading } = useQuery({
    queryKey: ['availablePlayers'],
    queryFn: fetchAvailablePlayers,
    staleTime: 5 * 60 * 1000, // 5 minutes - players rarely change
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    enabled: !authLoading,
  })

  // Query for active game - very conservative refetch intervals
  const { 
    data: activeGame, 
    isLoading: gameLoading, 
    error: gameError 
  } = useQuery({
    queryKey: ['activeGame'],
    queryFn: fetchActiveGame,
    refetchInterval: false, // Disable automatic refetching entirely
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    staleTime: 60 * 1000, // 1 minute
    retry: 0, // No retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    enabled: !authLoading,
  })

  // Query for all games - very infrequent updates
  const { 
    data: allGames = [], 
    isLoading: allGamesLoading 
  } = useQuery({
    queryKey: ['allGames'],
    queryFn: fetchAllGames,
    refetchInterval: false, // Disable automatic refetching entirely
    refetchIntervalInBackground: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0, // No retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    enabled: !authLoading,
  })

  // Mutation for refreshing game data
  const refreshGameData = () => {
    queryClient.invalidateQueries({ queryKey: ['activeGame'] })
    queryClient.refetchQueries({ queryKey: ['activeGame'] })
    queryClient.invalidateQueries({ queryKey: ['allGames'] })
    queryClient.refetchQueries({ queryKey: ['allGames'] })
  }

  return {
    activeGame,
    availablePlayers,
    allGames,
    loading: playersLoading || gameLoading || allGamesLoading || authLoading,
    // More granular loading states for better UX
    playersLoading,
    gameLoading,
    allGamesLoading,
    error: gameError,
    refreshGameData
  }
} 
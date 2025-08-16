import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { ActiveGameData, Player } from '../types'

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

export function useGameData() {
  const queryClient = useQueryClient()

  // Query for available players
  const { data: availablePlayers = [], isLoading: playersLoading } = useQuery({
    queryKey: ['availablePlayers'],
    queryFn: fetchAvailablePlayers,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Query for active game
  const { 
    data: activeGame, 
    isLoading: gameLoading, 
    error: gameError 
  } = useQuery({
    queryKey: ['activeGame'],
    queryFn: fetchActiveGame,
    refetchInterval: 5000, // Real-time updates every 5 seconds
    staleTime: 0, // Always consider stale for real-time data
  })

  // Mutation for refreshing game data
  const refreshGameData = () => {
    queryClient.invalidateQueries({ queryKey: ['activeGame'] })
  }

  return {
    activeGame,
    availablePlayers,
    loading: playersLoading || gameLoading,
    error: gameError,
    refreshGameData
  }
} 
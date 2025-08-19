import type { PlayerStats, Score, Player, ActiveGameData, Match } from './types'

/**
 * Calculate player statistics (goals and assists)
 */
export const getPlayerStats = (playerId: string, scores: Score[]): PlayerStats => {
  const goals = scores.filter(score => score.scoring_player_id === playerId).length
  const assists = scores.filter(score => score.assisting_player_id === playerId).length
  
  return { goals, assists }
}

/**
 * Format player stats for display
 */
export const formatPlayerStats = (stats: PlayerStats): string => {
  if (stats.goals === 0 && stats.assists === 0) return ''
  return `(${stats.goals} + ${stats.assists})`
}

/**
 * Calculate team scores
 */
export const getTeamScore = (scores: Score[], team: 'A' | 'B'): number => {
  return scores.filter(score => score.team === team).length
}

/**
 * Get available players not currently in the match (excluding goalkeepers)
 */
export const getAvailablePlayersForSelection = (
  availablePlayers: Player[],
  teamA: Player[],
  teamB: Player[],
  goalkeepers?: { teamA: Player | null; teamB: Player | null }
): Player[] => {
  const currentPlayerIds = [...teamA, ...teamB].map(p => p.id)
  
  // Also exclude assigned goalkeepers
  if (goalkeepers) {
    if (goalkeepers.teamA) {
      currentPlayerIds.push(goalkeepers.teamA.id)
    }
    if (goalkeepers.teamB) {
      currentPlayerIds.push(goalkeepers.teamB.id)
    }
  }
  
  return availablePlayers.filter(p => !currentPlayerIds.includes(p.id))
}

/**
 * Convert a planned game to ActiveGameData format
 */
export const convertPlannedGameToActiveGameData = async (match: Match): Promise<ActiveGameData> => {
  const { supabase } = await import('./supabase')
  
  // Get match players
  const { data: matchPlayers, error: playersError } = await supabase
    .from('match_players')
    .select(`
      *,
      players (*)
    `)
    .eq('match_id', match.id)

  if (playersError) throw playersError

  // Get scores (should be empty for planned games)
  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('*')
    .eq('match_id', match.id)

  if (scoresError) throw scoresError

  const teamA = matchPlayers
    ?.filter(mp => mp.team === 'A' && !mp.is_goalkeeper)
    .map(mp => mp.players)
    .filter(Boolean) as Player[] || []
  
  const teamB = matchPlayers
    ?.filter(mp => mp.team === 'B' && !mp.is_goalkeeper)
    .map(mp => mp.players)
    .filter(Boolean) as Player[] || []

  const goalkeepers = {
    teamA: matchPlayers?.find(mp => mp.team === 'A' && mp.is_goalkeeper)?.players || null,
    teamB: matchPlayers?.find(mp => mp.team === 'B' && mp.is_goalkeeper)?.players || null
  }

  return {
    match,
    teamA,
    teamB,
    scores: scores || [],
    goalkeepers
  }
} 
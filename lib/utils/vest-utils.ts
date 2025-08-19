import type { Database } from '../../supabase/database.types'

type Match = Database['public']['Tables']['matches']['Row']

export function getTeamWithVests(match: Match | null): 'A' | 'B' | null {
  if (!match) return null
  return match.team_with_vests as 'A' | 'B' | null
}

export function hasVests(match: Match | null, team: 'A' | 'B'): boolean {
  const teamWithVests = getTeamWithVests(match)
  return teamWithVests === team
}

export function getToggleVestTeam(currentTeamWithVests: 'A' | 'B' | null, targetTeam: 'A' | 'B'): 'A' | 'B' | null {
  // If target team already has vests, remove them
  if (currentTeamWithVests === targetTeam) {
    return null
  }
  
  // Otherwise, give vests to target team (this will automatically remove from other team)
  return targetTeam
} 
import type { Database } from '../supabase/database.types'

// Re-export database types for convenience
export type Match = Database['public']['Tables']['matches']['Row'] & {
  gameCount?: number // Optional game count for display purposes
}
export type Player = Database['public']['Tables']['players']['Row']
export type MatchPlayer = Database['public']['Tables']['match_players']['Row']
export type Score = Database['public']['Tables']['scores']['Row']

// Local interface types
export interface PlayerStats {
  player: Player
  rank: number
  gamesPlayed: number
  sessionsPlayed: number
  wins: number
  losses: number
  goals: number
  assists: number
  points: number
}

export interface ActiveGameData {
  match: Match
  teamA: Player[]
  teamB: Player[]
  scores: Score[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
}

export interface PastGameData {
  match: Match
  teamA: Player[]
  teamB: Player[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
  scores: { teamA: number; teamB: number }
  teamWithVests: string | null
}

export interface PastGameDetailedData {
  match: Match
  teamA: Player[]
  teamB: Player[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
  scores: Score[]
  teamWithVests: string | null
}

export interface GoalDialogState {
  isOpen: boolean
  team: 'A' | 'B' | null
  scoringPlayer: Player | null
  assistingPlayer: Player | null
}

export interface SnackbarState {
  isVisible: boolean
  message: string
}

export interface PlayerSelectState {
  team: 'A' | 'B' | null
  isGoalkeeper: boolean
  isMultiSelect?: boolean // New field for planned games
} 
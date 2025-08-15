import { supabase } from './supabase'
import type { Database } from '../supabase/database.types'

type Match = Database['public']['Tables']['matches']['Row']
type MatchUpdate = Database['public']['Tables']['matches']['Update']

export class MatchService {
  /**
   * Start a match - changes status from 'planned' to 'active'
   */
  static async startMatch(matchId: string): Promise<Match | null> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({
          match_status: 'active',
          start_time: new Date().toISOString(),
          duration: null,
          pause_duration: null
        })
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error starting match:', error)
      return null
    }
  }

  /**
   * Pause an active match - saves current duration and sets status to 'paused'
   */
  static async pauseMatch(matchId: string): Promise<Match | null> {
    try {
      // Get current match data
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError || !match) throw fetchError || new Error('Match not found')

      const now = new Date()
      const startTime = new Date(match.start_time)
      const pauseDuration = match.pause_duration ? this.parseInterval(match.pause_duration) : 0
      
      // Calculate current duration: NOW - start_time - pause_duration
      const currentDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pauseDuration

      const { data, error } = await supabase
        .from('matches')
        .update({
          match_status: 'paused',
          duration: `${currentDuration} seconds`
        })
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error pausing match:', error)
      return null
    }
  }

  /**
   * Resume a paused match - calculates new pause_duration and sets status to 'active'
   */
  static async resumeMatch(matchId: string): Promise<Match | null> {
    try {
      // Get current match data
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError || !match) throw fetchError || new Error('Match not found')

      const now = new Date()
      const startTime = new Date(match.start_time)
      const duration = match.duration ? this.parseInterval(match.duration) : 0
      
      // Calculate new pause_duration: NOW - start_time - duration
      const newPauseDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - duration

      const { data, error } = await supabase
        .from('matches')
        .update({
          match_status: 'active',
          pause_duration: `${newPauseDuration} seconds`
        })
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error resuming match:', error)
      return null
    }
  }

  /**
   * End a match - calculates final duration and sets status to 'finished'
   */
  static async endMatch(matchId: string, winnerTeam?: 'A' | 'B' | null): Promise<Match | null> {
    try {
      // Get current match data
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError || !match) throw fetchError || new Error('Match not found')

      const now = new Date()
      const updates: MatchUpdate = {
        match_status: 'finished',
        end_time: now.toISOString(),
        winner_team: winnerTeam
      }

      // Calculate final duration if match was active
      if (match.match_status === 'active') {
        const startTime = new Date(match.start_time)
        const pauseDuration = match.pause_duration ? this.parseInterval(match.pause_duration) : 0
        const finalDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pauseDuration
        updates.duration = `${finalDuration} seconds`
      }

      const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error ending match:', error)
      return null
    }
  }

  /**
   * Calculate current duration for display
   */
  static calculateCurrentDuration(match: Match): number {
    if (!match) return 0

    const now = new Date()
    const startTime = new Date(match.start_time)
    
    if (match.match_status === 'paused' && match.duration) {
      // For paused games, return the stored duration
      return this.parseInterval(match.duration)
    } else if (match.match_status === 'active') {
      // For active games: NOW - start_time - pause_duration
      const pauseDuration = match.pause_duration ? this.parseInterval(match.pause_duration) : 0
      return Math.floor((now.getTime() - startTime.getTime()) / 1000) - pauseDuration
    } else if (match.match_status === 'finished' && match.duration) {
      // For finished games, return the final duration
      return this.parseInterval(match.duration)
    }

    return 0
  }

  /**
   * Parse PostgreSQL interval to seconds
   */
  private static parseInterval(interval: unknown): number {
    if (typeof interval === 'string') {
      // Handle formats like "1234 seconds", "00:20:34", etc.
      if (interval.includes('seconds')) {
        return parseInt(interval.split(' ')[0])
      }
      // Handle HH:MM:SS format
      const parts = interval.split(':')
      if (parts.length === 3) {
        const hours = parseInt(parts[0])
        const minutes = parseInt(parts[1])
        const seconds = parseInt(parts[2])
        return hours * 3600 + minutes * 60 + seconds
      }
    }
    return 0
  }

  /**
   * Format seconds to display string
   */
  static formatDuration(totalSeconds: number): { minutes: number; seconds: number; formatted: string } {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    let formatted: string
    if (hours > 0) {
      formatted = `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    return { minutes, seconds, formatted }
  }
} 
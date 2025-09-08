import { supabase } from './supabase'
import type { Database } from '../supabase/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type Match = Database['public']['Tables']['matches']['Row']
type MatchUpdate = Database['public']['Tables']['matches']['Update']

export class MatchService {
  /**
   * Start a match - changes status from 'planned' to 'active'
   */
  static async startMatch(matchId: string, supabaseClient?: SupabaseClient<Database>): Promise<Match | null> {
    try {
      const client = supabaseClient || supabase
      const { data, error } = await client
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
  static async pauseMatch(matchId: string, supabaseClient?: SupabaseClient<Database>): Promise<Match | null> {
    try {
      const client = supabaseClient || supabase
      console.log('MatchService.pauseMatch: Starting pause for match:', matchId)
      
      // Get current match data
      const { data: match, error: fetchError } = await client
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError || !match) {
        console.error('MatchService.pauseMatch: Error fetching match:', fetchError)
        throw fetchError || new Error('Match not found')
      }

      console.log('MatchService.pauseMatch: Current match data:', {
        id: match.id,
        status: match.match_status,
        duration: match.duration,
        pause_duration: match.pause_duration,
        start_time: match.start_time
      })

      const now = new Date()
      const startTime = new Date(match.start_time)
      const pauseDuration = match.pause_duration ? this.parseInterval(match.pause_duration) : 0
      
      // Calculate current duration: NOW - start_time - pause_duration
      const currentDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pauseDuration
      console.log('MatchService.pauseMatch: Calculated duration:', currentDuration, 'seconds')

      const updateData = {
        match_status: 'paused',
        duration: `${currentDuration} seconds`,
        pause_duration: null // Clear pause_duration when paused
      }
      console.log('MatchService.pauseMatch: Update data to send:', updateData)
      
      const { data, error } = await client
        .from('matches')
        .update(updateData)
        .eq('id', matchId)
        .select()
        .single()

      if (error) {
        console.error('MatchService.pauseMatch: Database update error:', error)
        throw error
      }
      
      if (!data) {
        console.error('MatchService.pauseMatch: No data returned from update')
        throw new Error('No data returned from update')
      }
      
      console.log('MatchService.pauseMatch: Database update successful, returned data:', data)
      console.log('MatchService.pauseMatch: Duration field in returned data:', data?.duration)
      console.log('MatchService.pauseMatch: Pause duration field in returned data:', data?.pause_duration)
      
      // Add a small delay to ensure the update is committed
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify the update actually worked by fetching the match again
      const { data: verifyData, error: verifyError } = await client
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
        
      if (verifyError) {
        console.error('MatchService.pauseMatch: Error verifying update:', verifyError)
      } else {
        console.log('MatchService.pauseMatch: Verification fetch result:', {
          id: verifyData?.id,
          status: verifyData?.match_status,
          duration: verifyData?.duration,
          pause_duration: verifyData?.pause_duration
        })
      }
      
      // Return the verified data instead of the update response
      return verifyData
    } catch (error) {
      console.error('Error pausing match:', error)
      return null
    }
  }

  /**
   * Resume a paused match - calculates new pause_duration and sets status to 'active'
   */
  static async resumeMatch(matchId: string, supabaseClient?: SupabaseClient<Database>): Promise<Match | null> {
    try {
      const client = supabaseClient || supabase
      console.log('MatchService.resumeMatch: Starting resume for match:', matchId)
      
      // Get current match data
      const { data: match, error: fetchError } = await client
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError || !match) {
        console.error('MatchService.resumeMatch: Error fetching match:', fetchError)
        throw fetchError || new Error('Match not found')
      }

      console.log('MatchService.resumeMatch: Current match data:', {
        id: match.id,
        status: match.match_status,
        duration: match.duration,
        pause_duration: match.pause_duration,
        start_time: match.start_time
      })

      const now = new Date()
      const startTime = new Date(match.start_time)
      const duration = match.duration ? this.parseInterval(match.duration) : 0
      
      // Calculate new pause_duration: NOW - start_time - duration
      const newPauseDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - duration
      console.log('MatchService.resumeMatch: Calculated pause_duration:', newPauseDuration, 'seconds')

      const updateData = {
        match_status: 'active',
        pause_duration: `${newPauseDuration} seconds`,
        duration: null // Clear duration when active
      }
      console.log('MatchService.resumeMatch: Update data to send:', updateData)
      
      const { data, error } = await client
        .from('matches')
        .update(updateData)
        .eq('id', matchId)
        .select()
        .single()

      if (error) {
        console.error('MatchService.resumeMatch: Database update error:', error)
        throw error
      }
      
      if (!data) {
        console.error('MatchService.resumeMatch: No data returned from update')
        throw new Error('No data returned from update')
      }
      
      console.log('MatchService.resumeMatch: Database update successful, returned data:', data)
      console.log('MatchService.resumeMatch: Duration field in returned data:', data?.duration)
      console.log('MatchService.resumeMatch: Pause duration field in returned data:', data?.pause_duration)
      
      // Add a small delay to ensure the update is committed
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify the update actually worked by fetching the match again
      const { data: verifyData, error: verifyError } = await client
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
        
      if (verifyError) {
        console.error('MatchService.resumeMatch: Error verifying update:', verifyError)
      } else {
        console.log('MatchService.resumeMatch: Verification fetch result:', {
          id: verifyData?.id,
          status: verifyData?.match_status,
          duration: verifyData?.duration,
          pause_duration: verifyData?.pause_duration
        })
      }
      
      // Return the verified data instead of the update response
      return verifyData
    } catch (error) {
      console.error('Error resuming match:', error)
      return null
    }
  }

  /**
   * End a match - calculates final duration and sets status to 'finished'
   */
  static async endMatch(matchId: string, winnerTeam?: 'A' | 'B' | null, supabaseClient?: SupabaseClient<Database>): Promise<Match | null> {
    try {
      console.log('MatchService.endMatch: Starting to end match', matchId)
      
      const client = supabaseClient || supabase
      // Get current match data
      const { data: match, error: fetchError } = await client
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError || !match) {
        console.error('MatchService.endMatch: Error fetching match or match not found', fetchError)
        throw fetchError || new Error('Match not found')
      }

      console.log('MatchService.endMatch: Current match status:', match.match_status)

      const now = new Date()
      const updates: MatchUpdate = {
        match_status: 'finished',
        end_time: now.toISOString(),
        winner_team: winnerTeam
      }

      // Calculate final duration if match was active or paused
      if (match.match_status === 'active') {
        const startTime = new Date(match.start_time)
        const pauseDuration = match.pause_duration ? this.parseInterval(match.pause_duration) : 0
        const finalDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pauseDuration
        updates.duration = `${finalDuration} seconds`
        console.log('MatchService.endMatch: Calculated final duration from active match:', finalDuration, 'seconds')
      } else if (match.match_status === 'paused' && match.duration) {
        // For paused matches, use the stored duration
        updates.duration = match.duration
        console.log('MatchService.endMatch: Using stored duration from paused match:', match.duration)
      }

      console.log('MatchService.endMatch: Updating match with:', updates)

      const { data, error } = await client
        .from('matches')
        .update(updates)
        .eq('id', matchId)
        .select()
        .single()

      if (error) {
        console.error('MatchService.endMatch: Error updating match:', error)
        throw error
      }

      console.log('MatchService.endMatch: Match updated successfully, new status:', data?.match_status)
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

    console.log('MatchService.calculateCurrentDuration: Input match data:', {
      id: match.id,
      status: match.match_status,
      duration: match.duration,
      pause_duration: match.pause_duration,
      start_time: match.start_time
    })

    const now = new Date()
    const startTime = new Date(match.start_time)
    
    if (match.match_status === 'paused' && match.duration) {
      // For paused games, return the stored duration (pause_duration should be null)
      const duration = this.parseInterval(match.duration)
      console.log('MatchService.calculateCurrentDuration: Paused match, returning stored duration:', duration, 'from:', match.duration)
      return duration
    } else if (match.match_status === 'active') {
      // For active games: NOW - start_time - pause_duration (duration should be null)
      // If duration is not null, this indicates a data inconsistency - log it
      if (match.duration) {
        console.warn('MatchService.calculateCurrentDuration: Active match has non-null duration:', match.duration, 'This should be null!')
      }
      const pauseDuration = match.pause_duration ? this.parseInterval(match.pause_duration) : 0
      const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pauseDuration
      console.log('MatchService.calculateCurrentDuration: Active match, calculated duration:', duration, 'pause_duration:', match.pause_duration)
      return duration
    } else if (match.match_status === 'finished' && match.duration) {
      // For finished games, return the final duration
      const duration = this.parseInterval(match.duration)
      console.log('MatchService.calculateCurrentDuration: Finished match, returning final duration:', duration)
      return duration
    }

    console.log('MatchService.calculateCurrentDuration: No valid duration calculation, returning 0. Match status:', match.match_status, 'duration:', match.duration)
    return 0
  }

  /**
   * Parse PostgreSQL interval to seconds
   */
  static parseInterval(interval: unknown): number {
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
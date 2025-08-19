'use server'

import { createSafeActionClient } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { 
  scoreSchema, 
  playerSelectSchema, 
  matchControlSchema, 
  updatePlayerTeamSchema, 
  assignGoalkeeperSchema,
  removeGoalkeeperSchema,
  addPlayerToFieldSchema,
  vestToggleSchema
} from '../lib/schemas'
import { handleSupabaseError } from '../lib/utils/errors'
import { MatchService } from '../lib/match-service'
import type { ActionResponse } from '../lib/types/actions'

const actionClient = createSafeActionClient()

export const addScore = actionClient
  .inputSchema(scoreSchema)
  .action(async ({ parsedInput: { matchId, team, scoringPlayerId, assistingPlayerId } }) => {
    try {
      const currentDuration = MatchService.calculateCurrentDuration({ id: matchId } as any)
      
      const { data, error } = await supabase
        .from('scores')
        .insert({
          match_id: matchId,
          team,
          score_time: `${currentDuration} seconds`,
          scoring_player_id: scoringPlayerId || null,
          assisting_player_id: assistingPlayerId || null
        })
        .select()
        .single()

      if (error) throw handleSupabaseError(error)

      revalidatePath('/')
      return { success: true, data }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  })

export const addPlayerToMatch = actionClient
  .inputSchema(playerSelectSchema)
  .action(async ({ parsedInput: { matchId, playerId, team, isGoalkeeper } }) => {
    try {
      const { data, error } = await supabase
        .from('match_players')
        .insert({
          match_id: matchId,
          player_id: playerId,
          team,
          is_goalkeeper: isGoalkeeper
        })
        .select()
        .single()

      if (error) throw handleSupabaseError(error)

      revalidatePath('/')
      return { success: true, data }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  })

export const removePlayerFromMatch = actionClient
  .inputSchema(z.object({ matchId: z.string().uuid(), playerId: z.string().uuid() }))
  .action(async ({ parsedInput: { matchId, playerId } }) => {
    try {
      const { error } = await supabase
        .from('match_players')
        .delete()
        .eq('match_id', matchId)
        .eq('player_id', playerId)

      if (error) throw handleSupabaseError(error)

      revalidatePath('/')
      return { success: true, data: { removed: true } }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  })

export const updatePlayerTeam = actionClient
  .inputSchema(updatePlayerTeamSchema)
  .action(async ({ parsedInput: { matchId, playerId, newTeam } }) => {
    try {
      const { data, error } = await supabase
        .from('match_players')
        .update({ team: newTeam })
        .eq('match_id', matchId)
        .eq('player_id', playerId)
        .select()
        .single()

      if (error) throw handleSupabaseError(error)

      revalidatePath('/')
      return { success: true, data }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  })

export const assignGoalkeeper = actionClient
  .inputSchema(assignGoalkeeperSchema)
  .action(async ({ parsedInput: { matchId, playerId, team } }) => {
    try {
      // First, remove any existing goalkeeper for this team
      await supabase
        .from('match_players')
        .update({ is_goalkeeper: false })
        .eq('match_id', matchId)
        .eq('team', team)
        .eq('is_goalkeeper', true)

      // Then assign the new goalkeeper
      const { data, error } = await supabase
        .from('match_players')
        .update({ 
          team: team,
          is_goalkeeper: true 
        })
        .eq('match_id', matchId)
        .eq('player_id', playerId)
        .select()
        .single()

      if (error) throw handleSupabaseError(error)

      revalidatePath('/')
      return { success: true, data }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  })

export const controlMatch = actionClient
  .inputSchema(matchControlSchema)
  .action(async ({ parsedInput: { matchId, action, winnerTeam } }) => {
    try {
      let result = null

      switch (action) {
        case 'start':
          result = await MatchService.startMatch(matchId)
          break
        case 'pause':
          result = await MatchService.pauseMatch(matchId)
          break
        case 'resume':
          result = await MatchService.resumeMatch(matchId)
          break
        case 'end':
          result = await MatchService.endMatch(matchId, winnerTeam)
          break
      }

      if (!result) throw new Error(`Failed to ${action} match`)

      revalidatePath('/')
      return { success: true, data: result }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  }) 

export const removeGoalkeeper = actionClient
  .inputSchema(removeGoalkeeperSchema)
  .action(async ({ parsedInput: { matchId, playerId } }) => {
    try {
      const { data, error } = await supabase
        .from('match_players')
        .update({ is_goalkeeper: false })
        .eq('match_id', matchId)
        .eq('player_id', playerId)
        .eq('is_goalkeeper', true)
        .select()
        .single()

      if (error) throw handleSupabaseError(error)

      revalidatePath('/')
      return { success: true, data }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  })

export const addPlayerToField = actionClient
  .inputSchema(addPlayerToFieldSchema)
  .action(async ({ parsedInput: { matchId, playerId, team } }) => {
    try {
      // First check if player is already in the match
      const { data: existingPlayer } = await supabase
        .from('match_players')
        .select('*')
        .eq('match_id', matchId)
        .eq('player_id', playerId)
        .single()

      if (existingPlayer) {
        // Player exists, just update their team and make them not a goalkeeper
        const { data, error } = await supabase
          .from('match_players')
          .update({ 
            team: team,
            is_goalkeeper: false 
          })
          .eq('match_id', matchId)
          .eq('player_id', playerId)
          .select()
          .single()

        if (error) throw handleSupabaseError(error)
        revalidatePath('/')
        return { success: true, data }
      } else {
        // Player doesn't exist in match, add them
        const { data, error } = await supabase
          .from('match_players')
          .insert({
            match_id: matchId,
            player_id: playerId,
            team: team,
            is_goalkeeper: false
          })
          .select()
          .single()

        if (error) throw handleSupabaseError(error)
        revalidatePath('/')
        return { success: true, data }
      }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  })

export const toggleVests = actionClient
  .inputSchema(vestToggleSchema)
  .action(async ({ parsedInput: { matchId, team } }) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({
          team_with_vests: team
        })
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw handleSupabaseError(error)

      revalidatePath('/')
      return { success: true, data }
    } catch (error) {
      const appError = error instanceof Error ? error : handleSupabaseError(error)
      return { success: false, error: appError.message }
    }
  }) 
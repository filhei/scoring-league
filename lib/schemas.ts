import { z } from 'zod'

export const scoreSchema = z.object({
  matchId: z.string().uuid(),
  team: z.enum(['A', 'B']),
  scoringPlayerId: z.string().uuid().optional(),
  assistingPlayerId: z.string().uuid().optional()
})

export const playerSelectSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  team: z.enum(['A', 'B']),
  isGoalkeeper: z.boolean()
})

export const matchControlSchema = z.object({
  matchId: z.string().uuid(),
  action: z.enum(['start', 'pause', 'resume', 'end']),
  winnerTeam: z.enum(['A', 'B']).optional()
})

export const updatePlayerTeamSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  newTeam: z.enum(['A', 'B'])
})

export const assignGoalkeeperSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  team: z.enum(['A', 'B'])
})

export const removeGoalkeeperSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid()
})

export const addPlayerToFieldSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  team: z.enum(['A', 'B'])
})

export const vestToggleSchema = z.object({
  matchId: z.string().uuid(),
  team: z.enum(['A', 'B']).nullable()
})

export const createMatchSchema = z.object({
  teamWithVests: z.enum(['A', 'B']).nullable().optional(),
  teamAPlayerIds: z.array(z.string().uuid()).optional(),
  teamBPlayerIds: z.array(z.string().uuid()).optional(),
  teamAGoalkeeperId: z.string().uuid().nullable().optional(),
  teamBGoalkeeperId: z.string().uuid().nullable().optional()
}) 
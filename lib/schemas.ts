import { z } from "zod";

export const scoreSchema = z.object({
  matchId: z.string().uuid(),
  team: z.enum(["A", "B"]),
  scoringPlayerId: z.string().uuid().optional(),
  assistingPlayerId: z.string().uuid().optional(),
});

export const updateScoreSchema = z.object({
  scoreId: z.string().uuid(),
  matchId: z.string().uuid(),
  scoringPlayerId: z.string().uuid().optional(),
  assistingPlayerId: z.string().uuid().optional(),
});

export const deleteScoreSchema = z.object({
  scoreId: z.string().uuid(),
  matchId: z.string().uuid(),
});

export const playerSelectSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  team: z.enum(["A", "B"]),
  isGoalkeeper: z.boolean(),
});

export const matchControlSchema = z.object({
  matchId: z.string().uuid(),
  action: z.enum(["start", "pause", "resume", "end"]),
  winnerTeam: z.enum(["A", "B"]).optional(),
});

export const updatePlayerTeamSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  newTeam: z.enum(["A", "B"]),
});

export const assignGoalkeeperSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  team: z.enum(["A", "B"]),
});

export const removeGoalkeeperSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
});

export const addPlayerToFieldSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  team: z.enum(["A", "B"]),
});

export const vestToggleSchema = z.object({
  matchId: z.string().uuid(),
  team: z.enum(["A", "B"]).nullable(),
});

export const createMatchSchema = z.object({
  teamWithVests: z.enum(["A", "B"]).nullable().optional(),
  teamAPlayerIds: z.array(z.string().uuid()).optional(),
  teamBPlayerIds: z.array(z.string().uuid()).optional(),
  teamAGoalkeeperId: z.string().uuid().nullable().optional(),
  teamBGoalkeeperId: z.string().uuid().nullable().optional(),
});

// Profile management schemas
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(
    100,
    "Name must be less than 100 characters",
  ),
  positions: z.array(z.object({
    position: z.enum(["Målvakt", "Back", "Center", "Forward"]),
    preference: z.enum(["primary", "secondary"]).nullable(),
  })),
});

export const deleteAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
});

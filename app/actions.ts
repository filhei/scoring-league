"use server";

import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "../lib/supabase-server";
import {
  addPlayerToFieldSchema,
  assignGoalkeeperSchema,
  createMatchSchema,
  deleteAccountSchema,
  matchControlSchema,
  playerSelectSchema,
  removeGoalkeeperSchema,
  scoreSchema,
  updatePlayerTeamSchema,
  updateProfileSchema,
  vestToggleSchema,
} from "../lib/schemas";
import { handleSupabaseError } from "../lib/utils/errors";
import { MatchService } from "../lib/match-service";
import type { ActionResponse } from "../lib/types/actions";

const actionClient = createSafeActionClient();

export const addScore = actionClient
  .inputSchema(scoreSchema)
  .action(
    async (
      { parsedInput: { matchId, team, scoringPlayerId, assistingPlayerId } },
    ) => {
      try {
        const supabaseServer = await createServerSupabaseClient();

        // Fetch the full match data to calculate current duration
        const { data: matchData, error: matchError } = await supabaseServer
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (matchError) throw handleSupabaseError(matchError);
        if (!matchData) throw new Error("Match not found");

        const currentDuration = MatchService.calculateCurrentDuration(
          matchData,
        );

        const { data, error } = await supabaseServer
          .from("scores")
          .insert({
            match_id: matchId,
            team,
            score_time: `${currentDuration} seconds`,
            scoring_player_id: scoringPlayerId || null,
            assisting_player_id: assistingPlayerId || null,
          })
          .select()
          .single();

        if (error) throw handleSupabaseError(error);

        revalidatePath("/");
        return { success: true, data };
      } catch (error) {
        const appError = error instanceof Error
          ? error
          : handleSupabaseError(error);
        return { success: false, error: appError.message };
      }
    },
  );

export const addPlayerToMatch = actionClient
  .inputSchema(playerSelectSchema)
  .action(
    async ({ parsedInput: { matchId, playerId, team, isGoalkeeper } }) => {
      try {
        const supabaseServer = await createServerSupabaseClient();
        const { data, error } = await supabaseServer
          .from("match_players")
          .insert({
            match_id: matchId,
            player_id: playerId,
            team,
            is_goalkeeper: isGoalkeeper,
          })
          .select()
          .single();

        if (error) throw handleSupabaseError(error);

        revalidatePath("/");
        return { success: true, data };
      } catch (error) {
        const appError = error instanceof Error
          ? error
          : handleSupabaseError(error);
        return { success: false, error: appError.message };
      }
    },
  );

export const removePlayerFromMatch = actionClient
  .inputSchema(
    z.object({ matchId: z.string().uuid(), playerId: z.string().uuid() }),
  )
  .action(async ({ parsedInput: { matchId, playerId } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      const { error } = await supabaseServer
        .from("match_players")
        .delete()
        .eq("match_id", matchId)
        .eq("player_id", playerId);

      if (error) throw handleSupabaseError(error);

      revalidatePath("/");
      return { success: true, data: { removed: true } };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const updatePlayerTeam = actionClient
  .inputSchema(updatePlayerTeamSchema)
  .action(async ({ parsedInput: { matchId, playerId, newTeam } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      const { data, error } = await supabaseServer
        .from("match_players")
        .update({ team: newTeam })
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      revalidatePath("/");
      return { success: true, data };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const assignGoalkeeper = actionClient
  .inputSchema(assignGoalkeeperSchema)
  .action(async ({ parsedInput: { matchId, playerId, team } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      // First, remove any existing goalkeeper for this team
      await supabaseServer
        .from("match_players")
        .update({ is_goalkeeper: false })
        .eq("match_id", matchId)
        .eq("team", team)
        .eq("is_goalkeeper", true);

      // Then assign the new goalkeeper
      const { data, error } = await supabaseServer
        .from("match_players")
        .update({
          team: team,
          is_goalkeeper: true,
        })
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      revalidatePath("/");
      return { success: true, data };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const controlMatch = actionClient
  .inputSchema(matchControlSchema)
  .action(async ({ parsedInput: { matchId, action, winnerTeam } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      let result = null;

      switch (action) {
        case "start":
          result = await MatchService.startMatch(matchId, supabaseServer);
          break;
        case "pause":
          result = await MatchService.pauseMatch(matchId, supabaseServer);
          break;
        case "resume":
          result = await MatchService.resumeMatch(matchId, supabaseServer);
          break;
        case "end":
          result = await MatchService.endMatch(
            matchId,
            winnerTeam,
            supabaseServer,
          );
          break;
      }

      if (!result) throw new Error(`Failed to ${action} match`);

      revalidatePath("/");
      return { success: true, data: result };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const removeGoalkeeper = actionClient
  .inputSchema(removeGoalkeeperSchema)
  .action(async ({ parsedInput: { matchId, playerId } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      const { data, error } = await supabaseServer
        .from("match_players")
        .update({ is_goalkeeper: false })
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .eq("is_goalkeeper", true)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      revalidatePath("/");
      return { success: true, data };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const addPlayerToField = actionClient
  .inputSchema(addPlayerToFieldSchema)
  .action(async ({ parsedInput: { matchId, playerId, team } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      // First check if player is already in the match
      const { data: existingPlayer } = await supabaseServer
        .from("match_players")
        .select("*")
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .single();

      if (existingPlayer) {
        // Player exists, just update their team and make them not a goalkeeper
        const { data, error } = await supabaseServer
          .from("match_players")
          .update({
            team: team,
            is_goalkeeper: false,
          })
          .eq("match_id", matchId)
          .eq("player_id", playerId)
          .select()
          .single();

        if (error) throw handleSupabaseError(error);
        revalidatePath("/");
        return { success: true, data };
      } else {
        // Player doesn't exist in match, add them
        const { data, error } = await supabaseServer
          .from("match_players")
          .insert({
            match_id: matchId,
            player_id: playerId,
            team: team,
            is_goalkeeper: false,
          })
          .select()
          .single();

        if (error) throw handleSupabaseError(error);
        revalidatePath("/");
        return { success: true, data };
      }
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const toggleVests = actionClient
  .inputSchema(vestToggleSchema)
  .action(async ({ parsedInput: { matchId, team } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      const { data, error } = await supabaseServer
        .from("matches")
        .update({
          team_with_vests: team,
        })
        .eq("id", matchId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      revalidatePath("/");
      return { success: true, data };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const createMatch = actionClient
  .inputSchema(createMatchSchema)
  .action(async ({ parsedInput }) => {
    try {
      console.log("Creating match with params:", parsedInput);

      // Create server-side Supabase client
      const supabaseServer = await createServerSupabaseClient();

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabaseServer.auth
        .getUser();
      console.log("Auth check - user:", user?.email, "error:", authError);
      console.log("Auth check - user object:", user);

      if (authError) {
        console.log("Auth error:", authError);
        throw new Error("Authentication error: " + authError.message);
      }

      if (!user) {
        console.log("User not authenticated, cannot create match");
        throw new Error("Authentication required to create matches");
      }

      // Create the match first
      const { data: match, error: matchError } = await supabaseServer
        .from("matches")
        .insert({
          match_status: "planned",
          team_with_vests: parsedInput.teamWithVests || null,
        })
        .select()
        .single();

      if (matchError) throw handleSupabaseError(matchError);

      console.log("Match created successfully:", match);

      // If team data is provided, add players to the match
      if (
        parsedInput.teamAPlayerIds || parsedInput.teamBPlayerIds ||
        parsedInput.teamAGoalkeeperId || parsedInput.teamBGoalkeeperId
      ) {
        const matchPlayersToInsert = [];

        // Add Team A field players
        if (parsedInput.teamAPlayerIds) {
          parsedInput.teamAPlayerIds.forEach((playerId) => {
            matchPlayersToInsert.push({
              match_id: match.id,
              player_id: playerId,
              team: "A" as const,
              is_goalkeeper: false,
            });
          });
        }

        // Add Team B field players
        if (parsedInput.teamBPlayerIds) {
          parsedInput.teamBPlayerIds.forEach((playerId) => {
            matchPlayersToInsert.push({
              match_id: match.id,
              player_id: playerId,
              team: "B" as const,
              is_goalkeeper: false,
            });
          });
        }

        // Add Team A goalkeeper
        if (parsedInput.teamAGoalkeeperId) {
          matchPlayersToInsert.push({
            match_id: match.id,
            player_id: parsedInput.teamAGoalkeeperId,
            team: "A" as const,
            is_goalkeeper: true,
          });
        }

        // Add Team B goalkeeper
        if (parsedInput.teamBGoalkeeperId) {
          matchPlayersToInsert.push({
            match_id: match.id,
            player_id: parsedInput.teamBGoalkeeperId,
            team: "B" as const,
            is_goalkeeper: true,
          });
        }

        // Bulk insert all players
        if (matchPlayersToInsert.length > 0) {
          const { error: playersError } = await supabaseServer
            .from("match_players")
            .insert(matchPlayersToInsert);

          if (playersError) throw handleSupabaseError(playersError);
        }
      }

      revalidatePath("/");
      console.log("Revalidating path and returning success");
      return { success: true, data: match };
    } catch (error) {
      console.log("createMatch: Caught error:", error);
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      console.log("createMatch: AppError:", appError);
      return { success: false, error: appError.message };
    }
  });

export const deleteMatch = actionClient
  .inputSchema(z.object({ matchId: z.string().uuid() }))
  .action(async ({ parsedInput: { matchId } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      // Delete related data first (scores and match_players)
      const { error: scoresError } = await supabaseServer
        .from("scores")
        .delete()
        .eq("match_id", matchId);

      if (scoresError) throw handleSupabaseError(scoresError);

      const { error: playersError } = await supabaseServer
        .from("match_players")
        .delete()
        .eq("match_id", matchId);

      if (playersError) throw handleSupabaseError(playersError);

      // Delete the match itself
      const { error: matchError } = await supabaseServer
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (matchError) throw handleSupabaseError(matchError);

      revalidatePath("/");
      return { success: true, data: { deleted: true } };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const resetMatch = actionClient
  .inputSchema(z.object({ matchId: z.string().uuid() }))
  .action(async ({ parsedInput: { matchId } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();
      // Delete all scores for the match
      const { error: scoresError } = await supabaseServer
        .from("scores")
        .delete()
        .eq("match_id", matchId);

      if (scoresError) throw handleSupabaseError(scoresError);

      // Reset the match start time to now and set to paused
      const { error: matchError } = await supabaseServer
        .from("matches")
        .update({
          start_time: new Date().toISOString(),
          match_status: "paused",
          duration: null,
          pause_duration: null,
        })
        .eq("id", matchId);

      if (matchError) throw handleSupabaseError(matchError);

      revalidatePath("/");
      return { success: true, data: { reset: true } };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

// Profile management actions
export const updateProfile = actionClient
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput: { name, positions } }) => {
    try {
      console.log("updateProfile: ACTION STARTED");
      console.log(
        "updateProfile: Starting update with name:",
        name,
        "positions:",
        positions,
      );
      const supabaseServer = await createServerSupabaseClient();

      // Get current user
      const { data: { user }, error: userError } = await supabaseServer.auth
        .getUser();
      console.log(
        "updateProfile: Auth result - user:",
        user?.email,
        "error:",
        userError,
      );
      console.log("updateProfile: User object:", user);
      if (userError || !user) throw new Error("User not authenticated");
      console.log("updateProfile: User authenticated:", user.email);

      // Test if we can access the user's data
      const { data: testPlayer, error: testError } = await supabaseServer
        .from("players")
        .select("id, name")
        .eq("user_id", user.id)
        .single();

      console.log(
        "updateProfile: Test player query - data:",
        testPlayer,
        "error:",
        testError,
      );

      // Update player name
      console.log(
        "updateProfile: Updating player name to:",
        name,
        "for user_id:",
        user.id,
      );
      const { data: updateData, error: updateError } = await supabaseServer
        .from("players")
        .update({ name })
        .eq("user_id", user.id)
        .select();

      if (updateError) {
        console.error("updateProfile: Update error:", updateError);
        console.error("updateProfile: Update error code:", updateError.code);
        console.error(
          "updateProfile: Update error message:",
          updateError.message,
        );
        console.error(
          "updateProfile: Update error details:",
          updateError.details,
        );
        throw handleSupabaseError(updateError);
      }
      console.log(
        "updateProfile: Name updated successfully, data:",
        updateData,
      );

      // Get player ID
      const { data: player, error: playerError } = await supabaseServer
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (playerError) throw handleSupabaseError(playerError);
      console.log("updateProfile: Got player ID:", player.id);

      // Delete existing position preferences
      console.log(
        "updateProfile: Deleting existing positions for player ID:",
        player.id,
      );
      const { data: deleteData, error: deleteError } = await supabaseServer
        .from("player_positions")
        .delete()
        .eq("player_id", player.id)
        .select();

      if (deleteError) {
        console.error("updateProfile: Delete positions error:", deleteError);
        throw handleSupabaseError(deleteError);
      }
      console.log(
        "updateProfile: Existing positions deleted, count:",
        deleteData?.length || 0,
      );

      // Insert new position preferences (only for positions with actual preferences)
      console.log("updateProfile: All positions received:", positions);
      const positionsToInsert = positions
        .filter((
          pos,
        ): pos is {
          position: "Målvakt" | "Back" | "Center" | "Forward";
          preference: "primary" | "secondary";
        } => pos.preference === "primary" || pos.preference === "secondary")
        .map((pos) => ({
          player_id: player.id,
          position: pos.position,
          preference: pos.preference,
        }));

      console.log(
        "updateProfile: Filtered positions to insert:",
        positionsToInsert,
      );

      if (positionsToInsert.length > 0) {
        console.log(
          "updateProfile: Inserting new positions:",
          positionsToInsert,
        );
        const { data: insertData, error: insertError } = await supabaseServer
          .from("player_positions")
          .insert(positionsToInsert)
          .select();

        if (insertError) {
          console.error("updateProfile: Insert positions error:", insertError);
          throw handleSupabaseError(insertError);
        }
        console.log(
          "updateProfile: New positions inserted:",
          insertData?.length || 0,
        );
      } else {
        console.log(
          "updateProfile: No positions to insert (all preferences are null)",
        );
      }

      revalidatePath("/profile");
      revalidatePath("/");
      console.log("updateProfile: Update completed successfully");
      return { success: true, data: { updated: true } };
    } catch (error) {
      console.error("updateProfile: Error occurred:", error);
      console.error("updateProfile: Error type:", typeof error);
      console.error(
        "updateProfile: Error instanceof Error:",
        error instanceof Error,
      );
      console.error(
        "updateProfile: Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );
      console.error(
        "updateProfile: Error message:",
        error instanceof Error ? error.message : "No message",
      );
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      console.error("updateProfile: AppError:", appError);
      return { success: false, error: appError.message };
    }
  });

// Test action to debug auth issues
export const testAuth = actionClient
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      console.log("testAuth: Starting test");
      const supabaseServer = await createServerSupabaseClient();

      // Get current user
      const { data: { user }, error: userError } = await supabaseServer.auth
        .getUser();
      console.log(
        "testAuth: Auth result - user:",
        user?.email,
        "error:",
        userError,
      );

      if (userError || !user) {
        return { success: false, error: "User not authenticated" };
      }

      // Test if we can access the user's data
      const { data: player, error: playerError } = await supabaseServer
        .from("players")
        .select("id, name, email")
        .eq("user_id", user.id)
        .single();

      console.log(
        "testAuth: Player query - data:",
        player,
        "error:",
        playerError,
      );

      if (playerError) {
        return {
          success: false,
          error: `Player query failed: ${playerError.message}`,
        };
      }

      return { success: true, data: { user: user.email, player } };
    } catch (error) {
      console.error("testAuth: Error:", error);
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

// Simple test action for profile update
export const testProfileUpdate = actionClient
  .inputSchema(z.object({ name: z.string() }))
  .action(async ({ parsedInput: { name } }) => {
    try {
      console.log("testProfileUpdate: ACTION STARTED");
      console.log("testProfileUpdate: Name:", name);

      const supabaseServer = await createServerSupabaseClient();

      // Get current user
      const { data: { user }, error: userError } = await supabaseServer.auth
        .getUser();
      console.log(
        "testProfileUpdate: Auth result - user:",
        user?.email,
        "error:",
        userError,
      );
      console.log("testProfileUpdate: User ID:", user?.id);
      console.log("testProfileUpdate: User email:", user?.email);

      if (userError || !user) {
        return { success: false, error: "User not authenticated" };
      }

      // First, let's test if we can query the player data
      const { data: playerData, error: playerError } = await supabaseServer
        .from("players")
        .select("id, name, user_id")
        .eq("user_id", user.id)
        .single();

      console.log(
        "testProfileUpdate: Player query - data:",
        playerData,
        "error:",
        playerError,
      );
      console.log("testProfileUpdate: Current user ID:", user.id);
      console.log("testProfileUpdate: Player user_id:", playerData?.user_id);

      if (playerError) {
        return {
          success: false,
          error: `Player query failed: ${playerError.message}`,
        };
      }

      // Just update the name
      console.log(
        "testProfileUpdate: Attempting to update name to:",
        name,
        "for user_id:",
        user.id,
      );
      const { data: updateData, error: updateError } = await supabaseServer
        .from("players")
        .update({ name })
        .eq("user_id", user.id)
        .select();

      console.log(
        "testProfileUpdate: Update result - data:",
        updateData,
        "error:",
        updateError,
      );
      if (updateError) {
        console.error("testProfileUpdate: Update error details:", {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
      }

      if (updateError) {
        return {
          success: false,
          error: `Update failed: ${updateError.message}`,
        };
      }

      return { success: true, data: updateData };
    } catch (error) {
      console.error("testProfileUpdate: Error:", error);
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

export const deleteAccount = actionClient
  .inputSchema(deleteAccountSchema)
  .action(async ({ parsedInput: { email } }) => {
    try {
      const supabaseServer = await createServerSupabaseClient();

      // Get current user
      const { data: { user }, error: userError } = await supabaseServer.auth
        .getUser();
      if (userError || !user) throw new Error("User not authenticated");

      // Verify email matches
      if (user.email !== email) {
        throw new Error("Email does not match your account");
      }

      // Get player data before nullification for verification
      const { data: playerBefore, error: playerError } = await supabaseServer
        .from("players")
        .select("id, name, elo, is_active, created_at, user_id, list_name")
        .eq("user_id", user.id)
        .single();

      if (playerError) throw handleSupabaseError(playerError);

      // Nullify the player account (GDPR compliance - set all fields except id to null)
      const { error: updateError } = await supabaseServer
        .from("players")
        .update({
          name: null,
          elo: null,
          is_active: null,
          created_at: null,
          user_id: null,
          list_name: null,
        })
        .eq("user_id", user.id);

      if (updateError) throw handleSupabaseError(updateError);

      // Verify nullification was successful
      const { data: playerAfter, error: verifyError } = await supabaseServer
        .from("players")
        .select("id, name, elo, is_active, created_at, user_id, list_name")
        .eq("id", playerBefore.id)
        .single();

      if (verifyError) throw handleSupabaseError(verifyError);

      // Verify all fields except id are null
      if (
        playerAfter.name !== null || playerAfter.elo !== null ||
        playerAfter.is_active !== null || playerAfter.created_at !== null ||
        playerAfter.user_id !== null || playerAfter.list_name !== null
      ) {
        throw new Error(
          "Account nullification failed - some fields were not nullified",
        );
      }

      // Delete the auth user to prevent re-login
      try {
        const supabaseAdmin = createAdminSupabaseClient();
        const { error: deleteUserError } = await supabaseAdmin.auth.admin
          .deleteUser(user.id);
        if (deleteUserError) {
          console.error("Failed to delete auth user:", deleteUserError);
          // Don't throw here - player data is already nullified
          // The user will be signed out and won't be able to log back in
        }
      } catch (adminError) {
        console.error(
          "Failed to create admin client or delete user:",
          adminError,
        );
        // Don't throw here - player data is already nullified
        // The user will be signed out and won't be able to log back in
      }

      revalidatePath("/");
      return {
        success: true,
        data: { deleted: true, playerId: playerBefore.id },
      };
    } catch (error) {
      const appError = error instanceof Error
        ? error
        : handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  });

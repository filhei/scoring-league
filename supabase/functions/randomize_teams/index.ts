// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js";
import { createClient } from "@supabase/supabase-js";

interface RandomizeTeamsRequest {
  matchId: string;
  mode: "random" | "balanced";
}

interface RandomizeTeamsResult {
  success: boolean;
  reassignedPlayers: number;
  errors: string[];
}

interface MatchPlayer {
  id: string;
  player_id: string;
  team: "A" | "B";
  is_goalkeeper: boolean;
  elo: number | null;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function assignTeamsRandom(
  players: MatchPlayer[],
): Array<{ player_id: string; team: "A" | "B" }> {
  const shuffled = shuffleArray(players);
  return shuffled.map((player, index) => ({
    player_id: player.player_id,
    team: index % 2 === 0 ? "A" : "B",
  }));
}

function assignTeamsBalanced(
  players: MatchPlayer[],
): Array<{ player_id: string; team: "A" | "B" }> {
  // Sort by ELO (descending - highest first)
  const sorted = [...players].sort((a, b) => (b.elo || 1500) - (a.elo || 1500));

  // Snake draft pattern: A, B, B, A, A, B, B, A...
  return sorted.map((player, index) => {
    const teamIndex = Math.floor(index / 2);
    const isEvenGroup = teamIndex % 2 === 0;
    const isFirstInGroup = index % 2 === 0;

    // For even groups: first goes to A, second to B
    // For odd groups: first goes to B, second to A
    const team =
      (isEvenGroup && isFirstInGroup) || (!isEvenGroup && !isFirstInGroup)
        ? "A"
        : "B";

    return {
      player_id: player.player_id,
      team,
    };
  });
}

async function randomizeTeams(
  matchId: string,
  mode: "random" | "balanced",
): Promise<RandomizeTeamsResult> {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if match exists and is in correct status
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, match_status")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return {
        success: false,
        reassignedPlayers: 0,
        errors: ["Match not found"],
      };
    }

    if (match.match_status === "finished") {
      return {
        success: false,
        reassignedPlayers: 0,
        errors: ["Cannot randomize teams for finished matches"],
      };
    }

    // Get all players in the match with their ELO ratings
    const { data: matchPlayers, error: playersError } = await supabase
      .from("match_players")
      .select(`
        id,
        player_id,
        team,
        is_goalkeeper,
        players!inner(elo)
      `)
      .eq("match_id", matchId);

    if (playersError) {
      return {
        success: false,
        reassignedPlayers: 0,
        errors: [`Failed to fetch match players: ${playersError.message}`],
      };
    }

    if (!matchPlayers || matchPlayers.length === 0) {
      return {
        success: false,
        reassignedPlayers: 0,
        errors: ["No players found in this match"],
      };
    }

    const fieldPlayers = matchPlayers.filter((mp) => !mp.is_goalkeeper);

    if (fieldPlayers.length === 0) {
      return {
        success: true,
        reassignedPlayers: 0,
        errors: ["No field players to randomize"],
      };
    }

    // Convert to our internal format
    const players: MatchPlayer[] = fieldPlayers.map((mp) => ({
      id: mp.id,
      player_id: mp.player_id,
      team: mp.team as "A" | "B",
      is_goalkeeper: mp.is_goalkeeper,
      elo: (mp.players as any)?.elo || 1500,
    }));

    // Assign teams based on mode
    const teamAssignments = mode === "random"
      ? assignTeamsRandom(players)
      : assignTeamsBalanced(players);

    // Update team assignments in database
    const updates = teamAssignments.map((assignment) =>
      supabase
        .from("match_players")
        .update({ team: assignment.team })
        .eq("player_id", assignment.player_id)
        .eq("match_id", matchId)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors: string[] = [];
    results.forEach((result, index) => {
      if (result.error) {
        errors.push(
          `Failed to update player ${
            teamAssignments[index].player_id
          }: ${result.error.message}`,
        );
      }
    });

    return {
      success: errors.length === 0,
      reassignedPlayers: fieldPlayers.length,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      reassignedPlayers: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Parse request body
    const { matchId, mode }: RandomizeTeamsRequest = await req.json();

    if (!matchId || !mode) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: matchId and mode",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    if (!["random", "balanced"].includes(mode)) {
      return new Response(
        JSON.stringify({
          error: "Mode must be either 'random' or 'balanced'",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    console.log("Randomizing teams...");
    console.log("Match ID:", matchId);
    console.log("Mode:", mode);

    const result = await randomizeTeams(matchId, mode);

    console.log("Result:", result);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        reassignedPlayers: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js";
import { createClient } from "@supabase/supabase-js";

interface FillGameRequest {
  matchId: string;
}

interface FillGameResult {
  success: boolean;
  addedPlayers: number;
  matchedPlayers: Array<{
    id: string;
    name: string | null;
    list_name: string | null;
  }>;
  unmatchedNames: string[];
  errors: string[];
  randomized: boolean;
}

interface ScrapingResult {
  attendingPlayers: string[];
  error?: string;
}

interface MatchResult {
  matchedPlayers: Array<{
    id: string;
    name: string | null;
    list_name: string | null;
    elo: number | null;
    is_active: boolean | null;
    created_at: string | null;
    user_id: string | null;
  }>;
  unmatchedNames: string[];
  error?: string;
}

// Helper function to get default goalkeepers from environment variables
function getDefaultGoalkeepers(): {
  teamA: string | null;
  teamB: string | null;
} {
  const teamA = Deno.env.get("DEFAULT_GOALKEEPER_A") || null;
  const teamB = Deno.env.get("DEFAULT_GOALKEEPER_B") || null;

  return { teamA, teamB };
}

// Helper function to check if a player matches a goalkeeper name
function isGoalkeeperMatch(
  player: MatchResult["matchedPlayers"][0],
  goalkeeperName: string,
): boolean {
  if (!goalkeeperName) {
    return false;
  }

  const normalizedGoalkeeperName = goalkeeperName.toLowerCase().trim();
  const playerName = player.name?.toLowerCase().trim() || "";
  const playerListName = player.list_name?.toLowerCase().trim() || "";

  // Check for exact matches or partial matches (contains)
  const nameMatch = playerName.includes(normalizedGoalkeeperName);
  const listNameMatch = playerListName.includes(normalizedGoalkeeperName);
  const goalkeeperContainsName = normalizedGoalkeeperName.includes(playerName);
  const goalkeeperContainsListName = normalizedGoalkeeperName.includes(
    playerListName,
  );

  const isMatch = nameMatch || listNameMatch || goalkeeperContainsName ||
    goalkeeperContainsListName;

  return isMatch;
}

// Helper function to identify and separate goalkeepers from field players
function identifyGoalkeepers(
  players: MatchResult["matchedPlayers"],
): {
  teamAGoalkeeper: MatchResult["matchedPlayers"][0] | null;
  teamBGoalkeeper: MatchResult["matchedPlayers"][0] | null;
  fieldPlayers: MatchResult["matchedPlayers"];
} {
  const defaultGoalkeepers = getDefaultGoalkeepers();
  let teamAGoalkeeper: MatchResult["matchedPlayers"][0] | null = null;
  let teamBGoalkeeper: MatchResult["matchedPlayers"][0] | null = null;
  const fieldPlayers: MatchResult["matchedPlayers"] = [];

  for (const player of players) {
    let assignedAsGoalkeeper = false;

    // Check if player matches Team A goalkeeper
    if (!teamAGoalkeeper && defaultGoalkeepers.teamA) {
      if (isGoalkeeperMatch(player, defaultGoalkeepers.teamA)) {
        teamAGoalkeeper = player;
        assignedAsGoalkeeper = true;
      }
    } else if (!defaultGoalkeepers.teamA) {
    } else {
    }

    // Check if player matches Team B goalkeeper (and wasn't already assigned to Team A)
    if (!assignedAsGoalkeeper && !teamBGoalkeeper && defaultGoalkeepers.teamB) {
      if (isGoalkeeperMatch(player, defaultGoalkeepers.teamB)) {
        teamBGoalkeeper = player;
        assignedAsGoalkeeper = true;
      }
    } else if (!defaultGoalkeepers.teamB) {
    } else if (teamBGoalkeeper) {
    }

    // If not assigned as goalkeeper, add to field players
    if (!assignedAsGoalkeeper) {
      fieldPlayers.push(player);
    }
  }

  return { teamAGoalkeeper, teamBGoalkeeper, fieldPlayers };
}

async function callScrapeAttendees(url: string): Promise<ScrapingResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const scrapeUrl = `${supabaseUrl}/functions/v1/scrape_attendees`;

  const response = await fetch(scrapeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Scrape attendees failed: ${response.status}`);
  }

  return await response.json();
}

async function callMatchAttendeesToPlayers(
  attendingPlayers: string[],
): Promise<MatchResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const matchUrl = `${supabaseUrl}/functions/v1/match_attendees_to_players`;

  const response = await fetch(matchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ attendingPlayers }),
  });

  if (!response.ok) {
    throw new Error(`Match attendees to players failed: ${response.status}`);
  }

  return await response.json();
}

async function callRandomizeTeams(
  matchId: string,
  mode: "random" | "balanced" = "random",
): Promise<{ success: boolean; reassignedPlayers: number; errors: string[] }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const randomizeUrl = `${supabaseUrl}/functions/v1/randomize_teams`;

  const response = await fetch(randomizeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ matchId, mode }),
  });

  if (!response.ok) {
    throw new Error(`Randomize teams failed: ${response.status}`);
  }

  return await response.json();
}

async function addPlayersToMatch(
  supabase: any,
  matchId: string,
  players: MatchResult["matchedPlayers"],
): Promise<{ success: boolean; errors: string[]; addedCount: number }> {
  const errors: string[] = [];

  // First, check if match exists and is in planned status
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, match_status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return { success: false, errors: ["Match not found"], addedCount: 0 };
  }

  if (match.match_status === "finished") {
    return {
      success: false,
      errors: ["Cannot add players to finished matches"],
      addedCount: 0,
    };
  }

  // Get existing players in this match to avoid duplicates
  const { data: existingPlayers, error: existingError } = await supabase
    .from("match_players")
    .select("player_id")
    .eq("match_id", matchId);

  if (existingError) {
    return {
      success: false,
      errors: [`Failed to check existing players: ${existingError.message}`],
      addedCount: 0,
    };
  }

  const existingPlayerIds = new Set(
    existingPlayers?.map((p: { player_id: any }) => p.player_id) || [],
  );

  // Filter out players that already exist in the match and inactive players
  const newPlayers = players.filter((player) =>
    !existingPlayerIds.has(player.id) && player.is_active === true
  );

  if (newPlayers.length === 0) {
    return { success: true, errors: [], addedCount: 0 };
  }

  // Identify goalkeepers and field players

  const { teamAGoalkeeper, teamBGoalkeeper, fieldPlayers } =
    identifyGoalkeepers(newPlayers);

  const matchPlayers = [];

  // Add goalkeepers first
  if (teamAGoalkeeper) {
    matchPlayers.push({
      match_id: matchId,
      player_id: teamAGoalkeeper.id,
      team: "A",
      is_goalkeeper: true,
    });
  }

  if (teamBGoalkeeper) {
    matchPlayers.push({
      match_id: matchId,
      player_id: teamBGoalkeeper.id,
      team: "B",
      is_goalkeeper: true,
    });
  }

  // Add field players alternating between teams
  fieldPlayers.forEach((player, index) => {
    // Alternate teams starting with A
    const team = index % 2 === 0 ? "A" : "B";

    matchPlayers.push({
      match_id: matchId,
      player_id: player.id,
      team,
      is_goalkeeper: false,
    });
  });

  const { error: insertError } = await supabase
    .from("match_players")
    .insert(matchPlayers);

  if (insertError) {
    errors.push(`Failed to add players to match: ${insertError.message}`);
  }

  return {
    success: errors.length === 0,
    errors,
    addedCount: newPlayers.length,
  };
}

async function fillGameFromAttendees(
  matchId: string,
): Promise<FillGameResult> {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Resolve URL from env and scrape attendees
    const url = Deno.env.get("BOKAT_URL");
    if (!url) {
      return {
        success: false,
        addedPlayers: 0,
        matchedPlayers: [],
        unmatchedNames: [],
        errors: ["BOKAT_URL env variable is not set"],
        randomized: false,
      };
    }

    const scrapingResult = await callScrapeAttendees(url);

    if (scrapingResult.error) {
      return {
        success: false,
        addedPlayers: 0,
        matchedPlayers: [],
        unmatchedNames: [],
        errors: [`Scraping failed: ${scrapingResult.error}`],
        randomized: false,
      };
    }

    if (scrapingResult.attendingPlayers.length === 0) {
      return {
        success: true,
        addedPlayers: 0,
        matchedPlayers: [],
        unmatchedNames: [],
        errors: ["No attending players found"],
        randomized: false,
      };
    }

    // Step 2: Match attendees to players
    const matchResult = await callMatchAttendeesToPlayers(
      scrapingResult.attendingPlayers,
    );

    if (matchResult.error) {
      return {
        success: false,
        addedPlayers: 0,
        matchedPlayers: [],
        unmatchedNames: scrapingResult.attendingPlayers,
        errors: [`Matching failed: ${matchResult.error}`],
        randomized: false,
      };
    }

    // Step 3: Add matched players to match
    const addResult = await addPlayersToMatch(
      supabase,
      matchId,
      matchResult.matchedPlayers,
    );

    let randomized = false;
    if (addResult.success && addResult.addedCount > 0) {
      // Step 4: Randomize teams after adding players
      try {
        const randomizeResult = await callRandomizeTeams(matchId, "random");
        randomized = randomizeResult.success;
        if (!randomizeResult.success) {
          addResult.errors.push(
            `Team randomization failed: ${randomizeResult.errors.join(", ")}`,
          );
        }
      } catch (error) {
        addResult.errors.push(
          `Team randomization error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    return {
      success: addResult.success,
      addedPlayers: addResult.addedCount,
      matchedPlayers: matchResult.matchedPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        list_name: p.list_name,
      })),
      unmatchedNames: matchResult.unmatchedNames,
      errors: addResult.errors,
      randomized,
    };
  } catch (error) {
    return {
      success: false,
      addedPlayers: 0,
      matchedPlayers: [],
      unmatchedNames: [],
      errors: [error instanceof Error ? error.message : "Unknown error"],
      randomized: false,
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
    const { matchId }: FillGameRequest = await req.json();

    if (!matchId) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: matchId",
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

    const result = await fillGameFromAttendees(matchId);

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
        addedPlayers: 0,
        matchedPlayers: [],
        unmatchedNames: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
        randomized: false,
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

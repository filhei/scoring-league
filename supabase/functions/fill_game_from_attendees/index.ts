// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js";
import { createClient } from "@supabase/supabase-js";

interface FillGameRequest {
  matchId: string;
  url: string;
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

async function callScrapeAttendees(url: string): Promise<ScrapingResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const scrapeUrl = `${supabaseUrl}/functions/v1/scrape_attendees`;

  const response = await fetch(scrapeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ url }),
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

  // Add new players alternating between teams A and B
  const matchPlayers = newPlayers.map((player, index) => ({
    match_id: matchId,
    player_id: player.id,
    team: index % 2 === 0 ? "A" : "B",
    is_goalkeeper: false, // Default to false, can be updated later
  }));

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
  url: string,
): Promise<FillGameResult> {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Scrape attendees
    console.log("Scraping attendees from URL:", url);
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
    console.log(
      "Matching attendees to players:",
      scrapingResult.attendingPlayers,
    );
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
    console.log("Adding players to match:", matchResult.matchedPlayers.length);
    const addResult = await addPlayersToMatch(
      supabase,
      matchId,
      matchResult.matchedPlayers,
    );

    let randomized = false;
    if (addResult.success && addResult.addedCount > 0) {
      // Step 4: Randomize teams after adding players
      console.log("Randomizing teams for match:", matchId);
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
    const { matchId, url }: FillGameRequest = await req.json();

    if (!matchId || !url) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: matchId and url",
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

    console.log("Filling game from attendees...");
    console.log("Match ID:", matchId);
    console.log("URL:", url);

    const result = await fillGameFromAttendees(matchId, url);

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

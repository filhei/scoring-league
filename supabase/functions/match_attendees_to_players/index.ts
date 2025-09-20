// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js";
import { createClient } from "@supabase/supabase-js";

// Types based on database schema
interface Player {
  id: string;
  name: string | null;
  list_name: string | null;
  elo: number | null;
  is_active: boolean | null;
  created_at: string | null;
  user_id: string | null;
}

interface MatchRequest {
  attendingPlayers: string[];
}

interface MatchResult {
  matchedPlayers: Player[];
  unmatchedNames: string[];
  error?: string;
}

// Helper function to normalize names for comparison
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

// Helper function to find best matches using fuzzy matching
function findBestMatches(
  attendeeNames: string[],
  players: Player[],
): { matchedPlayers: Player[]; unmatchedNames: string[] } {
  const matchedPlayers: Player[] = [];
  const unmatchedNames: string[] = [];

  // Create a map of normalized list_names to players for faster lookup
  const playerMap = new Map<string, Player>();
  players.forEach((player) => {
    if (player.list_name) {
      const normalized = normalizeName(player.list_name);
      playerMap.set(normalized, player);
    }
  });

  // Try exact matches first
  const exactMatches = new Set<string>();
  attendeeNames.forEach((attendeeName) => {
    const normalized = normalizeName(attendeeName);
    const player = playerMap.get(normalized);
    if (player) {
      matchedPlayers.push(player);
      exactMatches.add(attendeeName);
    }
  });

  // Find unmatched names
  attendeeNames.forEach((attendeeName) => {
    if (!exactMatches.has(attendeeName)) {
      unmatchedNames.push(attendeeName);
    }
  });

  return { matchedPlayers, unmatchedNames };
}

async function matchAttendeesToPlayers(
  attendeeNames: string[],
): Promise<MatchResult> {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query all active players to get their list_names
    const { data: players, error } = await supabase
      .from("players")
      .select("id, name, list_name, elo, is_active, created_at, user_id")
      .eq("is_active", true)
      .not("list_name", "is", null);

    if (error) {
      return {
        matchedPlayers: [],
        unmatchedNames: attendeeNames,
        error: `Database error: ${error.message}`,
      };
    }

    if (!players || players.length === 0) {
      return {
        matchedPlayers: [],
        unmatchedNames: attendeeNames,
        error: "No active players found in database",
      };
    }

    // Find matches
    const { matchedPlayers, unmatchedNames } = findBestMatches(
      attendeeNames,
      players,
    );

    return {
      matchedPlayers,
      unmatchedNames,
    };
  } catch (error) {
    return {
      matchedPlayers: [],
      unmatchedNames: attendeeNames,
      error: error instanceof Error ? error.message : "Unknown error",
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

    // Parse request body with proper UTF-8 handling
    const requestText = await req.text();
    const { attendingPlayers }: MatchRequest = JSON.parse(requestText);

    if (!attendingPlayers || !Array.isArray(attendingPlayers)) {
      return new Response(
        JSON.stringify({
          error:
            "Missing or invalid field: attendingPlayers (must be an array)",
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

    if (attendingPlayers.length === 0) {
      return new Response(
        JSON.stringify({
          matchedPlayers: [],
          unmatchedNames: [],
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const result = await matchAttendeesToPlayers(attendingPlayers);

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
    return new Response(
      JSON.stringify({
        matchedPlayers: [],
        unmatchedNames: [],
        error: error instanceof Error ? error.message : "Unknown error",
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

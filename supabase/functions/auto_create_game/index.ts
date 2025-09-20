// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type AutoCreateRequest = Record<string, never>;

interface AutoCreateResult {
  success: boolean;
  matchId?: string;
  addedPlayers?: number;
  unmatchedNames?: string[];
  errors?: string[];
  randomized?: boolean;
}

async function insertPlannedMatch(supabase: SupabaseClient) {
  const payload: Record<string, unknown> = { match_status: "planned" };

  const { data, error } = await supabase
    .from("matches")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create match: ${error.message}`);
  return data.id as string;
}

async function callFillGameFromAttendees(matchId: string, url: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const endpoint = `${supabaseUrl}/functions/v1/fill_game_from_attendees`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ matchId, url }),
  });

  if (!res.ok) {
    throw new Error(`fill_game_from_attendees failed: ${res.status}`);
  }
  return await res.json();
}

Deno.serve(async (req: Request) => {
  try {
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
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const url = Deno.env.get("BOKAT_URL");
    if (!url) {
      return new Response(
        JSON.stringify({ error: "BOKAT_URL env variable is not set" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const matchId = await insertPlannedMatch(supabase);

    const fillResult = await callFillGameFromAttendees(matchId, url);

    const response: AutoCreateResult = {
      success: !!fillResult?.success,
      matchId,
      addedPlayers: fillResult?.addedPlayers ?? 0,
      unmatchedNames: fillResult?.unmatchedNames ?? [],
      errors: fillResult?.errors ?? [],
      randomized: fillResult?.randomized ?? false,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("auto_create_game error:", error);
    const payload: AutoCreateResult = {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
    return new Response(JSON.stringify(payload), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/auto_create_game' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json'

*/

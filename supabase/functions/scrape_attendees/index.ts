// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js";
import { Document, DOMParser, Element } from "deno_dom";

interface ScrapingResult {
  attendingPlayers: string[];
  error?: string;
}

type ScrapeRequest = Record<string, never>;

// Helper function to find parent element by tag name (replaces .closest())
function findParentByTagName(
  element: Element,
  tagName: string,
): Element | null {
  let current = element.parentElement;
  while (current) {
    if (current.tagName.toLowerCase() === tagName.toLowerCase()) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function findPlayerTable(doc: Document): Element | null {
  // Look for the Status header
  const thElements = doc.querySelectorAll("th");

  for (const th of thElements) {
    const text = th.textContent?.trim() || "";
    if (text.includes("Status")) {
      // Navigate up to find the table
      const table = findParentByTagName(th as Element, "table");
      if (table) {
        // Verify it's the right table by checking other headers
        const headers = table.querySelectorAll("th");
        const headerTexts = Array.from(headers).map((h) =>
          h.textContent?.trim() || ""
        );
        const requiredHeaders = ["Status", "Namn", "Kommentar"];
        const hasAllHeaders = requiredHeaders.every((header) =>
          headerTexts.some((text) => text.includes(header))
        );

        if (hasAllHeaders) {
          return table;
        }
      }
    }
  }

  return null;
}

function findAttendingPlayers(
  playerTable: Element | null,
): string[] {
  if (!playerTable) return [];

  const players: string[] = [];
  const rows = playerTable.querySelectorAll("tr");

  for (const row of rows) {
    const nameCell = (row as Element).querySelector("td.TextSmall");
    if (!nameCell) continue;

    let playerName = nameCell.textContent?.trim() || "";

    // Remove dates in parentheses
    if (playerName.includes("(")) {
      const parts = playerName.split("(");
      playerName = parts.slice(0, -1).join("(").trim();
    }

    // Skip empty names
    if (!playerName) continue;

    // Find img tag with specific pattern
    const imgTags = (row as Element).querySelectorAll("img");

    for (const img of imgTags) {
      const src = (img as Element).getAttribute("src");
      if (src && src.startsWith("/images/") && src.endsWith(".png")) {
        // Extract filename and check if it's "yes.png"
        const filename = src.split("/").pop() || "";
        const nameWithoutExtension = filename.replace(".png", "");
        const isAttending = nameWithoutExtension === "yes";

        if (isAttending) {
          players.push(playerName);
        }
        break;
      }
    }
  }

  return players;
}

async function scrapeEventData(
  url: string,
): Promise<ScrapingResult> {
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle encoding properly to fix character issues
    const contentType = response.headers.get("content-type") || "";

    // Extract charset from Content-Type header
    let encoding = "utf-8"; // default
    const charsetMatch = contentType.match(/charset=([^;]+)/i);
    if (charsetMatch) {
      encoding = charsetMatch[1].toLowerCase();
    }

    // Get the response as ArrayBuffer and decode with correct encoding
    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder(encoding);
    const html = decoder.decode(arrayBuffer);
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    const playerTable = findPlayerTable(doc);
    const attendingPlayers = findAttendingPlayers(playerTable);

    return { attendingPlayers };
  } catch (error) {
    console.error("Scraping error:", error);
    return {
      attendingPlayers: [],
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

    const result = await scrapeEventData(url);

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
        attendingPlayers: [],
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

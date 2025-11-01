import { NextRequest, NextResponse } from "next/server";
import {
  getAllMatches,
  getTournamentConfig,
  updateMatch,
  insertMatches,
  updateTournamentConfig,
  resetTournament,
  Match,
} from "@/lib/db";

// GET - Fetch all matches and config
export async function GET() {
  try {
    const matches = await getAllMatches();
    const config = await getTournamentConfig();

    return NextResponse.json({
      matches,
      cycles: config.cycles,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

// POST - Update match score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, match, matches, cycles } = body;

    if (action === "update_score") {
      const updatedMatch = await updateMatch(match);
      return NextResponse.json(updatedMatch);
    }

    if (action === "add_cycle") {
      // Insert new matches
      await insertMatches(matches);
      // Update cycle count
      await updateTournamentConfig(cycles);
      return NextResponse.json({ success: true });
    }

    if (action === "reset") {
      await resetTournament();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// Alternative file structure for Pages Router:
// Create pages/api/matches.ts instead with the same logic but using:
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'GET') { ... }
//   else if (req.method === 'POST') { ... }
// }

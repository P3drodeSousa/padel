import { sql } from "@vercel/postgres";

export interface Match {
  id: string;
  cycle: number;
  round: number;
  global_round: number;
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  resting_player: string;
  score1_set1: number | null;
  score1_set2: number | null;
  score2_set1: number | null;
  score2_set2: number | null;
  completed: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TournamentConfig {
  id: number;
  cycles: number;
  updated_at?: Date;
}

// Get all matches
export async function getAllMatches(): Promise<Match[]> {
  const { rows } = await sql<Match>`
    SELECT * FROM matches 
    ORDER BY cycle DESC, round ASC
  `;
  return rows;
}

// Get tournament config
export async function getTournamentConfig(): Promise<TournamentConfig> {
  const { rows } = await sql<TournamentConfig>`
    SELECT * FROM tournament_config WHERE id = 1
  `;
  return rows[0] || { id: 1, cycles: 1 };
}

// Update match scores
export async function updateMatch(match: Match): Promise<Match> {
  const { rows } = await sql<Match>`
    UPDATE matches 
    SET 
      score1_set1 = ${match.score1_set1},
      score1_set2 = ${match.score1_set2},
      score2_set1 = ${match.score2_set1},
      score2_set2 = ${match.score2_set2},
      completed = ${match.completed},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${match.id}
    RETURNING *
  `;
  return rows[0];
}

// Insert new matches (for new cycle)
export async function insertMatches(matches: Match[]): Promise<void> {
  for (const match of matches) {
    await sql`
      INSERT INTO matches (
        id, cycle, round, global_round,
        team1_player1, team1_player2,
        team2_player1, team2_player2,
        resting_player,
        score1_set1, score1_set2,
        score2_set1, score2_set2,
        completed
      ) VALUES (
        ${match.id}, ${match.cycle}, ${match.round}, ${match.global_round},
        ${match.team1_player1}, ${match.team1_player2},
        ${match.team2_player1}, ${match.team2_player2},
        ${match.resting_player},
        ${match.score1_set1}, ${match.score1_set2},
        ${match.score2_set1}, ${match.score2_set2},
        ${match.completed}
      )
    `;
  }
}

// Update tournament config
export async function updateTournamentConfig(cycles: number): Promise<void> {
  await sql`
    UPDATE tournament_config 
    SET cycles = ${cycles}, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;
}

// Reset all data
export async function resetTournament(): Promise<void> {
  await sql`DELETE FROM matches`;
  await sql`UPDATE tournament_config SET cycles = 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;
}

"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  RotateCw,
  Plus,
} from "lucide-react";

// Types
type PlayerName = "Gonza" | "Pedro" | "Paulo" | "Ivo" | "Diogo";

interface TournamentMatch {
  round: number;
  team1: [PlayerName, PlayerName];
  team2: [PlayerName, PlayerName];
  resting: PlayerName;
}

interface Match extends TournamentMatch {
  id: string;
  cycle: number;
  globalRound: number;
  score1: number | null;
  score2: number | null;
  completed: boolean;
}

interface DBMatch {
  id: string;
  cycle: number;
  round: number;
  global_round: number;
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  resting_player: string;
  score1: number | null;
  score2: number | null;
  completed: boolean;
}

interface MatchStats {
  played: number;
  won: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
}

interface Stats {
  [player: string]: MatchStats;
}

interface LeaderEntry extends MatchStats {
  name: PlayerName;
  winRate: string | number;
}

// Tournament structure
const TOURNAMENT_STRUCTURE: TournamentMatch[] = [
  {
    round: 1,
    team1: ["Pedro", "Paulo"],
    team2: ["Ivo", "Diogo"],
    resting: "Gonza",
  },
  {
    round: 2,
    team1: ["Gonza", "Paulo"],
    team2: ["Ivo", "Diogo"],
    resting: "Pedro",
  },
  {
    round: 3,
    team1: ["Gonza", "Pedro"],
    team2: ["Ivo", "Diogo"],
    resting: "Paulo",
  },
  {
    round: 4,
    team1: ["Gonza", "Pedro"],
    team2: ["Paulo", "Diogo"],
    resting: "Ivo",
  },
  {
    round: 5,
    team1: ["Gonza", "Pedro"],
    team2: ["Paulo", "Ivo"],
    resting: "Diogo",
  },
  {
    round: 6,
    team1: ["Pedro", "Ivo"],
    team2: ["Paulo", "Diogo"],
    resting: "Gonza",
  },
  {
    round: 7,
    team1: ["Gonza", "Ivo"],
    team2: ["Paulo", "Diogo"],
    resting: "Pedro",
  },
  {
    round: 8,
    team1: ["Gonza", "Ivo"],
    team2: ["Pedro", "Diogo"],
    resting: "Paulo",
  },
  {
    round: 9,
    team1: ["Gonza", "Paulo"],
    team2: ["Pedro", "Diogo"],
    resting: "Ivo",
  },
  {
    round: 10,
    team1: ["Gonza", "Paulo"],
    team2: ["Pedro", "Ivo"],
    resting: "Diogo",
  },
  {
    round: 11,
    team1: ["Pedro", "Diogo"],
    team2: ["Paulo", "Ivo"],
    resting: "Gonza",
  },
  {
    round: 12,
    team1: ["Gonza", "Diogo"],
    team2: ["Paulo", "Ivo"],
    resting: "Pedro",
  },
  {
    round: 13,
    team1: ["Gonza", "Diogo"],
    team2: ["Pedro", "Ivo"],
    resting: "Paulo",
  },
  {
    round: 14,
    team1: ["Gonza", "Diogo"],
    team2: ["Pedro", "Paulo"],
    resting: "Ivo",
  },
  {
    round: 15,
    team1: ["Gonza", "Ivo"],
    team2: ["Pedro", "Paulo"],
    resting: "Diogo",
  },
];

const PLAYERS: PlayerName[] = ["Gonza", "Pedro", "Paulo", "Ivo", "Diogo"];

// Convert DB format to app format
function dbMatchToMatch(dbMatch: DBMatch): Match {
  return {
    id: dbMatch.id,
    cycle: dbMatch.cycle,
    round: dbMatch.round,
    globalRound: dbMatch.global_round,
    team1: [
      dbMatch.team1_player1 as PlayerName,
      dbMatch.team1_player2 as PlayerName,
    ],
    team2: [
      dbMatch.team2_player1 as PlayerName,
      dbMatch.team2_player2 as PlayerName,
    ],
    resting: dbMatch.resting_player as PlayerName,
    score1: dbMatch.score1,
    score2: dbMatch.score2,
    completed: dbMatch.completed,
  };
}

// Convert app format to DB format
function matchToDbMatch(match: Match): DBMatch {
  return {
    id: match.id,
    cycle: match.cycle,
    round: match.round,
    global_round: match.globalRound,
    team1_player1: match.team1[0],
    team1_player2: match.team1[1],
    team2_player1: match.team2[0],
    team2_player2: match.team2[1],
    resting_player: match.resting,
    score1: match.score1,
    score2: match.score2,
    completed: match.completed,
  };
}

export default function PadelTournament() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [cycles, setCycles] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"matches" | "leaderboard">(
    "matches"
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const getInitialMatches = (
    cycle: number,
    startGlobalRound: number = 1
  ): Match[] =>
    TOURNAMENT_STRUCTURE.map((match, idx) => ({
      ...match,
      id: `cycle-${cycle}-round-${match.round}`,
      cycle: cycle,
      globalRound: startGlobalRound + idx,
      score1: null,
      score2: null,
      completed: false,
    }));

  const loadMatches = async () => {
    try {
      const response = await fetch("/api/matches");
      if (!response.ok) throw new Error("Failed to fetch matches");

      const data = await response.json();

      if (data.matches && data.matches.length > 0) {
        const convertedMatches = data.matches.map(dbMatchToMatch);
        setMatches(convertedMatches);
        setCycles(data.cycles || 1);
      } else {
        const initialMatches = getInitialMatches(1);
        await initializeDatabase(initialMatches);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
      alert("Failed to load tournament data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const initializeDatabase = async (initialMatches: Match[]) => {
    try {
      const dbMatches = initialMatches.map(matchToDbMatch);
      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_cycle",
          matches: dbMatches,
          cycles: 1,
        }),
      });
      setMatches(initialMatches);
      setCycles(1);
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  };

  const updateScore = async (
    matchId: string,
    field: "score1" | "score2",
    value: string
  ) => {
    const numValue = value === "" ? null : parseInt(value);

    const updatedMatches = matches.map((match) => {
      if (match.id === matchId) {
        const updatedMatch = { ...match, [field]: numValue };

        // Mark as completed if both scores are set
        if (updatedMatch.score1 !== null && updatedMatch.score2 !== null) {
          updatedMatch.completed = true;
        } else {
          updatedMatch.completed = false;
        }

        saveMatchToDatabase(updatedMatch);
        return updatedMatch;
      }
      return match;
    });

    setMatches(updatedMatches);
  };

  const saveMatchToDatabase = async (match: Match) => {
    try {
      setSaving(true);
      const dbMatch = matchToDbMatch(match);
      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_score",
          match: dbMatch,
        }),
      });
    } catch (error) {
      console.error("Error saving match:", error);
      alert("Failed to save match scores");
    } finally {
      setSaving(false);
    }
  };

  const addNewCycle = async () => {
    try {
      setSaving(true);
      const newCycle = cycles + 1;
      const newMatches = getInitialMatches(newCycle, matches.length + 1);
      const dbMatches = newMatches.map(matchToDbMatch);

      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_cycle",
          matches: dbMatches,
          cycles: newCycle,
        }),
      });

      setMatches([...matches, ...newMatches]);
      setCycles(newCycle);
    } catch (error) {
      console.error("Error adding new cycle:", error);
      alert("Failed to add new cycle");
    } finally {
      setSaving(false);
    }
  };

  const resetTournament = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all matches? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      const initialMatches = getInitialMatches(1);
      await initializeDatabase(initialMatches);
    } catch (error) {
      console.error("Error resetting tournament:", error);
      alert("Failed to reset tournament");
    } finally {
      setSaving(false);
    }
  };

  const getMatchWinner = (match: Match): "team1" | "team2" | "draw" | null => {
    if (!match.completed) return null;
    if (match.score1! > match.score2!) return "team1";
    if (match.score2! > match.score1!) return "team2";
    return "draw";
  };

  const calculateStats = (): Stats => {
    const stats: Stats = {};
    PLAYERS.forEach((player) => {
      stats[player] = {
        played: 0,
        won: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
      };
    });

    matches.forEach((match) => {
      if (!match.completed) return;
      const winner = getMatchWinner(match);
      const team1Won = winner === "team1";
      const team2Won = winner === "team2";
      const isDraw = winner === "draw";

      match.team1.forEach((player) => {
        stats[player].played++;
        stats[player].goalsFor += match.score1 ?? 0;
        stats[player].goalsAgainst += match.score2 ?? 0;
        if (team1Won) stats[player].won++;
        else if (team2Won) stats[player].lost++;
      });

      match.team2.forEach((player) => {
        stats[player].played++;
        stats[player].goalsFor += match.score2 ?? 0;
        stats[player].goalsAgainst += match.score1 ?? 0;
        if (team2Won) stats[player].won++;
        else if (team1Won) stats[player].lost++;
      });
    });

    // Calculate goal difference
    Object.keys(stats).forEach((player) => {
      stats[player].goalDiff =
        stats[player].goalsFor - stats[player].goalsAgainst;
    });

    return stats;
  };

  const stats = calculateStats();
  const leaderboard: LeaderEntry[] = Object.entries(stats)
    .map(([name, data]) => ({
      name: name as PlayerName,
      ...data,
      winRate:
        data.played > 0 ? ((data.won / data.played) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.won - a.won || b.goalDiff - a.goalDiff);

  const matchesByCycle: { [cycle: number]: Match[] } = {};
  matches.forEach((match) => {
    if (!matchesByCycle[match.cycle]) {
      matchesByCycle[match.cycle] = [];
    }
    matchesByCycle[match.cycle].push(match);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading tournament...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Padel Tournament
                </h1>
                <p className="text-gray-600">
                  5 Players - {matches.length} Total Rounds ({cycles} Cycle
                  {cycles > 1 ? "s" : ""})
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addNewCycle}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Add 15 Rounds
              </button>
              <button
                onClick={resetTournament}
                disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Database Info */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>💾 Database:</strong> Connected to Vercel Postgres. All
              scores are automatically saved.
              {saving && <span className="ml-2 text-green-600">Saving...</span>}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "matches"
                ? "bg-white text-blue-600 shadow-lg"
                : "bg-white/50 text-gray-600 hover:bg-white"
            }`}
          >
            <Calendar className="w-5 h-5" />
            Matches
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "leaderboard"
                ? "bg-white text-blue-600 shadow-lg"
                : "bg-white/50 text-gray-600 hover:bg-white"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Leaderboard
          </button>
        </div>

        {/* Content */}
        {activeTab === "matches" && (
          <div className="space-y-8">
            {Object.keys(matchesByCycle)
              .sort((a, b) => Number(b) - Number(a))
              .map((cycleNum) => (
                <div key={cycleNum} className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <RotateCw className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Cycle {cycleNum}
                    </h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {
                        matchesByCycle[Number(cycleNum)].filter(
                          (m) => m.completed
                        ).length
                      }{" "}
                      / {matchesByCycle[Number(cycleNum)].length} completed
                    </span>
                  </div>
                  {matchesByCycle[Number(cycleNum)].map((match) => {
                    const winner = getMatchWinner(match);
                    return (
                      <div
                        key={match.id}
                        className={`bg-white rounded-lg shadow-md p-6 transition ${
                          match.completed
                            ? "border-l-4 border-green-500"
                            : "border-l-4 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {match.round}
                            </div>
                            <div className="text-sm text-gray-500">
                              Resting:{" "}
                              <span className="font-medium text-gray-700">
                                {match.resting}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              #{match.globalRound}
                            </div>
                          </div>
                          {match.completed && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              Final: {match.score1} - {match.score2}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          {/* Team 1 */}
                          <div
                            className={`p-4 rounded-lg ${
                              winner === "team1"
                                ? "bg-green-50 border-2 border-green-500"
                                : winner === "draw"
                                ? "bg-yellow-50 border-2 border-yellow-400"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <Users className="w-5 h-5 text-blue-500" />
                                <span className="font-semibold text-gray-800">
                                  {match.team1.join(" & ")}
                                </span>
                                {winner === "team1" && (
                                  <Trophy className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <input
                                type="number"
                                min={0}
                                max={99}
                                value={
                                  match.score1 === null ? "" : match.score1
                                }
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  updateScore(
                                    match.id,
                                    "score1",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-16 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center text-2xl font-bold"
                              />
                            </div>
                          </div>

                          {/* VS Divider */}
                          <div className="text-center">
                            <span className="text-2xl font-bold text-gray-400">
                              VS
                            </span>
                          </div>

                          {/* Team 2 */}
                          <div
                            className={`p-4 rounded-lg ${
                              winner === "team2"
                                ? "bg-green-50 border-2 border-green-500"
                                : winner === "draw"
                                ? "bg-yellow-50 border-2 border-yellow-400"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <input
                                type="number"
                                min={0}
                                max={99}
                                value={
                                  match.score2 === null ? "" : match.score2
                                }
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  updateScore(
                                    match.id,
                                    "score2",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-16 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center text-2xl font-bold"
                              />
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                {winner === "team2" && (
                                  <Trophy className="w-5 h-5 text-green-600" />
                                )}
                                <span className="font-semibold text-gray-800">
                                  {match.team2.join(" & ")}
                                </span>
                                <Users className="w-5 h-5 text-red-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        )}
        {activeTab === "leaderboard" && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Player
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Played
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">Won</th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Lost
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Win %
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Goals For
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Goals Against
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Goal Diff
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr
                      key={player.name}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition ${
                        index === 0 ? "bg-yellow-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Trophy className="w-5 h-5 text-yellow-500" />
                          )}
                          <span className="font-bold text-gray-700">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {player.name}
                      </td>
                      <td className="px-6 py-4 text-center">{player.played}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-semibold">
                        {player.won}
                      </td>
                      <td className="px-6 py-4 text-center text-red-600 font-semibold">
                        {player.lost}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {player.winRate}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        {player.goalsFor}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {player.goalsAgainst}
                      </td>
                      <td
                        className={`px-6 py-4 text-center font-semibold ${
                          player.goalDiff > 0
                            ? "text-green-600"
                            : player.goalDiff < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {player.goalDiff > 0 ? "+" : ""}
                        {player.goalDiff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

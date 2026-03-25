"use client";

import { useState, useCallback } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import { CONTRACT_ADDRESS, RPC_URL } from "@/lib/constants";
import { TYPING_SCORES_ABI } from "@/lib/evm-abi";

export interface LeaderboardEntry {
  address: string;
  xUsername?: string;
  wpm: number;
  races: number;
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRaces, setTotalRaces] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);

  const refresh = useCallback(async () => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setEntries([]);
      setTotalRaces(0);
      setTotalKeystrokes(0);
      return;
    }

    setLoading(true);

    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(CONTRACT_ADDRESS, TYPING_SCORES_ABI, provider);

      const [globalStats, topScores] = await Promise.all([
        contract.getGlobalStats(),
        contract.getTopScores(25),
      ]);

      const [players, wpms, races] = topScores as [string[], bigint[], bigint[]];

      setTotalRaces(Number(globalStats[0]));
      setTotalKeystrokes(Number(globalStats[1]));

      const mapped: LeaderboardEntry[] = players.map((address, idx) => ({
        address,
        wpm: Number(wpms[idx] || BigInt(0)),
        races: Number(races[idx] || BigInt(0)),
      }));

      setEntries(mapped);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { entries, loading, refresh, totalRaces, totalKeystrokes };
}

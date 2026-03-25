"use client";

import { useCallback, useMemo, useState } from "react";
import { Contract, JsonRpcSigner } from "ethers";
import { CONTRACT_ADDRESS, GAME_CONFIG, VOYAGER_TX } from "@/lib/constants";
import { TYPING_SCORES_ABI } from "@/lib/evm-abi";

export interface WordTx {
  id: string;
  status: "pending" | "success" | "error";
  hash?: string;
  error?: string;
  wordNumber: number;
  timestamp: number;
}

interface UseTypingContractOpts {
  signer: JsonRpcSigner | null;
}

export function useTypingContract({ signer }: UseTypingContractOpts) {
  const [txLog, setTxLog] = useState<WordTx[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [raceId, setRaceId] = useState<string | null>(null);

  const contract = useMemo(() => {
    if (!signer) return null;
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return new Contract(CONTRACT_ADDRESS, TYPING_SCORES_ABI, signer);
  }, [signer]);

  const startRace = useCallback(async () => {
    setIsStarting(true);
    const nextRaceId = `${Date.now()}`;
    setRaceId(nextRaceId);
    setTxLog([]);
    setIsStarting(false);
    return nextRaceId;
  }, []);

  const recordWord = useCallback((wordNumber: number) => {
    setTxLog((prev) => {
      if (prev.length >= 200) return prev;
      return [
        {
          id: `local-${Date.now()}-${wordNumber}`,
          status: "success",
          wordNumber,
          timestamp: Date.now(),
        },
        ...prev,
      ];
    });
  }, []);

  const finishRace = useCallback(
    async (
      correctWords: number,
      _totalWords: number,
      wpm: number,
      accuracy: number
    ): Promise<{ hash: string; explorerUrl: string } | null> => {
      if (!contract) {
        setTxLog((prev) => [
          {
            id: `finish-config-${Date.now()}`,
            status: "success",
            wordNumber: Math.max(correctWords, 1),
            timestamp: Date.now(),
            error: "Local mode: configure NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local for on-chain submit.",
          },
          ...prev,
        ]);
        setRaceId(null);
        return null;
      }

      if (!raceId) {
        setTxLog((prev) => [
          {
            id: `finish-race-${Date.now()}`,
            status: "error",
            wordNumber: Math.max(correctWords, 1),
            timestamp: Date.now(),
            error: "No active race found. Start a new race and try again.",
          },
          ...prev,
        ]);
        return null;
      }

      const txId = `finish-${Date.now()}`;
      setTxLog((prev) => [
        {
          id: txId,
          status: "pending",
          wordNumber: Math.max(correctWords, 1),
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      setIsFinishing(true);

      try {
        const tx = await contract.submitScore(correctWords, wpm, accuracy);
        const receipt = await tx.wait();

        setTxLog((prev) =>
          prev.map((item) =>
            item.id === txId
              ? {
                  ...item,
                  status: "success",
                  hash: receipt?.hash || tx.hash,
                }
              : item
          )
        );

        setRaceId(null);

        return {
          hash: receipt?.hash || tx.hash,
          explorerUrl: VOYAGER_TX(receipt?.hash || tx.hash),
        };
      } catch (err: any) {
        const message = err?.shortMessage || err?.reason || err?.message || "Transaction failed";
        setTxLog((prev) =>
          prev.map((item) =>
            item.id === txId
              ? {
                  ...item,
                  status: "error",
                  error: message,
                }
              : item
          )
        );
        return null;
      } finally {
        setIsFinishing(false);
      }
    },
    [contract, raceId]
  );

  const clearLog = useCallback(() => {
    setTxLog([]);
  }, []);

  const pendingCount = txLog.filter((t) => t.status === "pending").length;
  const successCount = txLog.filter((t) => t.status === "success").length;

  return {
    startRace,
    recordWord,
    finishRace,
    txLog,
    clearLog,
    isStarting,
    isFinishing,
    rewardResult: null,
    pendingCount,
    successCount,
    isReady: !!signer,
    activeRaceId: raceId,
    maxConcurrentTxs: GAME_CONFIG.MAX_CONCURRENT_TXS,
  };
}

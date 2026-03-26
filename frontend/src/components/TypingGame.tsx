"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type JsonRpcSigner } from "ethers";
import ChallengeText from "./ChallengeText";
import TransactionLog from "./TransactionLog";
import RaceResults from "./RaceResults";
import Leaderboard from "./Leaderboard";
import WalletStatus from "./WalletStatus";
import { useTypingContract } from "@/hooks/use-typing-contract";
import { useSomniaWallet } from "@/hooks/use-somnia-wallet";
import { generateChallenge, type GeneratedChallenge } from "@/lib/challenges";
import { GAME_CONFIG, SOMNIA_CONFIG } from "@/lib/constants";

type GameState = "idle" | "countdown" | "racing" | "finished";

export default function TypingGame() {
  const {
    hasMetaMask,
    account,
    isConnecting,
    isCorrectNetwork,
    error: walletError,
    connect,
    disconnect,
    getSigner,
  } = useSomniaWallet();

  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    if (account) {
      getSigner().then(setSigner);
    } else {
      setSigner(null);
    }
  }, [account, getSigner]);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [challenge, setChallenge] = useState<GeneratedChallenge | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState(0);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [finishResult, setFinishResult] = useState<{
    hash: string;
    explorerUrl: string;
  } | null>(null);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [completedWords, setCompletedWords] = useState(0);
  const [wordResults, setWordResults] = useState<Array<"correct" | "incorrect" | "pending">>([]);
  const [timeRemaining, setTimeRemaining] = useState(GAME_CONFIG.RACE_DURATION_SECONDS);
  const [wpmHistory, setWpmHistory] = useState<Array<{ time: number; wpm: number }>>([]);
  const [finalElapsed, setFinalElapsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const gameStateRef = useRef<GameState>("idle");
  const completedWordsRef = useRef(0);
  const currentWordIndexRef = useRef(0);
  const wordResultsRef = useRef<Array<"correct" | "incorrect" | "pending">>([]);
  const startTimeRef = useRef(0);
  const currentInputRef = useRef("");
  const challengeRef = useRef<GeneratedChallenge | null>(null);

  const {
    startRace,
    recordWord,
    finishRace,
    txLog,
    clearLog,
    isStarting,
    isFinishing,
    successCount,
    pendingCount,
    isReady,
  } = useTypingContract({ signer });

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    completedWordsRef.current = completedWords;
  }, [completedWords]);
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);
  useEffect(() => {
    wordResultsRef.current = wordResults;
  }, [wordResults]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    if (gameState !== "countdown") return;

    if (countdown <= 0) {
      setGameState("racing");
      setStartTime(Date.now());
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  useEffect(() => {
    if (gameState !== "racing") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          doFinishRace();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "racing") return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed <= 0) return;
      const minutes = elapsed / 60000;
      setCurrentWpm(Math.round(completedWordsRef.current / minutes) || 0);
    }, 500);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "racing") return;

    const interval = setInterval(() => {
      if (gameStateRef.current !== "racing") return;
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed <= 0) return;
      const minutes = elapsed / 60000;
      const wpm = Math.round(completedWordsRef.current / minutes) || 0;
      setWpmHistory((prev) => [...prev, { time: Math.round(elapsed / 1000), wpm }]);
    }, GAME_CONFIG.WPM_SAMPLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [gameState]);

  const doFinishRace = useCallback(async () => {
    if (gameStateRef.current === "finished") return;
    setGameState("finished");

    const rawElapsed = Date.now() - startTimeRef.current;
    const elapsed = Math.min(rawElapsed, GAME_CONFIG.RACE_DURATION_SECONDS * 1000);
    setFinalElapsed(elapsed);

    const minutes = elapsed / 60000;
    const finalWpm = Math.round(completedWordsRef.current / minutes) || 0;
    setCurrentWpm(finalWpm);

    setWpmHistory((prev) => [...prev, { time: Math.round(elapsed / 1000), wpm: finalWpm }]);

    const idx = currentWordIndexRef.current;
    const finalAccuracy = idx > 0 ? Math.round((completedWordsRef.current / idx) * 100) : 100;

    const result = await finishRace(completedWordsRef.current, idx, finalWpm, finalAccuracy);
    if (result) {
      setFinishResult(result);
    }
  }, [finishRace]);

  const handleStartRace = useCallback(async () => {
    if (!account || !isCorrectNetwork) return;

    const ch = generateChallenge();
    setChallenge(ch);
    challengeRef.current = ch;

    setCurrentWordIndex(0);
    currentWordIndexRef.current = 0;
    setCurrentInput("");
    currentInputRef.current = "";
    setCompletedWords(0);
    completedWordsRef.current = 0;
    setWordResults(ch.words.map(() => "pending" as const));
    setTimeRemaining(GAME_CONFIG.RACE_DURATION_SECONDS);
    setWpmHistory([]);
    clearLog();
    setFinishResult(null);
    setCurrentWpm(0);
    setFinalElapsed(0);
    setCountdown(GAME_CONFIG.COUNTDOWN_SECONDS);
    setGameState("countdown");

    await startRace();
  }, [account, clearLog, isCorrectNetwork, startRace]);

  const recordWordRef = useRef(recordWord);
  useEffect(() => {
    recordWordRef.current = recordWord;
  }, [recordWord]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameStateRef.current !== "racing" || !challengeRef.current) return;

    if (["Shift", "Control", "Alt", "Meta", "Tab", "Escape", "CapsLock"].includes(e.key)) {
      return;
    }

    e.preventDefault();

    if (e.key === "Backspace") {
      currentInputRef.current = currentInputRef.current.slice(0, -1);
      setCurrentInput(currentInputRef.current);
      return;
    }

    if (e.key === " ") {
      if (currentInputRef.current.length === 0) return;

      const idx = currentWordIndexRef.current;
      const ch = challengeRef.current;
      const expectedWord = ch.words[idx];
      const isWordCorrect = currentInputRef.current === expectedWord;

      const nextIdx = idx + 1;
      currentWordIndexRef.current = nextIdx;
      currentInputRef.current = "";

      setWordResults((prev) => {
        const next = [...prev];
        next[idx] = isWordCorrect ? "correct" : "incorrect";
        return next;
      });

      if (isWordCorrect) {
        completedWordsRef.current++;
        setCompletedWords(completedWordsRef.current);
        recordWordRef.current(completedWordsRef.current);
      }

      setCurrentWordIndex(nextIdx);
      setCurrentInput("");
      return;
    }

    if (e.key.length !== 1) return;

    currentInputRef.current += e.key;
    setCurrentInput(currentInputRef.current);
  }, []);

  const accuracy = currentWordIndex > 0 ? Math.round((completedWords / currentWordIndex) * 100) : 100;
  const elapsed = gameState === "finished" ? finalElapsed : startTime ? Date.now() - startTime : 0;

  return (
    <>
      <div className="header">
        <h1 className="site-title">who&apos;s the fastest on ct</h1>
        <div className="subtitle">Somnia leaderboard typing challenge</div>
      </div>

      <WalletStatus
        walletAddress={account}
        hasMetaMask={hasMetaMask}
        isConnecting={isConnecting}
        isCorrectNetwork={!!isCorrectNetwork}
        error={walletError}
        onConnect={connect}
        onDisconnect={disconnect}
        onSwitchNetwork={getSigner}
      />

      {!isCorrectNetwork && account && (
        <div style={{ marginBottom: 16, color: "#ffaa00", fontSize: "0.8rem" }}>
          Switch your wallet to {SOMNIA_CONFIG.chainName} before starting a race.
        </div>
      )}

      <div className="game-area">
        <div className="game-main">
          {gameState === "idle" && (
            <div className="idle-screen">
              <h2>Ready to Race?</h2>
              <p>
                Type as fast as you can for 30 seconds. When the race ends, your score is submitted on-chain to a
                Solidity contract on Somnia.
              </p>

              <button
                className="btn btn-large"
                onClick={handleStartRace}
                disabled={isStarting || !isReady || !account || !isCorrectNetwork}
              >
                {isStarting ? "Starting Race..." : "Start Race"}
              </button>

              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="btn btn-secondary" onClick={() => setShowLeaderboard(true)}>
                  View Leaderboard
                </button>
              </div>
            </div>
          )}

          {gameState === "countdown" && (
            <div className="countdown">
              <div className="countdown-number" key={countdown}>
                {countdown > 0 ? countdown : "GO!"}
              </div>
            </div>
          )}

          {gameState === "racing" && challenge && (
            <>
              <div className="stats-bar">
                <div className="stat">
                  <div className="stat-label">Time</div>
                  <div className={`stat-value highlight ${timeRemaining <= 5 ? "timer-critical" : ""}`}>
                    {timeRemaining}s
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">WPM</div>
                  <div className="stat-value highlight">{currentWpm}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Words</div>
                  <div className="stat-value">{completedWords}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Recorded TX</div>
                  <div className="stat-value" style={{ color: "var(--text-secondary)" }}>
                    {successCount}
                  </div>
                </div>
              </div>

              <ChallengeText
                words={challenge.words}
                wordResults={wordResults}
                currentWordIndex={currentWordIndex}
                currentInput={currentInput}
              />

              <input
                ref={inputRef}
                className="hidden-input"
                onKeyDown={handleKeyDown}
                autoFocus
                aria-label="Type here"
              />
            </>
          )}

          {gameState === "finished" && challenge && (
            <RaceResults
              wpm={currentWpm}
              accuracy={accuracy}
              totalWords={currentWordIndex}
              correctWords={completedWords}
              txSuccess={successCount}
              txTotal={txLog.length}
              finishTxHash={finishResult?.hash}
              finishExplorerUrl={finishResult?.explorerUrl}
              isNewBest={false}
              elapsedMs={elapsed}
              wpmHistory={wpmHistory}
              racesRemaining={999}
              scorePerWord={GAME_CONFIG.SCORE_PER_WORD}
              onRaceAgain={() => {
                setGameState("idle");
                setCurrentInput("");
                setCurrentWordIndex(0);
                setCompletedWords(0);
              }}
              onViewLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
        </div>

        <TransactionLog txLog={txLog} pendingCount={pendingCount} successCount={successCount} />
      </div>

      <div className="footer">
        Powered by MetaMask + ethers.js | Deployed on Somnia | Solidity contract via Hardhat
      </div>

      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}

      {isFinishing && (
        <div style={{ marginTop: 12, color: "var(--text-secondary)", textAlign: "center" }}>
          Submitting final score to Somnia...
        </div>
      )}
    </>
  );
}

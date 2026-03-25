export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "somnia-testnet";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://rpc.testnet.somnia.network";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_SOMNIA_EXPLORER_URL || "https://shannon-explorer.somnia.network";

const configuredChainId = Number(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || 50312);

export const SOMNIA_CONFIG = {
  chainId: configuredChainId,
  chainIdHex: `0x${configuredChainId.toString(16)}`,
  chainName: process.env.NEXT_PUBLIC_SOMNIA_CHAIN_NAME || "Somnia Testnet",
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [EXPLORER_URL],
  nativeCurrency: {
    name: process.env.NEXT_PUBLIC_SOMNIA_TOKEN_NAME || "Somnia",
    symbol: process.env.NEXT_PUBLIC_SOMNIA_TOKEN_SYMBOL || "SOM",
    decimals: 18,
  },
};

// Kept for compatibility with existing components.
export const VOYAGER_TX = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const VOYAGER_CONTRACT = (addr: string) => `${EXPLORER_URL}/address/${addr}`;

export const GAME_CONFIG = {
  MAX_CONCURRENT_TXS: 1,
  TX_TIMEOUT_MS: 30_000,
  COUNTDOWN_SECONDS: 3,
  RACE_DURATION_SECONDS: 30,
  WPM_SAMPLE_INTERVAL_MS: 2_000,
  MAX_RACES_PER_USER: 999,
  SCORE_PER_WORD: 0.1,
};

export const STORAGE_KEYS = {
  walletAddress: "typeracer_wallet_address",
  chainId: "typeracer_chain_id",
};

"use client";

import { SOMNIA_CONFIG, VOYAGER_CONTRACT } from "@/lib/constants";

interface WalletStatusProps {
  walletAddress: string | null;
  hasMetaMask: boolean;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  error?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

function truncate(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

export default function WalletStatus({
  walletAddress,
  hasMetaMask,
  isConnecting,
  isCorrectNetwork,
  error,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: WalletStatusProps) {
  return (
    <div className="wallet-bar">
      <div className="wallet-info" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        {!hasMetaMask && (
          <span style={{ color: "var(--text-error)" }}>
            MetaMask not detected. Install MetaMask to continue.
          </span>
        )}

        {walletAddress ? (
          <>
            <span style={{ color: isCorrectNetwork ? "var(--text-primary)" : "#ffaa00" }}>
              {isCorrectNetwork ? "[CONNECTED: SOMNIA]" : "[WRONG NETWORK]"}
            </span>
            <a
              href={VOYAGER_CONTRACT(walletAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-address"
              title={walletAddress}
            >
              {truncate(walletAddress)}
            </a>
            {!isCorrectNetwork && (
              <button className="btn btn-secondary" onClick={onSwitchNetwork}>
                Switch to {SOMNIA_CONFIG.chainName}
              </button>
            )}
          </>
        ) : (
          <span style={{ color: "var(--text-dim)" }}>[NOT CONNECTED]</span>
        )}

        {error && <span style={{ color: "var(--text-error)" }}>{error}</span>}
      </div>

      <div>
        {walletAddress ? (
          <button className="btn btn-secondary" onClick={onDisconnect}>
            Disconnect
          </button>
        ) : (
          <button className="btn" onClick={onConnect} disabled={isConnecting || !hasMetaMask}>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </div>
  );
}

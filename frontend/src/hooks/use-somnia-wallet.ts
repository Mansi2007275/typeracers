"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { SOMNIA_CONFIG } from "@/lib/constants";

type EthereumProvider = {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, cb: (...args: any[]) => void) => void;
  removeListener?: (event: string, cb: (...args: any[]) => void) => void;
};

function getEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum as EthereumProvider | undefined;
  return eth || null;
}

export function useSomniaWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainIdHex, setChainIdHex] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ethereum = useMemo(() => getEthereum(), []);
  const hasMetaMask = !!ethereum?.isMetaMask;
  const isCorrectNetwork = chainIdHex?.toLowerCase() === SOMNIA_CONFIG.chainIdHex.toLowerCase();

  const ensureSomniaNetwork = useCallback(async (): Promise<boolean> => {
    if (!ethereum) return false;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SOMNIA_CONFIG.chainIdHex }],
      });
      return true;
    } catch (switchErr: any) {
      if (switchErr?.code !== 4902) {
        throw switchErr;
      }

      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SOMNIA_CONFIG.chainIdHex,
            chainName: SOMNIA_CONFIG.chainName,
            rpcUrls: SOMNIA_CONFIG.rpcUrls,
            blockExplorerUrls: SOMNIA_CONFIG.blockExplorerUrls,
            nativeCurrency: SOMNIA_CONFIG.nativeCurrency,
          },
        ],
      });
      return true;
    }
  }, [ethereum]);

  const refreshWalletState = useCallback(async () => {
    if (!ethereum) return;

    const [accounts, chainId] = await Promise.all([
      ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
      ethereum.request({ method: "eth_chainId" }) as Promise<string>,
    ]);

    setAccount(accounts[0] || null);
    setChainIdHex(chainId || null);
  }, [ethereum]);

  useEffect(() => {
    if (!ethereum) return;

    refreshWalletState().catch(() => {});

    const onAccountsChanged = (accounts: string[]) => {
      setAccount(accounts[0] || null);
    };

    const onChainChanged = (nextChainId: string) => {
      setChainIdHex(nextChainId);
    };

    ethereum.on?.("accountsChanged", onAccountsChanged);
    ethereum.on?.("chainChanged", onChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, [ethereum, refreshWalletState]);

  const connect = useCallback(async () => {
    if (!ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await ensureSomniaNetwork();
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(accounts[0] || null);
      refreshWalletState();
    } catch (e: any) {
      setError(e.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  }, [ethereum, ensureSomniaNetwork, refreshWalletState]);

  const disconnect = useCallback(() => {
    setAccount(null);
  }, []);

  const getSigner = useCallback(async (): Promise<JsonRpcSigner | null> => {
    if (!account || !ethereum) return null;

    if (!isCorrectNetwork) {
      const switched = await ensureSomniaNetwork();
      if (!switched) {
        setError("Please switch to the Somnia network in MetaMask.");
        return null;
      }
    }

    const provider = new BrowserProvider(ethereum);
    return provider.getSigner(account);
  }, [account, ethereum, isCorrectNetwork, ensureSomniaNetwork]);

  return {
    account,
    hasMetaMask,
    isConnecting,
    isCorrectNetwork,
    error,
    connect,
    disconnect,
    getSigner,
  };
}
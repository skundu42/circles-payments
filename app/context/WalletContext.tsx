'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { BrowserProviderContractRunner } from '@circles-sdk/adapter-ethers';
import { Sdk } from '@circles-sdk/sdk';
import { circlesConfig } from '../lib/circlesConfig';

/* ---------- Network definition ---------- */
const GNOSIS = {
  chainId: '0x64',
  chainName: 'Gnosis Chain',
  nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
  rpcUrls: ['https://rpc.gnosischain.com'],
  blockExplorerUrls: ['https://gnosisscan.io'],
};

const STORAGE_KEY = 'circles-wallet-connected';

/* ---------- Helpers ---------- */
async function ensureGnosis(eth: any) {
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: GNOSIS.chainId }],
    });
  } catch (e: any) {
    if (e.code === 4902 /* chain not added */) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [GNOSIS],
      });
    } else {
      throw e;
    }
  }
}

/* ---------- Context types ---------- */
type Status = 'idle' | 'connecting' | 'connected' | 'error';

interface WalletCtx {
  /** Connected wallet address */
  address?: string;
  /** Circles SDK instance */
  sdk?: Sdk;
  /** Current organisation avatar */
  orgAddr?: string;
  /** Initiates wallet connection */
  connect: () => Promise<void>;
  /** Disconnects / clears state */
  disconnect: () => void;
  /** Convenience alias for disconnect (back-compat) */
  signOut: () => void;
  /** Setter for current org address */
  setOrgAddr: (addr: string | undefined) => void;
  /** Connection status */
  status: Status;
  /** Last connection error (if any) */
  error?: Error;
}

/* ---------- Default context ---------- */
const WalletContext = createContext<WalletCtx>({
  connect: async () => {},
  disconnect: () => {},
  signOut: () => {},
  setOrgAddr: () => {},
  status: 'idle',
});

/* ---------- Hook ---------- */
export function useWallet() {
  return useContext(WalletContext);
}

/* ---------- Provider ---------- */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>();
  const [sdk, setSdk] = useState<Sdk>();
  const [orgAddr, setOrgAddr] = useState<string>();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error>();

  /* ---- Internal reset ---- */
  const clearState = () => {
    setAddress(undefined);
    setSdk(undefined);
    setOrgAddr(undefined);
    localStorage.removeItem(STORAGE_KEY);
  };

  /* ---- Robust disconnect ---- */
  const disconnect = useCallback(() => {
    clearState();
    setStatus('idle');
  }, []);

  /* ---- Connect logic ---- */
  const connect = useCallback(async () => {
    // Guard against double-calls
    if (status === 'connecting' || status === 'connected') return;
    setStatus('connecting');
    setError(undefined);

    try {
      const eth = (window as any).ethereum;
      if (!eth?.request) throw new Error('No Ethereum provider found. Please install MetaMask.');

      const [addr]: string[] = await eth.request({ method: 'eth_requestAccounts' });
      if (!addr) throw new Error('Wallet connection rejected.');

      await ensureGnosis(eth);

      const adapter = new BrowserProviderContractRunner();
      await adapter.init();
      const circlesSdk = new Sdk(adapter, circlesConfig);

      setAddress(addr);
      setSdk(circlesSdk);
      setStatus('connected');
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (err: any) {
      console.error('Wallet connect failed:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
      clearState();
      throw err; // so caller can handle if needed
    }
  }, [status]);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth?.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0 || accounts[0] !== address) disconnect();
    };

    const handleChainChanged = (chainId: string) => {
      if (chainId !== GNOSIS.chainId) disconnect();
    };

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);
    eth.on('disconnect', disconnect);

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
      eth.removeListener('disconnect', disconnect);
    };
  }, [address, disconnect]);

  /* ---- Try eager reconnect on page load ---- */
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      connect().catch(() => {/* fail silently; user can retry */});
    }
  }, [connect]);

  return (
    <WalletContext.Provider
      value={{
        address,
        sdk,
        orgAddr,
        setOrgAddr,
        connect,
        disconnect,
        signOut: disconnect, // alias
        status,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
'use client';

import React, {
  createContext,
  useCallback,
  useState,
  ReactNode,
  useContext,
} from 'react';
import { BrowserProviderContractRunner } from '@circles-sdk/adapter-ethers';
import { Sdk } from '@circles-sdk/sdk';
import { circlesConfig } from '../lib/circlesConfig';

const GNOSIS_PARAMS = {
  chainId: '0x64',
  chainName: 'Gnosis Chain',
  nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
  rpcUrls: ['https://rpc.gnosischain.com'],
  blockExplorerUrls: ['https://gnosisscan.io'],
};

async function ensureGnosis(eth: any) {
  await eth
    .request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: GNOSIS_PARAMS.chainId }],
    })
    .catch(async (e: any) => {
      if (e.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [GNOSIS_PARAMS],
        });
      } else throw e;
    });
}

interface WalletContextType {
  address?: string;
  sdk?: Sdk;
  orgAddr?: string;
  connect: () => Promise<void>;
  setOrgAddr: (addr: string) => void;
}

const WalletContext = createContext<WalletContextType>({
  address: undefined,
  sdk: undefined,
  orgAddr: undefined,
  connect: async () => {},
  setOrgAddr: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>();
  const [sdk, setSdk] = useState<Sdk>();
  const [orgAddr, setOrgAddr] = useState<string>();

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth?.isMetaMask) {
      throw new Error('MetaMask not found');
    }
    const [addr] = await eth.request({ method: 'eth_requestAccounts' });
    await ensureGnosis(eth);

    const adapter = new BrowserProviderContractRunner();
    await adapter.init();
    const _sdk = new Sdk(adapter, circlesConfig);

    setAddress(addr);
    setSdk(_sdk);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, sdk, orgAddr, connect, setOrgAddr }}
    >
      {children}
    </WalletContext.Provider>
  );
}
'use client';

import { BrowserProvider } from 'ethers';
import type { Signer } from 'ethers';
import { useCallback, useEffect, useState } from 'react';

const GNOSIS = {
  chainIdHex: '0x64',
  params: {
    chainId: '0x64',
    chainName: 'Gnosis Chain',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    rpcUrls: ['https://rpc.gnosischain.com/'],
    blockExplorerUrls: ['https://gnosisscan.io']
  }
};

export function useMetaMask() {
  const [address, setAddress]   = useState<string>();
  const [chainId, setChainId]   = useState<number>();
  const [signer,  setSigner]    = useState<Signer>();
  const [error,   setError]     = useState<string>();

  const connect = useCallback(async () => {
    const { ethereum } = window as any;
    if (!ethereum?.isMetaMask) {
      setError('MetaMask not installed');
      return;
    }
    try {
      const [acc] = await ethereum.request({ method: 'eth_requestAccounts' });

      /* Ensure user is on Gnosis Chain (id 100) */
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GNOSIS.chainIdHex }]
      }).catch(async (e: any) => {
        if (e.code === 4902) {
          await ethereum.request({ method: 'wallet_addEthereumChain', params: [GNOSIS.params] });
        } else { throw e; }
      });

      const provider = new BrowserProvider(ethereum);
      const localSigner = await provider.getSigner();                          // ethers v6 pattern [oai_citation:0‡docs.ethers.org](https://docs.ethers.org/v5/api/signer/?utm_source=chatgpt.com)
      const net = await provider.getNetwork();

      setAddress(acc);
      setChainId(Number(net.chainId));
      setSigner(localSigner);
      setError(undefined);
    } catch (e: any) {
      setError(e.message ?? 'Failed to connect');
    }
  }, []);

  /* hot-reload on account / chain changes */
  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum?.isMetaMask) return;
    ethereum.on('accountsChanged', (accs: string[]) => setAddress(accs[0]));
    ethereum.on('chainChanged', () => window.location.reload());
  }, []);

  return { address, chainId, signer, connect, error };
}
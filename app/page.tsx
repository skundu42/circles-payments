'use client';

import { useState } from 'react';
import { BrowserProviderContractRunner } from '@circles-sdk/adapter-ethers';
import { Sdk } from '@circles-sdk/sdk';
import { circlesConfig } from './lib/circlesConfig';
import { QRCodeSVG } from 'qrcode.react';                        // QR component  [oai_citation:7‡npmjs.com](https://www.npmjs.com/package/qrcode.react?utm_source=chatgpt.com)

/* ---------- MetaMask / Gnosis helpers ---------- */
const GNOSIS: any = {
  chainId: '0x64',                                              // 100 dec → 0x64  [oai_citation:8‡support.metamask.io](https://support.metamask.io/more-web3/learn/how-to-connect-to-the-gnosis-chain-network-formerly-xdai/?utm_source=chatgpt.com)
  chainName: 'Gnosis Chain',
  nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
  rpcUrls: ['https://rpc.gnosischain.com'],                     // public RPC  [oai_citation:9‡docs.gnosischain.com](https://docs.gnosischain.com/tools/RPC%20Providers/?utm_source=chatgpt.com)
  blockExplorerUrls: ['https://gnosisscan.io']
};

async function ensureGnosis(eth: any) {
  await eth.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: GNOSIS.chainId }]
  }).catch(async (e: any) => {
    if (e.code === 4902) {
      await eth.request({ method: 'wallet_addEthereumChain', params: [GNOSIS] }); // MetaMask add-network flow  [oai_citation:10‡docs.gnosischain.com](https://docs.gnosischain.com/developers/Interact%20on%20Gnosis/metamask?utm_source=chatgpt.com)
    } else { throw e; }
  });
}

/* ---------- React page ---------- */
export default function CirclesOrg() {
  const [address, setAddress] = useState<string>();
  const [orgAddr, setOrgAddr] = useState<string>();
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState<string>();

  /* connects wallet and stores an SDK instance on window for reuse */
  const connect = async () => {
    try {
      setErr(undefined);
      const eth = (window as any).ethereum;
      if (!eth?.isMetaMask) throw new Error('MetaMask not found');
      const [addr] = await eth.request({ method: 'eth_requestAccounts' });
      await ensureGnosis(eth);

      /* Adapter ➜ init ➜ SDK  (correct order!) */
      const adapter = new BrowserProviderContractRunner();        // class from adapter-ethers  [oai_citation:11‡docs.aboutcircles.com](https://docs.aboutcircles.com/tutorials-and-examples/setting-up-circles-sdk-with-react-and-javascript?utm_source=chatgpt.com)
      await adapter.init();                                       // MUST call or runner error 
      (window as any)._sdk = new Sdk(adapter, circlesConfig);      // stable API  [oai_citation:12‡docs.aboutcircles.com](https://docs.aboutcircles.com/tutorials-and-examples/setting-up-circles-sdk-with-react-and-javascript?utm_source=chatgpt.com)
      setAddress(addr);
    } catch (e: any) { setErr(e.message ?? String(e)); }
  };

  const createOrg = async (name: string) => {
    const sdk: Sdk | undefined = (window as any)._sdk;
    if (!sdk) return;
    try {
      setBusy(true); setErr(undefined);
      /* Pass a Profile object ➜ no CID validation needed */
      const avatar = await sdk.registerOrganizationV2({ name });   // documented overload  [oai_citation:13‡docs.aboutcircles.com](https://docs.aboutcircles.com/developer-docs/circles-avatars/organization-avatars/creation-of-organizations?utm_source=chatgpt.com)
      setOrgAddr(avatar.address);
    } catch (e: any) { setErr(e.message ?? 'Transaction failed'); }
    finally { setBusy(false); }
  };

  return (
    <main className="flex flex-col items-center gap-6 py-12 px-4
                     bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen">
      <h1 className="text-3xl font-extrabold text-sky-600">Circles V2 Org Creator</h1>

      {!address ? (
        <button
          onClick={connect}
          className="px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-400
                     text-white rounded-md shadow font-semibold">
          Connect MetaMask
        </button>
      ) : (
        <OrgWizard busy={busy} onCreate={createOrg} />
      )}

      {orgAddr && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-emerald-700 font-semibold">
            ✅ Avatar deployed at {orgAddr.slice(0,6)}…{orgAddr.slice(-4)}
          </p>
          <QRCodeSVG value={orgAddr} size={164} className="rounded-md shadow" />
        </div>
      )}

      {err && <p className="text-red-600 text-center">{err}</p>}
    </main>
  );
}

/* ----- inner form component ----- */
function OrgWizard({ busy, onCreate }:{ busy:boolean; onCreate:(n:string)=>void }) {
  const [name,setName] = useState('');
  return (
    <>
      <input
        value={name}
        onChange={e=>setName(e.target.value)}
        placeholder="Organisation name"
        className="w-72 border rounded p-2 text-center"
      />
      <button
        disabled={!name || busy}
        onClick={()=>onCreate(name)}
        className="px-6 py-3 mt-2 bg-gradient-to-r from-sky-600 to-emerald-400
                   text-white rounded-md shadow font-semibold disabled:opacity-50">
        {busy ? 'Creating…' : 'Register Org (V2)'}
      </button>
    </>
  );
}
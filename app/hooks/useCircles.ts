'use client';

import { useMemo } from 'react';
import type { Signer } from 'ethers';
import { Sdk } from '@circles-sdk/sdk';
import { circlesConfig } from '../lib/circlesConfig';

/** Returns an SDK instance whenever the signer changes */
export function useCircles(signer?: Signer) {
  return useMemo(() => (signer ? new Sdk(circlesConfig, signer) : undefined), [signer]);
}
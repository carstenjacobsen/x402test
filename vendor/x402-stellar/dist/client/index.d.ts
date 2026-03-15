import { K as KeypairClientConfig } from '../types-DC2l_1PN.js';
import '@stellar/stellar-sdk';

/**
 * Create a fetch-compatible function that automatically pays x402 challenges
 * on Stellar using a Keypair.
 *
 * Supports XLM and USDC payments. Designed for AI agents and server-to-server
 * use cases where you control the signing key.
 *
 * @example
 * ```ts
 * import { x402Fetch } from 'x402-stellar';
 * import { Keypair } from '@stellar/stellar-sdk';
 *
 * const fetch = x402Fetch({
 *   keypair: Keypair.fromSecret('SXXXXX...'),
 *   network: 'testnet',
 * });
 *
 * const res = await fetch('https://api.example.com/premium');
 * const data = await res.json();
 * ```
 */
declare function x402Fetch(config: KeypairClientConfig): typeof fetch;

export { x402Fetch };

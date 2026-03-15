export { X402RouteConfig, createX402Middleware, withX402 } from './server/index.js';
import { X as X402StellarConfig, S as StellarPaymentRequired, a as StellarPaymentRequirements, b as StellarPaymentPayload, F as FreighterClientConfig, c as StellarNetworkAlias, d as FacilitatorSettleResponse, e as FacilitatorVerifyResponse, f as StellarAsset } from './types-DC2l_1PN.js';
export { B as BuildTransactionOptions, g as FacilitatorSettleRequest, h as FacilitatorVerifyRequest, K as KeypairClientConfig, i as StellarNetwork, j as StellarPaymentResponse } from './types-DC2l_1PN.js';
export { x402Fetch } from './client/index.js';
import '@stellar/stellar-sdk';

/**
 * Build the PaymentRequired object that is base64-encoded into the
 * `PAYMENT-REQUIRED` response header on a 402.
 */
declare function buildPaymentRequired(config: X402StellarConfig, resourceUrl: string): StellarPaymentRequired;
/**
 * Build a single StellarPaymentRequirements entry from a route config.
 */
declare function buildPaymentRequirements(config: X402StellarConfig, resourceUrl: string): StellarPaymentRequirements;

/**
 * Extract and decode the X-PAYMENT header from a Request.
 * Returns null if the header is missing or malformed.
 */
declare function parsePaymentHeader(request: Request): StellarPaymentPayload | null;
interface ValidationResult {
    isValid: boolean;
    reason?: string;
}
/**
 * Perform lightweight structural validation of a payment payload before
 * sending it to the facilitator. Catches obvious malformed payloads early.
 */
declare function validatePaymentPayload(payload: StellarPaymentPayload, requirements: StellarPaymentRequirements): ValidationResult;

/**
 * Create a fetch-compatible function that automatically pays x402 challenges
 * on Stellar using the Freighter browser extension.
 *
 * Call this in browser environments (Next.js client components, React apps).
 * Requires `@stellar/freighter-api` to be installed.
 *
 * @example
 * ```ts
 * import { x402FreighterFetch } from 'x402-stellar';
 *
 * const fetch = x402FreighterFetch({ network: 'testnet' });
 *
 * const res = await fetch('https://api.example.com/premium');
 * const data = await res.json();
 * ```
 */
declare function x402FreighterFetch(config: FreighterClientConfig): typeof fetch;

/**
 * Verify a payment payload against requirements via the facilitator.
 * Does NOT submit the transaction on-chain.
 */
declare function verifyPayment(facilitatorUrl: string, payload: StellarPaymentPayload, requirements: StellarPaymentRequirements): Promise<FacilitatorVerifyResponse>;
/**
 * Settle a payment via the facilitator.
 * Verifies the payload and submits the transaction on-chain.
 */
declare function settlePayment(facilitatorUrl: string, payload: StellarPaymentPayload, requirements: StellarPaymentRequirements): Promise<FacilitatorSettleResponse>;
/**
 * Returns the default OpenZeppelin facilitator URL for the given network.
 */
declare function getDefaultFacilitatorUrl(network: StellarNetworkAlias): string;

/**
 * Convert a human-readable amount string to base units (integer string).
 *
 * @example toBaseUnits("0.01", "USDC") // "100000"  (7 decimals)
 * @example toBaseUnits("1", "XLM")     // "10000000" (7 decimals = stroops)
 */
declare function toBaseUnits(amount: string, asset: StellarAsset): string;
/**
 * Convert base units (integer string) back to a human-readable amount.
 *
 * @example fromBaseUnits("100000", "USDC") // "0.0100000"
 * @example fromBaseUnits("10000000", "XLM") // "1.0000000"
 */
declare function fromBaseUnits(baseUnits: string, asset: StellarAsset): string;
/** Encode an object to a base64 JSON string (for x402 headers). */
declare function encodeHeader(obj: unknown): string;
/** Decode a base64 JSON header value. */
declare function decodeHeader<T>(encoded: string): T;

declare const HORIZON_URLS: Record<StellarNetworkAlias, string>;
declare const SOROBAN_RPC_URLS: Record<StellarNetworkAlias, string>;
declare const NETWORK_PASSPHRASES: Record<StellarNetworkAlias, string>;
declare const CAIP2_NETWORKS: Record<StellarNetworkAlias, "stellar:testnet" | "stellar:pubnet">;
declare const USDC_CONTRACT_IDS: Record<StellarNetworkAlias, string>;
declare const ASSET_METADATA: {
    readonly XLM: {
        readonly name: "Stellar Lumens";
        readonly symbol: "XLM";
        readonly decimals: 7;
        /** on-chain identifier for XLM */
        readonly contractId: "native";
    };
    readonly USDC: {
        readonly name: "USD Coin";
        readonly symbol: "USDC";
        readonly decimals: 7;
    };
};
declare const OPENZEPPELIN_FACILITATOR_URLS: Record<StellarNetworkAlias, string>;
declare const X402_VERSION: 1;
declare const HEADERS: {
    readonly PAYMENT_REQUIRED: "payment-required";
    readonly X_PAYMENT: "x-payment";
    readonly X_PAYMENT_RESPONSE: "x-payment-response";
};

export { ASSET_METADATA, CAIP2_NETWORKS, FacilitatorSettleResponse, FacilitatorVerifyResponse, FreighterClientConfig, HEADERS, HORIZON_URLS, NETWORK_PASSPHRASES, OPENZEPPELIN_FACILITATOR_URLS, SOROBAN_RPC_URLS, StellarAsset, StellarNetworkAlias, StellarPaymentPayload, StellarPaymentRequired, StellarPaymentRequirements, USDC_CONTRACT_IDS, type ValidationResult, X402StellarConfig, X402_VERSION, buildPaymentRequired, buildPaymentRequirements, decodeHeader, encodeHeader, fromBaseUnits, getDefaultFacilitatorUrl, parsePaymentHeader, settlePayment, toBaseUnits, validatePaymentPayload, verifyPayment, x402FreighterFetch };

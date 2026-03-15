import * as _stellar_stellar_sdk from '@stellar/stellar-sdk';

/**
 * x402-stellar — TypeScript types
 *
 * Extends @x402/core with Stellar-specific payment structures.
 */
type StellarNetwork = "stellar:testnet" | "stellar:pubnet";
type StellarNetworkAlias = "testnet" | "mainnet";
type StellarAsset = "XLM" | "USDC";
interface StellarPaymentRequirements {
    scheme: "exact";
    network: StellarNetwork;
    /** On-chain asset identifier: "native" for XLM, contract ID for tokens */
    asset: string;
    /** Amount in base units (stroops for XLM, 7-decimal units for USDC) */
    maxAmountRequired: string;
    /** Recipient Stellar address (G...) */
    payTo: string;
    /** Full resource URL being protected */
    resource: string;
    /** Human-readable description */
    description?: string;
    /** MIME type of the protected resource */
    mimeType?: string;
    /** Seconds the payment authorization is valid for */
    maxTimeoutSeconds: number;
    /** Token metadata */
    extra: {
        name: string;
        decimals: number;
        symbol: string;
    };
}
interface StellarPaymentRequired {
    x402Version: 1;
    accepts: StellarPaymentRequirements[];
    error?: string;
}
interface StellarPaymentPayload {
    x402Version: 1;
    scheme: "exact";
    network: StellarNetwork;
    payload: {
        /** Base64-encoded XDR of a signed Stellar transaction */
        transaction: string;
    };
}
interface FacilitatorVerifyRequest {
    paymentPayload: StellarPaymentPayload;
    paymentRequirements: StellarPaymentRequirements;
}
interface FacilitatorVerifyResponse {
    isValid: boolean;
    invalidReason?: string;
}
interface FacilitatorSettleRequest {
    paymentPayload: StellarPaymentPayload;
    paymentRequirements: StellarPaymentRequirements;
}
interface FacilitatorSettleResponse {
    success: boolean;
    txHash?: string;
    network?: StellarNetwork;
    errorReason?: string;
    error?: string;
}
interface StellarPaymentResponse {
    success: boolean;
    txHash?: string;
    network: StellarNetwork;
    payer?: string;
    errorReason?: string;
}
interface X402StellarConfig {
    /** Human-readable amount, e.g. "0.01" for 0.01 USDC or 0.01 XLM */
    amount: string;
    /** Asset to accept: "XLM" or "USDC" */
    asset: StellarAsset;
    /** Network to use */
    network: StellarNetworkAlias;
    /** Recipient Stellar address (G...) */
    payTo: string;
    /** Human-readable description of the resource */
    description?: string;
    /** MIME type of the resource (default: application/json) */
    mimeType?: string;
    /** Seconds the payment authorization is valid (default: 300) */
    maxTimeoutSeconds?: number;
    /**
     * Facilitator URL for verification and settlement.
     * Defaults to the OpenZeppelin Relayer endpoint for the chosen network.
     */
    facilitatorUrl?: string;
}
interface KeypairClientConfig {
    /** Stellar Keypair for signing transactions */
    keypair: _stellar_stellar_sdk.Keypair;
    /** Network to use */
    network: StellarNetworkAlias;
    /** Override Horizon URL */
    horizonUrl?: string;
}
interface FreighterClientConfig {
    /** Network to use */
    network: StellarNetworkAlias;
    /** Override Horizon URL */
    horizonUrl?: string;
}
interface BuildTransactionOptions {
    sourcePublicKey: string;
    payTo: string;
    asset: StellarAsset;
    /** Amount in base units */
    amountBaseUnits: string;
    network: StellarNetworkAlias;
    /** Defaults to the standard Horizon URL for the network */
    horizonUrl?: string;
    maxTimeoutSeconds: number;
}

export type { BuildTransactionOptions as B, FreighterClientConfig as F, KeypairClientConfig as K, StellarPaymentRequired as S, X402StellarConfig as X, StellarPaymentRequirements as a, StellarPaymentPayload as b, StellarNetworkAlias as c, FacilitatorSettleResponse as d, FacilitatorVerifyResponse as e, StellarAsset as f, FacilitatorSettleRequest as g, FacilitatorVerifyRequest as h, StellarNetwork as i, StellarPaymentResponse as j };

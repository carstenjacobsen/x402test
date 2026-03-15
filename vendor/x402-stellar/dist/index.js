export { buildPaymentRequired, buildPaymentRequirements, createX402Middleware, getDefaultFacilitatorUrl, parsePaymentHeader, settlePayment, validatePaymentPayload, verifyPayment, withX402 } from './chunk-UCVDHDL3.js';
import { buildPaymentTransaction } from './chunk-UFF4NL4O.js';
export { x402Fetch } from './chunk-UFF4NL4O.js';
import { safeDecodeHeader, encodeHeader } from './chunk-WFMBZF52.js';
export { decodeHeader, encodeHeader, fromBaseUnits, toBaseUnits } from './chunk-WFMBZF52.js';
import { HEADERS, X402_VERSION } from './chunk-DEFBSM2Q.js';
export { ASSET_METADATA, CAIP2_NETWORKS, HEADERS, HORIZON_URLS, NETWORK_PASSPHRASES, OPENZEPPELIN_FACILITATOR_URLS, SOROBAN_RPC_URLS, USDC_CONTRACT_IDS, X402_VERSION } from './chunk-DEFBSM2Q.js';

// src/client/freighter.ts
function x402FreighterFetch(config) {
  const { network, horizonUrl } = config;
  return async (input, init) => {
    const request = new Request(input, init);
    const firstResponse = await globalThis.fetch(request.clone());
    if (firstResponse.status !== 402) {
      return firstResponse;
    }
    const paymentRequiredHeader = firstResponse.headers.get(HEADERS.PAYMENT_REQUIRED);
    if (!paymentRequiredHeader) {
      return firstResponse;
    }
    const paymentRequired = safeDecodeHeader(paymentRequiredHeader);
    if (!paymentRequired?.accepts?.length) {
      return firstResponse;
    }
    const requirements = findStellarRequirement(paymentRequired.accepts);
    if (!requirements) {
      throw new Error(
        "x402: No compatible Stellar payment requirement found in 402 response"
      );
    }
    const freighter = await loadFreighter();
    const isConnected = await freighter.isConnected();
    if (!isConnected) {
      throw new Error("x402: Freighter wallet is not connected");
    }
    const { address: publicKey } = await freighter.getAddress();
    if (!publicKey) {
      throw new Error("x402: Could not get public key from Freighter");
    }
    await getNetworkPassphrase(freighter, network);
    const txXdr = await buildPaymentTransaction(
      {
        sourcePublicKey: publicKey,
        payTo: requirements.payTo,
        asset: resolveAsset(requirements.asset),
        amountBaseUnits: requirements.maxAmountRequired,
        network,
        horizonUrl,
        maxTimeoutSeconds: requirements.maxTimeoutSeconds
      },
      async (unsignedXdr, passphrase) => {
        const result = await freighter.signTransaction(unsignedXdr, {
          networkPassphrase: passphrase
        });
        if (result.error) {
          throw new Error(`Freighter signing error: ${result.error}`);
        }
        return result.signedTxXdr;
      }
    );
    const paymentPayload = {
      x402Version: X402_VERSION,
      scheme: "exact",
      network: requirements.network,
      payload: { transaction: txXdr }
    };
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set(HEADERS.X_PAYMENT, encodeHeader(paymentPayload));
    return globalThis.fetch(input, { ...init, headers: retryHeaders });
  };
}
function findStellarRequirement(accepts) {
  return accepts.find(
    (r) => r.scheme === "exact" && r.network.startsWith("stellar:")
  );
}
function resolveAsset(onChainAsset) {
  return onChainAsset === "native" ? "XLM" : "USDC";
}
async function loadFreighter() {
  try {
    const mod = await import('@stellar/freighter-api');
    return mod;
  } catch {
    throw new Error(
      "x402: @stellar/freighter-api is not installed. Run `npm install @stellar/freighter-api` to use Freighter."
    );
  }
}
async function getNetworkPassphrase(freighter, fallback) {
  try {
    const { networkPassphrase } = await freighter.getNetworkDetails();
    return networkPassphrase;
  } catch {
    const { NETWORK_PASSPHRASES: NETWORK_PASSPHRASES2 } = await import('./constants-JKLAET43.js');
    return NETWORK_PASSPHRASES2[fallback];
  }
}

export { x402FreighterFetch };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
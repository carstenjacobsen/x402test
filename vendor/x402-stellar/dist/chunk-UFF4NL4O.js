import { baseUnitsToXlmString, safeDecodeHeader, encodeHeader } from './chunk-WFMBZF52.js';
import { HORIZON_URLS, NETWORK_PASSPHRASES, USDC_CONTRACT_IDS, HEADERS, X402_VERSION } from './chunk-DEFBSM2Q.js';
import { Horizon, TransactionBuilder, BASE_FEE, Operation, Asset, Contract, nativeToScVal } from '@stellar/stellar-sdk';

async function buildPaymentTransaction(opts, sign) {
  const {
    sourcePublicKey,
    payTo,
    asset,
    amountBaseUnits,
    network,
    horizonUrl = HORIZON_URLS[network],
    maxTimeoutSeconds
  } = opts;
  const networkPassphrase = NETWORK_PASSPHRASES[network];
  const server = new Horizon.Server(horizonUrl);
  const account = await server.loadAccount(sourcePublicKey);
  let txBuilder;
  if (asset === "XLM") {
    const xlmAmount = baseUnitsToXlmString(amountBaseUnits);
    txBuilder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase
    }).addOperation(
      Operation.payment({
        destination: payTo,
        asset: Asset.native(),
        amount: xlmAmount
      })
    ).setTimeout(maxTimeoutSeconds);
  } else {
    const contractId = USDC_CONTRACT_IDS[network];
    const contract = new Contract(contractId);
    txBuilder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase
    }).addOperation(
      contract.call(
        "transfer",
        nativeToScVal(sourcePublicKey, { type: "address" }),
        nativeToScVal(payTo, { type: "address" }),
        nativeToScVal(BigInt(amountBaseUnits), { type: "i128" })
      )
    ).setTimeout(maxTimeoutSeconds);
  }
  const tx = txBuilder.build();
  const txXdr = tx.toEnvelope().toXDR("base64");
  return sign(txXdr, networkPassphrase);
}

// src/client/keypair.ts
function x402Fetch(config) {
  const { keypair, network, horizonUrl } = config;
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
    const txXdr = await buildPaymentTransaction(
      {
        sourcePublicKey: keypair.publicKey(),
        payTo: requirements.payTo,
        asset: resolveAsset(requirements.asset, requirements.network),
        amountBaseUnits: requirements.maxAmountRequired,
        network,
        horizonUrl,
        maxTimeoutSeconds: requirements.maxTimeoutSeconds
      },
      async (unsignedXdr, networkPassphrase) => {
        const tx = TransactionBuilder.fromXDR(unsignedXdr, networkPassphrase);
        tx.sign(keypair);
        return tx.toEnvelope().toXDR("base64");
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
function resolveAsset(onChainAsset, _network) {
  return onChainAsset === "native" ? "XLM" : "USDC";
}

export { buildPaymentTransaction, x402Fetch };
//# sourceMappingURL=chunk-UFF4NL4O.js.map
//# sourceMappingURL=chunk-UFF4NL4O.js.map
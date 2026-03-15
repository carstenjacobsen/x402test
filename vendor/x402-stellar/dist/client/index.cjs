'use strict';

var stellarSdk = require('@stellar/stellar-sdk');

// src/client/keypair.ts

// src/constants.ts
var HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org"
};
var NETWORK_PASSPHRASES = {
  testnet: "Test SDF Network ; September 2015",
  mainnet: "Public Global Stellar Network ; September 2015"
};
var USDC_CONTRACT_IDS = {
  // Circle USDC on Stellar testnet
  testnet: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  // Circle USDC on Stellar mainnet
  mainnet: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"
};
var ASSET_METADATA = {
  XLM: {
    name: "Stellar Lumens",
    symbol: "XLM",
    decimals: 7,
    /** on-chain identifier for XLM */
    contractId: "native"
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 7
    // contractId is network-specific — resolved at runtime
  }
};
var X402_VERSION = 1;
var HEADERS = {
  PAYMENT_REQUIRED: "payment-required",
  X_PAYMENT: "x-payment"};

// src/utils.ts
function fromBaseUnits(baseUnits, asset) {
  const decimals = ASSET_METADATA[asset].decimals;
  const factor = BigInt(10 ** decimals);
  const value = BigInt(baseUnits);
  const intPart = value / factor;
  const fracPart = (value % factor).toString().padStart(decimals, "0");
  return `${intPart}.${fracPart}`;
}
function baseUnitsToXlmString(stroops) {
  return fromBaseUnits(stroops, "XLM");
}
function encodeHeader(obj) {
  const json = JSON.stringify(obj);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json).toString("base64");
  }
  return btoa(json);
}
function decodeHeader(encoded) {
  let json;
  if (typeof Buffer !== "undefined") {
    json = Buffer.from(encoded, "base64").toString("utf-8");
  } else {
    json = atob(encoded);
  }
  return JSON.parse(json);
}
function safeDecodeHeader(encoded) {
  try {
    return decodeHeader(encoded);
  } catch {
    return null;
  }
}
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
  const server = new stellarSdk.Horizon.Server(horizonUrl);
  const account = await server.loadAccount(sourcePublicKey);
  let txBuilder;
  if (asset === "XLM") {
    const xlmAmount = baseUnitsToXlmString(amountBaseUnits);
    txBuilder = new stellarSdk.TransactionBuilder(account, {
      fee: stellarSdk.BASE_FEE,
      networkPassphrase
    }).addOperation(
      stellarSdk.Operation.payment({
        destination: payTo,
        asset: stellarSdk.Asset.native(),
        amount: xlmAmount
      })
    ).setTimeout(maxTimeoutSeconds);
  } else {
    const contractId = USDC_CONTRACT_IDS[network];
    const contract = new stellarSdk.Contract(contractId);
    txBuilder = new stellarSdk.TransactionBuilder(account, {
      fee: stellarSdk.BASE_FEE,
      networkPassphrase
    }).addOperation(
      contract.call(
        "transfer",
        stellarSdk.nativeToScVal(sourcePublicKey, { type: "address" }),
        stellarSdk.nativeToScVal(payTo, { type: "address" }),
        stellarSdk.nativeToScVal(BigInt(amountBaseUnits), { type: "i128" })
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
        const tx = stellarSdk.TransactionBuilder.fromXDR(unsignedXdr, networkPassphrase);
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

exports.x402Fetch = x402Fetch;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map
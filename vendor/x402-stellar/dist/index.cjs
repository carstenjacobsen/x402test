'use strict';

var stellarSdk = require('@stellar/stellar-sdk');

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/constants.ts
var constants_exports = {};
__export(constants_exports, {
  ASSET_METADATA: () => exports.ASSET_METADATA,
  CAIP2_NETWORKS: () => exports.CAIP2_NETWORKS,
  HEADERS: () => exports.HEADERS,
  HORIZON_URLS: () => exports.HORIZON_URLS,
  NETWORK_PASSPHRASES: () => exports.NETWORK_PASSPHRASES,
  OPENZEPPELIN_FACILITATOR_URLS: () => exports.OPENZEPPELIN_FACILITATOR_URLS,
  SOROBAN_RPC_URLS: () => exports.SOROBAN_RPC_URLS,
  USDC_CONTRACT_IDS: () => exports.USDC_CONTRACT_IDS,
  X402_VERSION: () => exports.X402_VERSION
});
exports.HORIZON_URLS = void 0; exports.SOROBAN_RPC_URLS = void 0; exports.NETWORK_PASSPHRASES = void 0; exports.CAIP2_NETWORKS = void 0; exports.USDC_CONTRACT_IDS = void 0; exports.ASSET_METADATA = void 0; exports.OPENZEPPELIN_FACILITATOR_URLS = void 0; exports.X402_VERSION = void 0; exports.HEADERS = void 0;
var init_constants = __esm({
  "src/constants.ts"() {
    exports.HORIZON_URLS = {
      testnet: "https://horizon-testnet.stellar.org",
      mainnet: "https://horizon.stellar.org"
    };
    exports.SOROBAN_RPC_URLS = {
      testnet: "https://soroban-testnet.stellar.org",
      mainnet: "https://soroban-mainnet.stellar.org"
    };
    exports.NETWORK_PASSPHRASES = {
      testnet: "Test SDF Network ; September 2015",
      mainnet: "Public Global Stellar Network ; September 2015"
    };
    exports.CAIP2_NETWORKS = {
      testnet: "stellar:testnet",
      mainnet: "stellar:pubnet"
    };
    exports.USDC_CONTRACT_IDS = {
      // Circle USDC on Stellar testnet
      testnet: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
      // Circle USDC on Stellar mainnet
      mainnet: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"
    };
    exports.ASSET_METADATA = {
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
    exports.OPENZEPPELIN_FACILITATOR_URLS = {
      testnet: "https://channels.openzeppelin.com/x402/testnet",
      mainnet: "https://channels.openzeppelin.com/x402"
    };
    exports.X402_VERSION = 1;
    exports.HEADERS = {
      PAYMENT_REQUIRED: "payment-required",
      X_PAYMENT: "x-payment",
      X_PAYMENT_RESPONSE: "x-payment-response"
    };
  }
});

// src/facilitator.ts
init_constants();
async function verifyPayment(facilitatorUrl, payload, requirements) {
  const res = await fetch(`${facilitatorUrl}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentPayload: payload,
      paymentRequirements: requirements
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { isValid: false, invalidReason: `Facilitator error ${res.status}: ${text}` };
  }
  return await res.json();
}
async function settlePayment(facilitatorUrl, payload, requirements) {
  const res = await fetch(`${facilitatorUrl}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentPayload: payload,
      paymentRequirements: requirements
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return {
      success: false,
      errorReason: `Facilitator error ${res.status}: ${text}`
    };
  }
  return await res.json();
}
function getDefaultFacilitatorUrl(network) {
  return exports.OPENZEPPELIN_FACILITATOR_URLS[network];
}

// src/server/next.ts
init_constants();

// src/utils.ts
init_constants();
function toBaseUnits(amount, asset) {
  const decimals = exports.ASSET_METADATA[asset].decimals;
  const factor = BigInt(10 ** decimals);
  const [intPart, fracPart = ""] = amount.split(".");
  const paddedFrac = fracPart.padEnd(decimals, "0").slice(0, decimals);
  const baseUnits = BigInt(intPart) * factor + BigInt(paddedFrac || "0");
  return baseUnits.toString();
}
function fromBaseUnits(baseUnits, asset) {
  const decimals = exports.ASSET_METADATA[asset].decimals;
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

// src/server/payment-required.ts
init_constants();
function buildPaymentRequired(config, resourceUrl) {
  const requirements = buildPaymentRequirements(config, resourceUrl);
  return {
    x402Version: exports.X402_VERSION,
    accepts: [requirements]
  };
}
function buildPaymentRequirements(config, resourceUrl) {
  const {
    asset,
    amount,
    network,
    payTo,
    description,
    mimeType = "application/json",
    maxTimeoutSeconds = 300
  } = config;
  const caip2Network = exports.CAIP2_NETWORKS[network];
  const assetMeta = exports.ASSET_METADATA[asset];
  const maxAmountRequired = toBaseUnits(amount, asset);
  const onChainAsset = asset === "XLM" ? "native" : exports.USDC_CONTRACT_IDS[network];
  return {
    scheme: "exact",
    network: caip2Network,
    asset: onChainAsset,
    maxAmountRequired,
    payTo,
    resource: resourceUrl,
    description,
    mimeType,
    maxTimeoutSeconds,
    extra: {
      name: assetMeta.name,
      symbol: assetMeta.symbol,
      decimals: assetMeta.decimals
    }
  };
}

// src/server/verify.ts
init_constants();
function parsePaymentHeader(request) {
  const header = request.headers.get(exports.HEADERS.X_PAYMENT);
  if (!header) return null;
  return safeDecodeHeader(header);
}
function validatePaymentPayload(payload, requirements) {
  if (payload.x402Version !== 1) {
    return { isValid: false, reason: "Unsupported x402Version" };
  }
  if (payload.scheme !== "exact") {
    return { isValid: false, reason: `Unsupported scheme: ${payload.scheme}` };
  }
  if (payload.network !== requirements.network) {
    return {
      isValid: false,
      reason: `Network mismatch: expected ${requirements.network}, got ${payload.network}`
    };
  }
  if (!payload.payload?.transaction || typeof payload.payload.transaction !== "string") {
    return { isValid: false, reason: "Missing or invalid transaction XDR" };
  }
  return { isValid: true };
}

// src/server/next.ts
function withX402(handler, config) {
  return async (request, context) => {
    const resourceUrl = request.url;
    const facilitatorUrl = config.facilitatorUrl ?? getDefaultFacilitatorUrl(config.network);
    const requirements = buildPaymentRequirements(config, resourceUrl);
    const paymentPayload = parsePaymentHeader(request);
    if (!paymentPayload) {
      return payment402Response(config, resourceUrl);
    }
    const structuralCheck = validatePaymentPayload(paymentPayload, requirements);
    if (!structuralCheck.isValid) {
      return payment402Response(config, resourceUrl, structuralCheck.reason);
    }
    const verifyResult = await verifyPayment(
      facilitatorUrl,
      paymentPayload,
      requirements
    ).catch((err) => ({
      isValid: false,
      invalidReason: `Facilitator verify failed: ${String(err)}`
    }));
    if (!verifyResult.isValid) {
      return payment402Response(config, resourceUrl, verifyResult.invalidReason);
    }
    const settleResult = await settlePayment(
      facilitatorUrl,
      paymentPayload,
      requirements
    ).catch((err) => ({
      success: false,
      errorReason: `Facilitator settle failed: ${String(err)}`
    }));
    if (!settleResult.success) {
      return new Response(
        JSON.stringify({ error: settleResult.errorReason ?? "Settlement failed" }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            [exports.HEADERS.PAYMENT_REQUIRED]: encodeHeader(
              buildPaymentRequired(config, resourceUrl)
            )
          }
        }
      );
    }
    const handlerResponse = await handler(request, context);
    const paymentResponse = {
      success: true,
      txHash: "txHash" in settleResult ? settleResult.txHash : void 0,
      network: exports.CAIP2_NETWORKS[config.network]
    };
    const responseHeaders = new Headers(handlerResponse.headers);
    responseHeaders.set(
      exports.HEADERS.X_PAYMENT_RESPONSE,
      encodeHeader(paymentResponse)
    );
    return new Response(handlerResponse.body, {
      status: handlerResponse.status,
      statusText: handlerResponse.statusText,
      headers: responseHeaders
    });
  };
}
function createX402Middleware(routes) {
  return async (request) => {
    const url = new URL(request.url);
    const routeConfig = routes.find((r) => matchPath(r.path, url.pathname));
    if (!routeConfig) {
      return new Response(null, { status: 200, headers: { "x-middleware-next": "1" } });
    }
    const resourceUrl = request.url;
    const facilitatorUrl = routeConfig.facilitatorUrl ?? getDefaultFacilitatorUrl(routeConfig.network);
    const requirements = buildPaymentRequirements(routeConfig, resourceUrl);
    const paymentPayload = parsePaymentHeader(request);
    if (!paymentPayload) {
      return payment402Response(routeConfig, resourceUrl);
    }
    const structuralCheck = validatePaymentPayload(paymentPayload, requirements);
    if (!structuralCheck.isValid) {
      return payment402Response(routeConfig, resourceUrl, structuralCheck.reason);
    }
    const verifyResult = await verifyPayment(
      facilitatorUrl,
      paymentPayload,
      requirements
    ).catch((err) => ({
      isValid: false,
      invalidReason: `Facilitator verify failed: ${String(err)}`
    }));
    if (!verifyResult.isValid) {
      return payment402Response(routeConfig, resourceUrl, verifyResult.invalidReason);
    }
    return new Response(null, {
      status: 200,
      headers: {
        "x-middleware-next": "1",
        "x-x402-payment-verified": "1",
        "x-x402-payload": encodeHeader(paymentPayload)
      }
    });
  };
}
function payment402Response(config, resourceUrl, error) {
  const paymentRequired = {
    ...buildPaymentRequired(config, resourceUrl),
    ...error ? { error } : {}
  };
  return new Response(
    JSON.stringify({ error: error ?? "Payment required", x402: true }),
    {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        [exports.HEADERS.PAYMENT_REQUIRED]: encodeHeader(paymentRequired)
      }
    }
  );
}
function matchPath(pattern, pathname) {
  if (pattern.endsWith("*")) {
    return pathname.startsWith(pattern.slice(0, -1));
  }
  return pathname === pattern || pathname.startsWith(`${pattern}/`);
}

// src/client/keypair.ts
init_constants();

// src/client/transaction.ts
init_constants();
async function buildPaymentTransaction(opts, sign) {
  const {
    sourcePublicKey,
    payTo,
    asset,
    amountBaseUnits,
    network,
    horizonUrl = exports.HORIZON_URLS[network],
    maxTimeoutSeconds
  } = opts;
  const networkPassphrase = exports.NETWORK_PASSPHRASES[network];
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
    const contractId = exports.USDC_CONTRACT_IDS[network];
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
    const paymentRequiredHeader = firstResponse.headers.get(exports.HEADERS.PAYMENT_REQUIRED);
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
      x402Version: exports.X402_VERSION,
      scheme: "exact",
      network: requirements.network,
      payload: { transaction: txXdr }
    };
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set(exports.HEADERS.X_PAYMENT, encodeHeader(paymentPayload));
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

// src/client/freighter.ts
init_constants();
function x402FreighterFetch(config) {
  const { network, horizonUrl } = config;
  return async (input, init) => {
    const request = new Request(input, init);
    const firstResponse = await globalThis.fetch(request.clone());
    if (firstResponse.status !== 402) {
      return firstResponse;
    }
    const paymentRequiredHeader = firstResponse.headers.get(exports.HEADERS.PAYMENT_REQUIRED);
    if (!paymentRequiredHeader) {
      return firstResponse;
    }
    const paymentRequired = safeDecodeHeader(paymentRequiredHeader);
    if (!paymentRequired?.accepts?.length) {
      return firstResponse;
    }
    const requirements = findStellarRequirement2(paymentRequired.accepts);
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
        asset: resolveAsset2(requirements.asset),
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
      x402Version: exports.X402_VERSION,
      scheme: "exact",
      network: requirements.network,
      payload: { transaction: txXdr }
    };
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set(exports.HEADERS.X_PAYMENT, encodeHeader(paymentPayload));
    return globalThis.fetch(input, { ...init, headers: retryHeaders });
  };
}
function findStellarRequirement2(accepts) {
  return accepts.find(
    (r) => r.scheme === "exact" && r.network.startsWith("stellar:")
  );
}
function resolveAsset2(onChainAsset) {
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
    const { NETWORK_PASSPHRASES: NETWORK_PASSPHRASES2 } = await Promise.resolve().then(() => (init_constants(), constants_exports));
    return NETWORK_PASSPHRASES2[fallback];
  }
}

// src/index.ts
init_constants();

exports.buildPaymentRequired = buildPaymentRequired;
exports.buildPaymentRequirements = buildPaymentRequirements;
exports.createX402Middleware = createX402Middleware;
exports.decodeHeader = decodeHeader;
exports.encodeHeader = encodeHeader;
exports.fromBaseUnits = fromBaseUnits;
exports.getDefaultFacilitatorUrl = getDefaultFacilitatorUrl;
exports.parsePaymentHeader = parsePaymentHeader;
exports.settlePayment = settlePayment;
exports.toBaseUnits = toBaseUnits;
exports.validatePaymentPayload = validatePaymentPayload;
exports.verifyPayment = verifyPayment;
exports.withX402 = withX402;
exports.x402Fetch = x402Fetch;
exports.x402FreighterFetch = x402FreighterFetch;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map
import { toBaseUnits, safeDecodeHeader, encodeHeader } from './chunk-WFMBZF52.js';
import { OPENZEPPELIN_FACILITATOR_URLS, X402_VERSION, CAIP2_NETWORKS, ASSET_METADATA, USDC_CONTRACT_IDS, HEADERS } from './chunk-DEFBSM2Q.js';

// src/facilitator.ts
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
  return OPENZEPPELIN_FACILITATOR_URLS[network];
}

// src/server/payment-required.ts
function buildPaymentRequired(config, resourceUrl) {
  const requirements = buildPaymentRequirements(config, resourceUrl);
  return {
    x402Version: X402_VERSION,
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
  const caip2Network = CAIP2_NETWORKS[network];
  const assetMeta = ASSET_METADATA[asset];
  const maxAmountRequired = toBaseUnits(amount, asset);
  const onChainAsset = asset === "XLM" ? "native" : USDC_CONTRACT_IDS[network];
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
function parsePaymentHeader(request) {
  const header = request.headers.get(HEADERS.X_PAYMENT);
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
            [HEADERS.PAYMENT_REQUIRED]: encodeHeader(
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
      network: CAIP2_NETWORKS[config.network]
    };
    const responseHeaders = new Headers(handlerResponse.headers);
    responseHeaders.set(
      HEADERS.X_PAYMENT_RESPONSE,
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
        [HEADERS.PAYMENT_REQUIRED]: encodeHeader(paymentRequired)
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

export { buildPaymentRequired, buildPaymentRequirements, createX402Middleware, getDefaultFacilitatorUrl, parsePaymentHeader, settlePayment, validatePaymentPayload, verifyPayment, withX402 };
//# sourceMappingURL=chunk-UCVDHDL3.js.map
//# sourceMappingURL=chunk-UCVDHDL3.js.map
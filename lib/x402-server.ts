/**
 * x402 server-side middleware for Next.js App Router.
 *
 * Uses x402HTTPResourceServer with a custom Next.js HTTPAdapter to process
 * payment-gated API routes in a framework-agnostic way.
 */

import {
  x402ResourceServer,
  x402HTTPResourceServer,
  HTTPFacilitatorClient,
  type RoutesConfig,
  type PaywallConfig,
  type HTTPAdapter,
} from "@x402/core/server";
import { decodePaymentRequiredHeader } from "@x402/core/http";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { createPaywall } from "@x402-stellar/paywall";
import { stellarPaywall } from "@x402-stellar/paywall/stellar";

const TESTNET_FACILITATOR_URL = "https://channels.openzeppelin.com/x402/testnet";
const MAINNET_FACILITATOR_URL = "https://channels.openzeppelin.com/x402";
const TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";

export const STELLAR_TESTNET = "stellar:testnet" as const;
export const STELLAR_PUBNET = "stellar:pubnet" as const;
export type StellarNetwork = typeof STELLAR_TESTNET | typeof STELLAR_PUBNET;

export interface X402Config {
  network: StellarNetwork;
  /** Stellar address to receive payments */
  payTo: string;
  /** Price in USDC (e.g. "0.10") */
  price: string;
  description?: string;
  mimeType?: string;
}

/** Next.js Web API Request → x402 HTTPAdapter */
class NextRequestAdapter implements HTTPAdapter {
  constructor(private req: Request) {}

  getHeader(name: string): string | undefined {
    return this.req.headers.get(name) ?? undefined;
  }
  getMethod(): string {
    return this.req.method;
  }
  getPath(): string {
    try {
      return new URL(this.req.url).pathname;
    } catch {
      return "/";
    }
  }
  getUrl(): string {
    return this.req.url;
  }
  getAcceptHeader(): string {
    return this.req.headers.get("accept") ?? "";
  }
  getUserAgent(): string {
    return this.req.headers.get("user-agent") ?? "";
  }
  getQueryParams(): Record<string, string | string[]> {
    try {
      const p: Record<string, string> = {};
      new URL(this.req.url).searchParams.forEach((v, k) => (p[k] = v));
      return p;
    } catch {
      return {};
    }
  }
  getQueryParam(name: string): string | string[] | undefined {
    try {
      return new URL(this.req.url).searchParams.get(name) ?? undefined;
    } catch {
      return undefined;
    }
  }
}

interface ServerState {
  httpServer: x402HTTPResourceServer;
  paywallConfig: PaywallConfig;
  ready: Promise<void>;
}

function buildServerState(config: X402Config, routes: RoutesConfig): ServerState {
  const isTestnet = config.network === STELLAR_TESTNET;
  const facilitatorUrl = isTestnet ? TESTNET_FACILITATOR_URL : MAINNET_FACILITATOR_URL;
  const apiKey = process.env.OZ_API_KEY;

  const facilitatorClient = new HTTPFacilitatorClient({
    url: facilitatorUrl,
    createAuthHeaders: apiKey
      ? async () => {
          const h = { Authorization: `Bearer ${apiKey}` };
          return { verify: h, settle: h, supported: h };
        }
      : undefined,
  });

  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    config.network,
    new ExactStellarScheme(),
  );

  const paywallProvider = createPaywall()
    .withNetwork(stellarPaywall)
    .withConfig({
      appName: "x402 Stellar Demo",
      testnet: isTestnet,
      stellarRpcUrl: isTestnet ? TESTNET_RPC_URL : undefined,
    } as PaywallConfig)
    .build();

  const httpServer = new x402HTTPResourceServer(resourceServer, routes);
  httpServer.registerPaywallProvider(paywallProvider);

  const ready = httpServer.initialize().catch((err: unknown) => {
    // Non-fatal: if the facilitator is unreachable or API key is missing,
    // the server still returns proper 402 responses but cannot settle payments.
    console.warn(
      "[x402] Facilitator initialization failed — payment settlement may not work.",
      err instanceof Error ? err.message : err,
    );
  });

  return { httpServer, paywallConfig: { testnet: isTestnet } as PaywallConfig, ready };
}

/**
 * Wraps a Next.js App Router route handler with x402 payment verification.
 *
 * @example
 * ```ts
 * export const GET = withPayment(
 *   async () => Response.json({ data: "protected" }),
 *   { network: STELLAR_TESTNET, payTo: "G...", price: "0.10" },
 * );
 * ```
 */
export function withPayment(
  handler: (req: Request) => Promise<Response> | Response,
  config: X402Config,
): (req: Request) => Promise<Response> {
  const payTo = config.payTo || process.env.PAYTO_ADDRESS || "";

  // Build server state once per route at module load
  const routes: RoutesConfig = {
    ["GET /api/download"]: {
      accepts: [
        {
          scheme: "exact",
          price: config.price,
          network: config.network,
          payTo,
        },
      ],
      description: config.description ?? "Protected content",
      mimeType: config.mimeType ?? "application/json",
    },
  };

  const state = buildServerState(config, routes);

  return async (req: Request): Promise<Response> => {
    const apiKey = process.env.OZ_API_KEY;
    if (!apiKey) {
      const hasPaymentHeader =
        req.headers.get("PAYMENT-SIGNATURE") ?? req.headers.get("payment-signature");

      if (hasPaymentHeader) {
        // Client sent a payment but we can't verify without an API key — stop the retry loop.
        return Response.json(
          { error: "OZ_API_KEY not configured. Add your key to .env.local to enable payment verification." },
          { status: 402, headers: { "Content-Type": "application/json" } },
        );
      }

      // Initial unauthenticated request — return a structured 402 so the paywall UI renders.
      return Response.json(
        {
          x402Version: 2,
          error:
            "OZ_API_KEY not set in .env.local — get a free key at https://channels.openzeppelin.com/testnet/gen",
          accepts: [
            {
              scheme: "exact",
              network: config.network,
              amount: String(Math.round(parseFloat(config.price) * 1e7)),
              asset: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
              payTo,
              maxTimeoutSeconds: 300,
              extra: { name: "USDC", description: "USD Coin (testnet)", areFeesSponsored: true },
            },
          ],
        },
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "PAYMENT-REQUIRED",
          },
        },
      );
    }

    // Wait for server initialization (resolves immediately on subsequent requests)
    await state.ready;

    const adapter = new NextRequestAdapter(req);
    const context = {
      adapter,
      path: adapter.getPath(),
      method: adapter.getMethod(),
      paymentHeader:
        req.headers.get("PAYMENT-SIGNATURE") ??
        req.headers.get("payment-signature") ??
        undefined,
    };

    let result;
    try {
      result = await state.httpServer.processHTTPRequest(context, state.paywallConfig);
    } catch (err) {
      console.error("[x402] processHTTPRequest error:", err);
      return Response.json(
        {
          error: "Payment processing error",
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      );
    }

    if (result.type === "payment-error") {
      const { status, headers, body, isHtml } = result.response;
      if (isHtml) {
        return new Response(body as string, {
          status,
          headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
        });
      }
      // The payment requirements live in the PAYMENT-REQUIRED response header
      // (base64-encoded). Decode it so the client-side paywall can parse it as JSON.
      const paymentRequiredHeader = (headers as Record<string, string>)["PAYMENT-REQUIRED"];
      const jsonBody = paymentRequiredHeader
        ? decodePaymentRequiredHeader(paymentRequiredHeader)
        : body;
      return Response.json(jsonBody, {
        status,
        headers: {
          ...headers,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "PAYMENT-REQUIRED",
        },
      });
    }

    if (result.type === "no-payment-required") {
      return handler(req);
    }

    // payment-verified — serve content then settle asynchronously
    const response = await handler(req);

    state.httpServer
      .processSettlement(
        result.paymentPayload,
        result.paymentRequirements,
        result.declaredExtensions,
      )
      .catch((err: unknown) => {
        console.error("[x402] settlement error:", err);
      });

    return response;
  };
}

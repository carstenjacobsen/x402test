import { X as X402StellarConfig } from '../types-DC2l_1PN.js';
import '@stellar/stellar-sdk';

type NextRouteHandler = (request: Request, context?: {
    params?: Record<string, string | string[]>;
}) => Response | Promise<Response>;
/**
 * Wrap a Next.js App Router route handler with x402 payment gating.
 *
 * @example
 * ```ts
 * // app/api/premium/route.ts
 * import { withX402 } from 'x402-stellar';
 *
 * export const GET = withX402(
 *   async (req) => Response.json({ data: 'premium content' }),
 *   {
 *     amount: '0.01',
 *     asset: 'USDC',
 *     network: 'testnet',
 *     payTo: 'G...',
 *     description: 'Premium API access',
 *   }
 * );
 * ```
 */
declare function withX402(handler: NextRouteHandler, config: X402StellarConfig): NextRouteHandler;
interface X402RouteConfig extends X402StellarConfig {
    /** URL path pattern, e.g. "/api/premium" or "/api/data/:id" */
    path: string;
}
/**
 * Create a Next.js middleware handler that enforces x402 payments on
 * matching routes. Use this in your `middleware.ts` file.
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { createX402Middleware } from 'x402-stellar';
 *
 * export const middleware = createX402Middleware([
 *   {
 *     path: '/api/premium',
 *     amount: '0.01',
 *     asset: 'USDC',
 *     network: 'testnet',
 *     payTo: 'G...',
 *   },
 * ]);
 *
 * export const config = {
 *   matcher: ['/api/premium/:path*'],
 * };
 * ```
 */
declare function createX402Middleware(routes: X402RouteConfig[]): (request: Request) => Response | Promise<Response>;

export { type X402RouteConfig, createX402Middleware, withX402 };

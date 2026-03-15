export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    service: 'x402 Joke API',
    version: '1.0.0',
    description:
      'A pay-per-request REST API powered by the x402 HTTP payment protocol on Stellar. ' +
      'Access premium joke content by paying micro-amounts of USDC on Stellar testnet.',
    endpoints: [
      {
        path: '/',
        method: 'GET',
        description: 'Service info and endpoint listing',
        paywall: false,
      },
      {
        path: '/testnet/joke',
        method: 'GET',
        description: 'Fetch a random joke',
        paywall: true,
        price: '0.01 USDC',
        network: 'Stellar Testnet',
        protocol: 'x402',
      },
    ],
    usage: {
      step1: 'GET /joke → server responds 402 with PAYMENT-REQUIRED header',
      step2: 'Read payment requirements, sign a Stellar USDC transaction',
      step3: 'Retry GET /joke with X-PAYMENT header containing signed XDR',
      step4: 'Server settles payment via OpenZeppelin facilitator, returns joke',
    },
    links: {
      x402_spec: 'https://x402.org',
      x402_stellar: 'https://github.com/anthropics/x402-stellar',
      facilitator: 'https://channels.openzeppelin.com/x402/testnet',
    },
  });
}

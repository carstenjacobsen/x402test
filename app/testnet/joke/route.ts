import { withX402 } from 'x402-stellar';

export const dynamic = 'force-dynamic';

const jokes = [
  {
    setup: "Why don't scientists trust atoms?",
    punchline: "Because they make up everything!",
  },
  {
    setup: "Why did the scarecrow win an award?",
    punchline: "Because he was outstanding in his field!",
  },
  {
    setup: "I told my wife she was drawing her eyebrows too high.",
    punchline: "She looked surprised.",
  },
  {
    setup: "Why can't you give Elsa a balloon?",
    punchline: "Because she'll let it go.",
  },
  {
    setup: "What do you call cheese that isn't yours?",
    punchline: "Nacho cheese.",
  },
  {
    setup: "Why did the bicycle fall over?",
    punchline: "Because it was two-tired.",
  },
  {
    setup: "What do you call a fake noodle?",
    punchline: "An impasta.",
  },
  {
    setup: "Why don't eggs tell jokes?",
    punchline: "They'd crack each other up.",
  },
  {
    setup: "What do you call a sleeping dinosaur?",
    punchline: "A dino-snore.",
  },
  {
    setup: "Why did the math book look so sad?",
    punchline: "Because it had too many problems.",
  },
  {
    setup: "What do you call a fish without eyes?",
    punchline: "A fsh.",
  },
  {
    setup: "Why can't Cinderella play soccer?",
    punchline: "Because she always runs away from the ball.",
  },
  {
    setup: "What did the ocean say to the beach?",
    punchline: "Nothing, it just waved.",
  },
  {
    setup: "Why did the golfer bring an extra pair of pants?",
    punchline: "In case he got a hole in one.",
  },
  {
    setup: "What do you call a bear with no teeth?",
    punchline: "A gummy bear.",
  },
  {
    setup: "Why did the coffee file a police report?",
    punchline: "It got mugged.",
  },
  {
    setup: "What do you call a magic dog?",
    punchline: "A labracadabrador.",
  },
  {
    setup: "Why don't skeletons fight each other?",
    punchline: "They don't have the guts.",
  },
  {
    setup: "What do you call a factory that makes okay products?",
    punchline: "A satisfactory.",
  },
  {
    setup: "How do you organize a space party?",
    punchline: "You planet.",
  },
];

function getRecipient(): string {
  const addr = process.env.RECIPIENT_ADDRESS;
  if (!addr) throw new Error('RECIPIENT_ADDRESS env variable is not set. Copy .env.local.example to .env.local and fill it in.');
  return addr;
}

async function jokeHandler() {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  return Response.json({
    joke,
    paid: true,
    protocol: 'x402',
    network: 'Stellar Testnet',
  });
}

// withX402 config is built lazily so missing env var surfaces as a clear 500
export async function GET(req: Request) {
  const recipient = getRecipient();
  const handler = withX402(jokeHandler, {
    amount: '0.01',
    asset: 'USDC',
    network: 'testnet',
    payTo: recipient,
    description: 'Pay $0.01 USDC to receive a random joke',
  });
  return handler(req);
}

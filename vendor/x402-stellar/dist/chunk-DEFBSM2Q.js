// src/constants.ts
var HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org"
};
var SOROBAN_RPC_URLS = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban-mainnet.stellar.org"
};
var NETWORK_PASSPHRASES = {
  testnet: "Test SDF Network ; September 2015",
  mainnet: "Public Global Stellar Network ; September 2015"
};
var CAIP2_NETWORKS = {
  testnet: "stellar:testnet",
  mainnet: "stellar:pubnet"
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
var OPENZEPPELIN_FACILITATOR_URLS = {
  testnet: "https://channels.openzeppelin.com/x402/testnet",
  mainnet: "https://channels.openzeppelin.com/x402"
};
var X402_VERSION = 1;
var HEADERS = {
  PAYMENT_REQUIRED: "payment-required",
  X_PAYMENT: "x-payment",
  X_PAYMENT_RESPONSE: "x-payment-response"
};

export { ASSET_METADATA, CAIP2_NETWORKS, HEADERS, HORIZON_URLS, NETWORK_PASSPHRASES, OPENZEPPELIN_FACILITATOR_URLS, SOROBAN_RPC_URLS, USDC_CONTRACT_IDS, X402_VERSION };
//# sourceMappingURL=chunk-DEFBSM2Q.js.map
//# sourceMappingURL=chunk-DEFBSM2Q.js.map
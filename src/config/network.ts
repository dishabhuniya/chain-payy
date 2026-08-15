export interface NetworkSettings {
  networkPassphrase: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
  contractId: string;
  friendbotUrl: string;
}

const envNetwork = (import.meta.env.VITE_STELLAR_NETWORK as 'testnet' | 'futurenet') || 'testnet';
const envContractId = import.meta.env.VITE_PAYMENT_CONTRACT_ID || 'CDDXP4MWAHLV6TEYVG6I62CBP2INMSJ32Z33BKCBFTOEVSX3BB26WKUB';
const envRpcUrl = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';

export const NETWORK_CONFIG: {
  selectedNetwork: 'testnet' | 'futurenet';
  networks: Record<'testnet' | 'futurenet', NetworkSettings>;
} = {
  selectedNetwork: envNetwork,
  networks: {
    testnet: {
      networkPassphrase: 'Test SDF Network ; September 2015',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      sorobanRpcUrl: envRpcUrl,
      contractId: envContractId,
      friendbotUrl: 'https://friendbot.stellar.org',
    },
    futurenet: {
      networkPassphrase: 'Test SDF Future Network ; October 2022',
      horizonUrl: 'https://horizon-futurenet.stellar.org',
      sorobanRpcUrl: 'https://rpc-futurenet.stellar.org',
      contractId: '',
      friendbotUrl: 'https://friendbot-futurenet.stellar.org',
    },
  },
};

// USDC and XLM token addresses on Testnet
export const TOKEN_ASSETS = [
  {
    code: 'XLM',
    issuer: '',
    contractId: 'CDLZ47GCA33EX374JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJW', // Native asset contract on Testnet
    decimals: 7,
    logo: 'https://cryptologos.cc/logos/stellar-xlm-logo.png',
  },
  {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MABDHUXFFFSS7V7N67GBBD47IF6LWK7P7MABDHUXFF',
    contractId: 'CCW67CX2SC6F6TUWO5CCVJ4N3K4OV5J5J6622K7J75W5W5W5W5W5W5W5', // Mock USDC asset contract on Testnet
    decimals: 7,
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
];

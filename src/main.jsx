import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChainProvider } from '@interchain-kit/react'
import { keplrWallet } from '@interchain-kit/keplr-extension'
import { stationWallet } from '@interchain-kit/station-extension'
import { trustWallet } from '@interchain-kit/trust-extension'
import { leapWallet } from '@interchain-kit/leap-extension'
import { cosmostationWallet } from '@interchain-kit/cosmostation-extension'

import '@interchain-ui/react/styles'

import App from './App.jsx'
import WalletModal from './components/WalletModal.jsx'
import './index.css'

const republicChain = {
  // camelCase fields required by interchain-kit internally
  chainName: 'republicaitestnet',
  chainId: 'raitestnet_77701-1',
  prettyName: 'Republic AI Testnet',
  chainType: 'cosmos',
  networkType: 'testnet',
  status: 'live',
  bech32Prefix: 'rai',
  keyAlgos: ['ethsecp256k1'],
  slip44: 60,
  // snake_case aliases for compatibility with chain-registry types
  chain_name: 'republicaitestnet',
  chain_id: 'raitestnet_77701-1',
  pretty_name: 'Republic AI Testnet',
  chain_type: 'cosmos',
  network_type: 'testnet',
  bech32_prefix: 'rai',
  key_algos: ['ethsecp256k1'],
  fees: {
    fee_tokens: [{
      denom: 'arai',
      fixed_min_gas_price: 10000000000,
      low_gas_price: 10000000000,
      average_gas_price: 25000000000,
      high_gas_price: 40000000000,
    }],
  },
  staking: {
    staking_tokens: [{ denom: 'arai' }],
  },
  apis: {
    rpc: [{ address: 'https://rpc.republicai.io', provider: 'Republic AI' }],
    rest: [{ address: 'https://rest.republicai.io', provider: 'Republic AI' }],
  },
  explorers: [{
    kind: 'republic-explorer',
    url: 'https://republicai.io',
    tx_page: 'https://republicai.io/tx/${txHash}',
  }],
  logo_URIs: {
    png: 'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/raitestnet_77701/chain.png',
  },
};

const republicAssetList = {
  chain_name: 'republicaitestnet',
  assets: [{
    description: 'The native token of Republic AI Testnet.',
    type_asset: 'evm-base',
    denom_units: [
      { denom: 'arai', exponent: 0 },
      { denom: 'RAI', exponent: 18 },
    ],
    base: 'arai',
    name: 'Republic AI',
    display: 'RAI',
    symbol: 'RAI',
    logo_URIs: {
      png: 'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/raitestnet_77701/arai.png',
    },
  }],
};

const supportedChains = [republicChain];
const supportedAssets = [republicAssetList];

const wallets = [
  keplrWallet,
  leapWallet,
  trustWallet,
  cosmostationWallet,
  stationWallet
];

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChainProvider
      chains={supportedChains}
      assetLists={supportedAssets}
      wallets={wallets}
      walletModal={WalletModal}
    >
      <App />
    </ChainProvider>
  </React.StrictMode>,
)

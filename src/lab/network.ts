import { defineChain } from 'viem'

/**
 * Monad Testnet (Metropolis).
 * chainId 0x279f = 10143, verified against the live RPC.
 */
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: 'https://testnet.monadvision.com',
    },
  },
  testnet: true,
})

export const MAINNET = {
  chainId: 143,
  name: 'Monad Mainnet',
  rpcUrl: 'https://rpc.monad.xyz',
  explorer: 'https://monadvision.com',
} as const

export const FAUCET_URL = 'https://faucet.monad.xyz/'

export const explorerTxUrl = (hash: string) =>
  `https://testnet.monadvision.com/tx/${hash}`

export const explorerAddressUrl = (address: string) =>
  `https://testnet.monadvision.com/address/${address}`

import { createPublicClient, http } from 'viem'
import { monadTestnet } from './network'

/**
 * Read-only client. Everything the lab shows as "what really happened"
 * comes from here over JSON-RPC — never from the explorer UI.
 */
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(monadTestnet.rpcUrls.default.http[0]),
})

export const rpcUrl = monadTestnet.rpcUrls.default.http[0]

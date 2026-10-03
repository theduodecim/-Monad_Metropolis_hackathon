import type { Transaction, TransactionReceipt } from 'viem'
import { formatEther } from 'viem'
import { publicClient } from './client'

export type TxFacts = {
  hash: string
  from: string
  to: string | null
  valueWei: bigint
  nonce: number
  gasLimit: bigint
  gasPriceWei: bigint | null
  blockNumber: bigint | null
  blockTimestamp: bigint | null
  status: 'success' | 'reverted' | 'pending'
  gasUsed: bigint | null
  effectiveGasPriceWei: bigint | null
  confirmations: number
  explorerUrl: string
}

/**
 * Every field here comes from JSON-RPC calls against Monad Testnet:
 *   eth_getTransactionByHash  -> what the user signed
 *   eth_getTransactionReceipt -> what the chain did with it
 *   eth_blockNumber           -> how deep the tx now sits
 */
export async function fetchTxFacts(
  hash: `0x${string}`,
): Promise<TxFacts> {
  const tx = (await publicClient.getTransaction({ hash })) as Transaction
  const head = await publicClient.getBlockNumber()

  let receipt: TransactionReceipt | null = null
  try {
    receipt = await publicClient.getTransactionReceipt({ hash })
  } catch {
    receipt = null
  }

  const blockNumber = receipt?.blockNumber ?? null
  let blockTimestamp: bigint | null = null
  if (blockNumber !== null) {
    const block = await publicClient.getBlock({ blockNumber })
    blockTimestamp = block.timestamp
  }

  let confirmations = 0
  if (blockNumber !== null) {
    confirmations = Number(head - blockNumber) + 1
  }

  const status: TxFacts['status'] =
    receipt === null ? 'pending' : receipt.status === 'success' ? 'success' : 'reverted'

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to ?? null,
    valueWei: tx.value,
    nonce: tx.nonce,
    gasLimit: tx.gas,
    gasPriceWei: tx.gasPrice ?? null,
    blockNumber,
    blockTimestamp,
    status,
    gasUsed: receipt?.gasUsed ?? null,
    effectiveGasPriceWei: receipt?.effectiveGasPrice ?? null,
    confirmations,
    explorerUrl: `https://testnet.monadvision.com/tx/${hash}`,
  }
}

export const mon = (wei: bigint | null | undefined): string =>
  wei === null || wei === undefined ? '—' : `${Number(formatEther(wei)).toFixed(6)} MON`

export const gwei = (wei: bigint | null | undefined): string =>
  wei === null || wei === undefined
    ? '—'
    : `${(Number(wei) / 1e9).toFixed(4)} gwei`

export const shortHash = (hash: string): string =>
  hash.length > 18 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash

export const shortAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`

/** Total fee actually paid: gasUsed * effectiveGasPrice. */
export const feePaid = (facts: TxFacts): bigint | null => {
  if (facts.gasUsed === null || facts.effectiveGasPriceWei === null) return null
  return facts.gasUsed * facts.effectiveGasPriceWei
}

/** Polls the RPC until the tx has a receipt. */
export async function waitForReceipt(hash: `0x${string}`) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt
}

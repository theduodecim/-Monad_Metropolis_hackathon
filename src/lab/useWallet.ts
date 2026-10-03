import { useCallback, useEffect, useState } from 'react'
import type { Address } from 'viem'
import { createWalletClient, custom, formatEther } from 'viem'
import { monadTestnet } from './network'
import { publicClient } from './client'

/** Inferred from the factory so the chain type flows through correctly. */
function buildSigner(injected: Eip1193Provider) {
  return createWalletClient({
    chain: monadTestnet,
    transport: custom(injected),
  })
}

export type Signer = ReturnType<typeof buildSigner>

export type WalletState = {
  address: Address | null
  chainId: number | null
  balance: bigint | null
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
  switchToTestnet: () => Promise<void>
  getSigner: () => Signer
}

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, cb: () => void) => void
  removeListener?: (event: string, cb: () => void) => void
}

function getInjected(): Eip1193Provider | null {
  const eth = (window as unknown as { eth?: Eip1193Provider }).eth
  return eth ?? null
}

/** MetaMask rejects with 4001 when the user clicks "Reject". */
export function isUserRejection(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const code = (err as { code?: number }).code
  return code === 4001
}

export function explainWalletError(err: unknown): string {
  if (isUserRejection(err)) {
    return 'Rechazaste la firma en MetaMask. La transacción nunca salió: nada se pagó y nada cambió en la red. Esto es una de las outcomes más comunes y es completamente normal.'
  }
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (/insufficient funds/i.test(message)) {
    return 'No tenés suficiente MON para pagar el valor + gas. Pasá por el faucet.'
  }
  if (/user rejected|denied/i.test(message)) {
    return 'MetaMask denegó la operación.'
  }
  return message || 'Error desconocido al conectar la wallet.'
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<Address | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshBalance = useCallback(async (addr?: Address | null) => {
    const target = addr ?? address
    if (!target) return
    const bal = await publicClient.getBalance({ address: target })
    setBalance(bal)
  }, [address])

  const syncChain = useCallback(async () => {
    const injected = getInjected()
    if (!injected) return
    const chainHex = (await injected.request({
      method: 'eth_chainId',
    })) as string
    setChainId(Number.parseInt(chainHex, 16))
  }, [])

  const connect = useCallback(async () => {
    const injected = getInjected()
    if (!injected) {
      setError('No se detectó MetaMask. Instalá la extensión y recargá la página.')
      return
    }
    setIsConnecting(true)
    setError(null)
    try {
      const accounts = (await injected.request({
        method: 'eth_requestAccounts',
      })) as Address[]
      const addr = accounts[0]
      setAddress(addr)
      await syncChain()
      await refreshBalance(addr)
    } catch (err) {
      setError(explainWalletError(err))
    } finally {
      setIsConnecting(false)
    }
  }, [syncChain, refreshBalance])

  const disconnect = useCallback(() => {
    setAddress(null)
    setBalance(null)
    setChainId(null)
  }, [])

  const switchToTestnet = useCallback(async () => {
    const injected = getInjected()
    if (!injected) return
    setError(null)
    try {
      await injected.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279f' }],
      })
      await syncChain()
    } catch {
      try {
        await injected.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x279f',
              chainName: 'Monad Testnet',
              nativeCurrency: {
                name: 'MON',
                symbol: 'MON',
                decimals: 18,
              },
              rpcUrls: ['https://testnet-rpc.monad.xyz'],
              blockExplorerUrls: ['https://testnet.monadvision.com'],
            },
          ],
        })
        await syncChain()
      } catch (err) {
        setError(explainWalletError(err))
      }
    }
  }, [syncChain])

  const getSigner = useCallback((): Signer => {
    const injected = getInjected()
    if (!injected) throw new Error('MetaMask no está disponible.')
    return buildSigner(injected)
  }, [])

  // Keep the balance honest: listen to chain changes.
  useEffect(() => {
    const injected = getInjected()
    if (!injected?.on) return
    const onAccounts = () => {
      void connect()
    }
    const onChain = () => {
      void syncChain()
    }
    injected.on('accountsChanged', onAccounts)
    injected.on('chainChanged', onChain)
    return () => {
      injected.removeListener?.('accountsChanged', onAccounts)
      injected.removeListener?.('chainChanged', onChain)
    }
  }, [connect, syncChain])

  useEffect(() => {
    if (!injectedSnapshot()) return
    void (async () => {
      await syncChain()
      const accounts = await getAccountsSilently()
      if (accounts.length > 0) {
        setAddress(accounts[0])
        await refreshBalance(accounts[0])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    address,
    chainId,
    balance,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance,
    switchToTestnet,
    getSigner,
  }
}

function injectedSnapshot(): boolean {
  return getInjected() !== null
}

/** eth_accounts does not prompt the user, unlike eth_requestAccounts. */
async function getAccountsSilently(): Promise<Address[]> {
  const injected = getInjected()
  if (!injected) return []
  const accounts = (await injected.request({
    method: 'eth_accounts',
  })) as Address[]
  return accounts
}

export const formatMon = (wei: bigint | null): string =>
  wei === null ? '—' : `${Number(formatEther(wei)).toFixed(6)} MON`

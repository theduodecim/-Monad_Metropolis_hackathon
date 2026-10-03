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
  providerReady: boolean
  diagnostics: WalletDiagnostics | null
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
  switchToTestnet: () => Promise<void>
  getSigner: () => Signer
}

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, cb: (arg?: unknown) => void) => void
  removeListener?: (event: string, cb: (arg?: unknown) => void) => void
  isMetaMask?: boolean
  _isMetaMask?: boolean
}

type MaybeProvider = Eip1193Provider & {
  providers?: Eip1193Provider[]
}

/**
 * Why this is not just `window.eth`:
 * when a user has more than one wallet extension installed, the page receives an
 * ARRAY of providers and `window.eth.request` stops existing. Reading it naively
 * reports "no wallet" while MetaMask is sitting right there.
 */
function readProvider(): MaybeProvider | null {
  const w = window as unknown as {
    eth?: MaybeProvider | Eip1193Provider[]
    ethereum?: MaybeProvider | Eip1193Provider[]
  }
  const raw = w.eth ?? w.ethereum
  if (!raw) return null
  if (Array.isArray(raw)) {
    return (
      (raw.find((p) => p.isMetaMask || p._isMetaMask) as MaybeProvider | undefined) ??
      (raw[0] as MaybeProvider)
    )
  }
  return raw as MaybeProvider
}

function getInjected(): Eip1193Provider | null {
  return readProvider()
}

/** Diagnostics so the user is never stuck on a dead-end message. */
export type WalletDiagnostics = {
  hasWindowEth: boolean
  providerCount: number
  isMetaMask: boolean
  isLockedOrUnavailable: boolean | null
  hint: string
}

export function diagnoseWallet(): WalletDiagnostics {
  const w = window as unknown as {
    eth?: unknown
    ethereum?: unknown
  }
  const raw = w.eth ?? w.ethereum
  const provider = readProvider()
  const count = Array.isArray(raw)
    ? raw.length
    : raw
      ? 1
      : 0
  const isMetaMask = Boolean(provider?.isMetaMask || provider?._isMetaMask)

  let hint = ''
  let locked: boolean | null = null
  if (!raw) {
    hint =
      'No se encontró ningún provider inyectado. Si tenés MetaMask, probá recargá con Ctrl+Shift+R (fuerza un refresh, evita la caché). Si sigue igual, verificá que la extensión esté habilitada en este navegador y en este perfil.'
  } else if (!isMetaMask) {
    hint = `Se detectaron ${count} wallet(s), pero ninguna es MetaMask. El laboratorio usa MetaMask: instalá o habilitá la extensión de MetaMask.`
  } else {
    hint =
      'MetaMask está inyectada en la página. Si el botón no funciona, desbloqueá la extensión y recargá.'
  }

  return {
    hasWindowEth: Boolean(raw),
    providerCount: count,
    isMetaMask,
    isLockedOrUnavailable: locked,
    hint,
  }
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
      setError(diagnoseWallet().hint)
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

  // MetaMask injects asynchronously. Poll briefly instead of giving up on the
  // first miss, otherwise a slow injection looks identical to "not installed".
  const [providerReady, setProviderReady] = useState(() => getInjected() !== null)

  useEffect(() => {
    if (getInjected() !== null) {
      setProviderReady(true)
      return
    }
    let attempts = 0
    const timer = window.setInterval(() => {
      attempts += 1
      if (getInjected() !== null) {
        setProviderReady(true)
        window.clearInterval(timer)
      } else if (attempts > 20) {
        window.clearInterval(timer)
      }
    }, 150)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!providerReady) return
    void (async () => {
      await syncChain()
      const accounts = await getAccountsSilently()
      if (accounts.length > 0) {
        setAddress(accounts[0])
        await refreshBalance(accounts[0])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerReady])

  return {
    address,
    chainId,
    balance,
    isConnecting,
    error,
    providerReady,
    diagnostics: providerReady ? diagnoseWallet() : null,
    connect,
    disconnect,
    refreshBalance,
    switchToTestnet,
    getSigner,
  }
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

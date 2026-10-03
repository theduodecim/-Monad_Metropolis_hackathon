import { useState } from 'react'
import { monadTestnet, FAUCET_URL } from '../lab/network'
import { formatMon } from '../lab/useWallet'
import type { WalletState } from '../lab/useWallet'

export function FaucetStep({ wallet }: { wallet: WalletState }) {
  const [before, setBefore] = useState<bigint | null>(null)
  const [checking, setChecking] = useState(false)

  const onTestnet = wallet.chainId === monadTestnet.id

  const start = () => {
    setBefore(wallet.balance)
    window.open(FAUCET_URL, '_blank', 'noopener')
  }

  /**
   * Real detection: re-reads balance from the RPC. No fake, no mock.
   * If the faucet funded you, the number moves. If not, it doesn't.
   */
  const check = async () => {
    setChecking(true)
    try {
      await wallet.refreshBalance()
    } finally {
      setChecking(false)
    }
  }

  const arrived =
    before !== null && wallet.balance !== null && wallet.balance > before

  return (
    <>
      <div className="card">
        <div className="kicker">Paso 2 · Faucet</div>
        <h2>Conseguí MON de prueba</h2>
        <p className="lead">
          El faucet te manda tokens gratis para que puedas pagar gas. Es una
          transacción real en testnet: alguien te envió MON y quedó registrado en
          un bloque.
        </p>

        {!onTestnet && (
          <div className="notice warn">
            <strong>Red incorrecta</strong>
            El faucet manda a Monad Testnet (10143). Cambiá de red en MetaMask o el
            faucet no va a funcionar.
          </div>
        )}

        <div className="btn-row">
          <a
            className="btn"
            href={FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={start}
          >
            Abrir el faucet ↗
          </a>
          <button
            className="btn ghost"
            onClick={() => void check()}
            disabled={checking || !wallet.address}
          >
            {checking && <span className="spinner" />}
            Ya volví, revisar mi balance
          </button>
        </div>

        {before !== null && wallet.balance !== null && (
          <div className="balance-row">
            <div className="balance-box">
              <div className="label">Antes</div>
              <div className="value">{formatMon(before)}</div>
            </div>
            <div className="balance-arrow">
              {arrived ? '→' : '='}
            </div>
            <div className="balance-box">
              <div className="label">Ahora</div>
              <div
                className="value"
                style={{ color: arrived ? 'var(--ok)' : 'var(--muted)' }}
              >
                {formatMon(wallet.balance)}
              </div>
            </div>
          </div>
        )}

        {arrived && (
          <div className="notice ok">
            <strong>Llegaron los MON</strong>
            Tu balance subió de {formatMon(before)} a {formatMon(wallet.balance)}.
            Eso prueba una cosa importante: <strong>el balance no es un número
            guardado en tu wallet</strong>. Es el resultado de todas las
            transacciones que la red tiene registradas para tu dirección. El
            próximo paso es ir a ver cuál fue.
          </div>
        )}

        {before !== null && !arrived && !checking && (
          <div className="notice">
            <strong>El balance todavía no cambió</strong>
            Puede que el faucet esté tardando, o que ya tuvieras saldo. Te dejo el
            link al explorer de tu dirección para que lo verifiques vos mismo.
          </div>
        )}
      </div>
    </>
  )
}

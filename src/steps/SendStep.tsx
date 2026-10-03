import { useState } from 'react'
import { parseEther, isAddress } from 'viem'
import { KV, Pipeline, Copyable } from '../components/Lab'
import { publicClient } from '../lab/client'
import { fetchTxFacts, mon, shortAddress, type TxFacts } from '../lab/txFacts'
import { explainWalletError, isUserRejection, formatMon } from '../lab/useWallet'
import type { WalletState } from '../lab/useWallet'
import { monadTestnet } from '../lab/network'

type Phase = 'idle' | 'signing' | 'pending' | 'confirmed' | 'failed' | 'rejected'

const PHASE_STAGE: Record<Phase, number> = {
  idle: 2,
  signing: 2,
  pending: 4,
  confirmed: 6,
  failed: 6,
  rejected: 1,
}

export function SendStep({ wallet }: { wallet: WalletState }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('0.01')
  const [phase, setPhase] = useState<Phase>('idle')
  const [hash, setHash] = useState<string | null>(null)
  const [facts, setFacts] = useState<TxFacts | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [before, setBefore] = useState<bigint | null>(null)

  const onTestnet = wallet.chainId === monadTestnet.id
  const busy = phase === 'signing' || phase === 'pending'

  const reset = () => {
    setPhase('idle')
    setHash(null)
    setFacts(null)
    setMessage(null)
  }

  const send = async () => {
    setMessage(null)
    if (!wallet.address) return
    if (!isAddress(to)) {
      setMessage('Dirección inválida. Pegá una dirección 0x… de 42 caracteres.')
      return
    }
    let value: bigint
    try {
      value = parseEther(amount)
      if (value <= 0n) throw new Error('zero')
    } catch {
      setMessage('Cantidad inválida. Usá un número decimal, por ejemplo 0.01.')
      return
    }

    setBefore(wallet.balance)
    setPhase('signing')

    try {
      const signer = wallet.getSigner()
      const sent = await signer.sendTransaction({
        account: wallet.address,
        to: to as `0x${string}`,
        value,
      })

      const txHash = sent as `0x${string}`
      setHash(txHash)
      setPhase('pending')

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      const f = await fetchTxFacts(txHash)
      setFacts(f)

      if (receipt.status === 'success') {
        setPhase('confirmed')
        await wallet.refreshBalance()
      } else {
        setPhase('failed')
      }
    } catch (err) {
      if (isUserRejection(err)) {
        setPhase('rejected')
        setMessage(explainWalletError(err))
      } else {
        setPhase('failed')
        setMessage(explainWalletError(err))
      }
    }
  }

  const doneIds =
    phase === 'confirmed'
      ? ['dapp', 'wallet', 'sign', 'rpc', 'monad', 'block', 'confirm']
      : phase === 'pending'
        ? ['dapp', 'wallet', 'sign', 'rpc']
        : phase === 'signing'
          ? ['dapp', 'wallet']
          : []
  const errorIds =
    phase === 'rejected' ? ['sign'] : phase === 'failed' ? ['confirm'] : []

  return (
    <>
      <div className="card">
        <div className="kicker">Paso 4 · Envío</div>
        <h2>Mandá MON a otra dirección</h2>
        <p className="lead">
          Ahora sí: una transacción real firmada por vos. Antes de ejecutarla,
          entendamos exactamente qué va a pasar.
        </p>

        <Pipeline activeIndex={PHASE_STAGE[phase]} doneIds={doneIds} errorIds={errorIds} />
      </div>

      {phase === 'idle' && (
        <div className="card">
          <div className="kicker">Pre-flight</div>
          <h2>Esto es lo que va a pasar</h2>
          <div className="notice info">
            <strong>1. Tu navegador pide permiso</strong>
            MetaMask abre un pop-up mostrando destino, cantidad y fee. Tu clave
            privada nunca sale de la extensión.
          </div>
          <div className="notice info">
            <strong>2. Si confirmás, se firma</strong>
            Se crea una firma criptográfica y la transacción se manda al RPC. Si
            rechazás, no pasa nada: ni se paga ni se registra. Ese es el escenario
            del paso siguiente.
          </div>
          <div className="notice info">
            <strong>3. La red la incluye en un bloque</strong>
            Los validadores la sellan. Se ejecuta y tu balance baja.
          </div>
          <div className="notice info">
            <strong>4. Leés el receipt</strong>
            Consultamos <code>eth_getTransactionReceipt</code> y te mostramos el
            resultado real: gas usado, bloque y fee.
          </div>

          {!onTestnet && (
            <div className="notice warn">
              <strong>No estás en Testnet</strong>
              Cambiá a Monad Testnet antes de enviar.
            </div>
          )}

          <div className="field">
            <label>Dirección destino</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x… (podés poner la tuya en otra pestaña)"
              spellCheck={false}
            />
          </div>
          <div className="field">
            <label>Cantidad (MON)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              inputMode="decimal"
            />
          </div>

          {wallet.balance !== null && (
            <div className="notice small">
              Balance actual: <strong>{formatMon(wallet.balance)}</strong>. El fee de
              gas se paga aparte del valor enviado.
            </div>
          )}

          <div className="btn-row">
            <button
              className="btn"
              onClick={() => void send()}
              disabled={!wallet.address || !onTestnet}
            >
              Firmar y enviar
            </button>
            {!wallet.address && (
              <span className="muted small">Conectá la wallet primero.</span>
            )}
          </div>
          {message && <div className="notice err">{message}</div>}
        </div>
      )}

      {busy && (
        <div className="card">
          <div className="kicker">En curso</div>
          <h2>{phase === 'signing' ? 'Esperando tu firma…' : 'Pendiente…'}</h2>
          <div className="notice">
            {phase === 'signing' ? (
              <>
                <span className="spinner" />
                Revisá el pop-up de MetaMask. La transacción <em>no</em> se envió
                hasta que confirmes.
              </>
            ) : (
              <>
                <span className="spinner" />
                La transacción fue firmada y está en la mempool de Monad. Alguien
                tiene que incluirla en el próximo bloque.
              </>
            )}
          </div>
          {hash && (
            <KV items={[['Hash', <Copyable key="h" value={hash} label={hash.slice(0, 18) + '…'} />]]} />
          )}
        </div>
      )}

      {phase === 'confirmed' && facts && (
        <div className="card">
          <div className="kicker">Confirmada</div>
          <h2>Salió bien</h2>
          <div className="notice ok">
            <strong>Transacción ejecutada</strong>
            Está en el bloque #{facts.blockNumber?.toString()}. No se puede
            revertir: eso es la inmutabilidad.
          </div>
          <KV
            items={[
              ['Hash', <Copyable key="h" value={facts.hash} label={facts.hash.slice(0, 18) + '…'} />],
              ['Destino', <Copyable key="t" value={facts.to ?? ''} label={shortAddress(facts.to ?? '')} />],
              ['Valor enviado', mon(facts.valueWei)],
              ['Gas usado', facts.gasUsed?.toString() ?? '—'],
              ['Fee pagado', mon(facts.gasUsed !== null ? facts.gasUsed * (facts.effectiveGasPriceWei ?? 0n) : null)],
              ['Confirmaciones', String(facts.confirmations)],
            ]}
          />

          {before !== null && wallet.balance !== null && (
            <div className="balance-row">
              <div className="balance-box">
                <div className="label">Antes</div>
                <div className="value">{formatMon(before)}</div>
              </div>
              <div className="balance-arrow">→</div>
              <div className="balance-box">
                <div className="label">Ahora</div>
                <div className="value" style={{ color: 'var(--warn)' }}>
                  {formatMon(wallet.balance)}
                </div>
              </div>
            </div>
          )}

          <div className="notice info small">
            La diferencia entre ambos balances es el valor enviado <em>más</em> el
            fee de gas. El fee existe porque toda transacción ocupa espacio en un
            bloque, y los bloques son un recurso limitado.
          </div>

          <div className="btn-row">
            <a
              className="btn ghost small"
              href={facts.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inspeccionar en MonadVision ↗
            </a>
            <button className="btn ghost small" onClick={reset}>
              Mandar otra
            </button>
          </div>
        </div>
      )}

      {(phase === 'failed' || phase === 'rejected') && (
        <div className="card">
          <div className="kicker">No se completó</div>
          <h2>{phase === 'rejected' ? 'Rechazaste la firma' : 'La transacción falló'}</h2>
          <div className="notice err">{message}</div>
          {phase === 'rejected' ? (
            <div className="notice info">
              Esto es importante: <strong>rechazar no cuesta gas</strong> y no
              genera ninguna transacción en la red. El rechazo es del lado del
              usuario, antes de firmar. Nunca hubiera existido.
            </div>
          ) : (
            <div className="notice info">
              Si la transacción se envió pero el receipt dice <em>reverted</em>,
              el fee se cobra igual: la red procesó el trabajo. Fallar y ser
              rechazado no es lo mismo.
            </div>
          )}
          <div className="btn-row">
            <button className="btn ghost" onClick={reset}>
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}
    </>
  )
}

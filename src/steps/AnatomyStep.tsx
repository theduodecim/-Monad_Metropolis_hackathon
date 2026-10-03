import { useState } from 'react'
import { KV, Pipeline, Copyable } from '../components/Lab'
import { fetchTxFacts, mon, gwei, feePaid, shortHash, shortAddress, type TxFacts } from '../lab/txFacts'

export function AnatomyStep() {
  const [input, setInput] = useState('')
  const [facts, setFacts] = useState<TxFacts | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    const raw = input.trim()
    if (!raw.startsWith('0x') || raw.length !== 66) {
      setError('Pegá un hash de transacción válido (0x seguido de 64 caracteres).')
      setFacts(null)
      return
    }
    setLoading(true)
    setError(null)
    setFacts(null)
    try {
      const f = await fetchTxFacts(raw as `0x${string}`)
      if (f.from === '0x0000000000000000000000000000000000000000') {
        setError('Ese hash no existe en Monad Testnet. Revisá que lo pegaste completo.')
        return
      }
      setFacts(f)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo consultar el RPC.',
      )
    } finally {
      setLoading(false)
    }
  }

  const pipelineIndex =
    facts === null ? 0 : facts.status === 'pending' ? 4 : 6
  const doneIds =
    facts === null
      ? []
      : facts.status === 'pending'
        ? ['dapp', 'wallet', 'sign', 'rpc']
        : ['dapp', 'wallet', 'sign', 'rpc', 'monad', 'block', 'confirm']
  const errorIds = facts?.status === 'reverted' ? ['confirm'] : []

  return (
    <>
      <div className="card">
        <div className="kicker">Paso 3 · Anatomía</div>
        <h2>¿Qué pasó realmente?</h2>
        <p className="lead">
          Pegá el hash de la transacción del faucet (o de cualquier transacción en
          Monad Testnet) y leemos la verdad directamente del RPC. No estamos
          leyendo una pantalla: estamos consultando la cadena.
        </p>

        <div className="field">
          <label>Hash de transacción</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
          />
        </div>
        <div className="btn-row">
          <button
            className="btn"
            onClick={() => void analyze()}
            disabled={loading || input.trim().length === 0}
          >
            {loading && <span className="spinner" />}
            Analizar con el RPC
          </button>
          <span className="muted small">
            eth_getTransactionByHash · eth_getTransactionReceipt
          </span>
        </div>

        {error && <div className="notice err">{error}</div>}
      </div>

      {facts && (
        <>
          <div className="card">
            <div className="kicker">El recorrido</div>
            <h2>Las 7 etapas</h2>
            <Pipeline activeIndex={pipelineIndex} doneIds={doneIds} errorIds={errorIds} />

            <KV
              items={[
                [
                  'Estado',
                  facts.status === 'success' ? (
                    <span style={{ color: 'var(--ok)' }} key="s">
                      success ✓
                    </span>
                  ) : facts.status === 'reverted' ? (
                    <span style={{ color: 'var(--err)' }} key="s">
                      reverted ✗
                    </span>
                  ) : (
                    <span style={{ color: 'var(--warn)' }} key="s">
                      pending…
                    </span>
                  ),
                ],
                ['Hash', <Copyable key="h" value={facts.hash} label={shortHash(facts.hash)} />],
                ['From (origen)', <Copyable key="f" value={facts.from} label={shortAddress(facts.from)} />],
                [
                  'To (destino)',
                  facts.to ? (
                    <Copyable key="t" value={facts.to} label={shortAddress(facts.to)} />
                  ) : (
                    <span key="t" className="muted">
                      creación de contrato
                    </span>
                  ),
                ],
                ['Valor', mon(facts.valueWei)],
                ['Nonce', String(facts.nonce)],
                ['Gas limit', facts.gasLimit.toString()],
                ['Gas price', gwei(facts.gasPriceWei)],
                [
                  'Bloque',
                  facts.blockNumber === null ? (
                    <span className="muted">aún no minado</span>
                  ) : (
                    <Copyable
                      key="b"
                      value={facts.blockNumber.toString()}
                      label={`#${facts.blockNumber}`}
                    />
                  ),
                ],
                [
                  'Gas usado',
                  facts.gasUsed === null ? '—' : facts.gasUsed.toString(),
                ],
                ['Fee total', mon(feePaid(facts))],
                ['Confirmaciones', facts.confirmations > 0 ? String(facts.confirmations) : '—'],
              ]}
            />

            <div className="btn-row">
              <a
                className="btn ghost small"
                href={facts.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Inspeccionar en MonadVision ↗
              </a>
            </div>
          </div>

          <div className="card">
            <div className="kicker">Qué significa cada cosa</div>
            <h2>Traducción</h2>
            <div className="notice info">
              <strong>Nonce</strong>
              Es tu "número de turno". Dice cuántas transacciones enviaste antes.
              Si dos txs tuyas compiten, el nonce decide cuál se ejecuta primero.
            </div>
            <div className="notice info">
              <strong>Gas limit</strong>
              El máximo de gas que estás dispuesto a pagar. Es un techo de
              seguridad: si la operación lo supera, se revierte en vez de seguir
              cobrando.
            </div>
            <div className="notice info">
              <strong>Gas usado vs gas price</strong>
              El gas limit es cuánto permitís; el gas used es cuánto consumió de
              verdad. Gas used × gas price = lo que pagaste. Pagar menos gas de lo
              límite es normal.
            </div>
            <div className="notice info">
              <strong>Bloque y confirmaciones</strong>
              El bloque es donde quedó registrada tu tx. Las confirmaciones son
              cuántos bloques pasaron por encima: 1 significa que ya es
              irreversible. En Monad aparecen muy rápido.
            </div>
            <div className="notice info">
              <strong>Fee = valor + gas</strong>
              Si mandaste X MON a alguien, tu balance baja X + el fee. Por eso el
              balance nunca coincide con la suma de los "valores enviados".
            </div>
          </div>
        </>
      )}
    </>
  )
}

import { useState } from 'react'

export type Stage = {
  id: string
  label: string
  sub: string
  note: string
}

export const STAGES: Stage[] = [
  {
    id: 'dapp',
    label: 'dApp',
    sub: 'tu lab',
    note: 'Tu app pide una acción. No tiene claves ni dinero: solo preparás datos y abrís la wallet.',
  },
  {
    id: 'wallet',
    label: 'MetaMask',
    sub: 'la wallet',
    note: 'Extensión que guarda tus claves privadas. Es el único que puede firmar. La dApp nunca ve la clave.',
  },
  {
    id: 'sign',
    label: 'Firma',
    sub: 'cosas',
    note: 'Vos confirmás en el pop-up. MetaMask firma la transacción con tu clave privada y devuelve SOLO el hash.',
  },
  {
    id: 'rpc',
    label: 'RPC',
    sub: 'testnet-rpc',
    note: 'eth_sendTransaction. El RPC es una puerta: traduce JSON a la red. No decide nada, solo retransmite.',
  },
  {
    id: 'monad',
    label: 'Monad',
    sub: 'chain 10143',
    note: 'Los validadores incluyen tu transacción en la mempool, la ejecutan y la sellan en un bloque.',
  },
  {
    id: 'block',
    label: 'Bloque',
    sub: 'número',
    note: 'Cada bloque agrupa transacciones y las hace definitivas e inmutables.',
  },
  {
    id: 'confirm',
    label: 'Confirmación',
    sub: 'receipt',
    note: 'eth_getTransactionReceipt devuelve status y gas usado. Recién AHORA la tx se ejecutó de verdad.',
  },
]

type Props = {
  /** index of the stage currently being explained */
  activeIndex: number
  /** ids of stages that have completed successfully */
  doneIds?: string[]
  /** ids of stages that failed */
  errorIds?: string[]
}

export function Pipeline({ activeIndex, doneIds = [], errorIds = [] }: Props) {
  const active = STAGES[activeIndex]

  return (
    <div>
      <div className="pipeline">
        {STAGES.map((stage, i) => {
          const isDone = doneIds.includes(stage.id)
          const isError = errorIds.includes(stage.id)
          const isActive = i === activeIndex
          const cls = [
            'node',
            isDone ? 'ok' : '',
            isError ? 'err' : '',
            isActive ? 'lit' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div key={stage.id} style={{ display: 'contents' }}>
              {i > 0 && <div className="arrow">→</div>}
              <div className={cls}>
                <div className="node-label">{stage.label}</div>
                <div className="node-sub">{stage.sub}</div>
              </div>
            </div>
          )
        })}
      </div>
      {active && <div className="node-note">{active.note}</div>}
    </div>
  )
}

export function Copyable({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span
      className="copyable"
      title="Click para copiar"
      onClick={() => {
        void navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
    >
      {label ?? value}
      {copied && <span style={{ color: 'var(--ok)' }}> ✓</span>}
    </span>
  )
}

export function KV({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="kv">
      {items.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Concept({
  term,
  children,
}: {
  term: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`concept${open ? ' open' : ''}`}
      onClick={() => setOpen((o) => !o)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setOpen((o) => !o)}
    >
      <div className="concept-term">
        {term} <span style={{ color: 'var(--muted)' }}>{open ? '−' : '+'}</span>
      </div>
      <div className="concept-body">{children}</div>
    </div>
  )
}

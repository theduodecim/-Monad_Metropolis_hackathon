import { useState } from 'react'

export function ErrorStep({ onGo }: { onGo: () => void }) {
  const [open, setOpen] = useState<string | null>(null)

  const cases = [
    {
      id: 'reject',
      title: 'Rechazo en MetaMask',
      code: '4001',
      color: 'var(--warn)',
      body: 'Clicks en "Reject" en el pop-up. Ocurre ANTES de firmar, así que no existe transacción, no se paga gas y el balance queda igual. Es el error más común y es totalmente normal que pase.',
      lesson: 'Rechazar es seguro. No hay costo.',
    },
    {
      id: 'wrongnet',
      title: 'Red equivocada',
      code: '4902',
      color: 'var(--warn)',
      body: 'Intentás enviar en Ethereum mainnet cuando la dApp espera Monad Testnet (10143). MetaMask lo bloquea y te pide cambiar de red.',
      lesson: 'El chain ID tiene que coincidir con lo que espera la app.',
    },
    {
      id: 'noFunds',
      title: 'Sin fondos para el gas',
      code: '—',
      color: 'var(--err)',
      body: 'Querés enviar 0.1 MON con un balance de 0.05. El valor sí alcanzaría, pero el gas no. La transacción se rechaza.',
      lesson: 'El gas se cobra por aparte del valor. Necesitás un poco más de lo que enviás.',
    },
    {
      id: 'reverted',
      title: 'Ejecutada pero revertida',
      code: 'status: 0',
      color: 'var(--err)',
      body: 'La transacción sí entró en un bloque y se ejecutó, pero falló y el estado se revirtió. Cobrás el gas igual, porque la red hizo el trabajo.',
      lesson: 'Rechazo = no pasó nada. Revertida = pasó y falló. No son lo mismo.',
    },
  ]

  return (
    <>
      <div className="card">
        <div className="kicker">Paso 5 · Errores</div>
        <h2>No todas las operaciones terminan bien</h2>
        <p className="lead">
          Esta es la parte que casi nadie muestra y la que más se aprende. Cuatro
          escenarios reales de blockchain, y qué significan.
        </p>

        <div className="concepts">
          {cases.map((c) => (
            <div
              key={c.id}
              className={`concept${open === c.id ? ' open' : ''}`}
              onClick={() => setOpen(open === c.id ? null : c.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setOpen(open === c.id ? null : c.id)}
            >
              <div className="concept-term" style={{ color: c.color }}>
                {c.title}{' '}
                <span className="mono" style={{ color: 'var(--muted)', fontSize: 11 }}>
                  {c.code}
                </span>
              </div>
              <div className="concept-body">
                <p>{c.body}</p>
                <p style={{ color: 'var(--text)', marginBottom: 0 }}>
                  <strong>Qué aprender:</strong> {c.lesson}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="notice info">
          <strong>Probá el caso más importante</strong>
          En el paso anterior, cuando estés por firmar, rechazá el pop-up. Vas a
          ver exactamente el escenario de rechazo: el balance no se mueve, no hay
          hash, no hay gas pagado.
        </div>

        <div className="btn-row">
          <button className="btn ghost" onClick={onGo}>
            Volver al paso de envío
          </button>
        </div>
      </div>
    </>
  )
}

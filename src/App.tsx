import { useState } from 'react'
import './lab.css'
import { useWallet } from './lab/useWallet'
import { monadTestnet } from './lab/network'
import { IntroStep } from './steps/IntroStep'
import { ConnectStep } from './steps/ConnectStep'
import { FaucetStep } from './steps/FaucetStep'
import { AnatomyStep } from './steps/AnatomyStep'
import { SendStep } from './steps/SendStep'
import { ErrorStep } from './steps/ErrorStep'
import { UseCaseStep } from './steps/UseCaseStep'

const STEPS = [
  { id: 0, label: 'Conceptos', short: '0' },
  { id: 1, label: 'Conectar', short: '1' },
  { id: 2, label: 'Faucet', short: '2' },
  { id: 3, label: 'Anatomía', short: '3' },
  { id: 4, label: 'Enviar', short: '4' },
  { id: 5, label: 'Errores', short: '5' },
  { id: 6, label: 'Usos', short: '6' },
]

export default function App() {
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const wallet = useWallet()

  const go = (next: number) => {
    setStep(next)
    setMaxReached((m) => Math.max(m, next))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = () => go(Math.min(step + 1, STEPS.length - 1))
  const prev = () => go(Math.max(step - 1, 0))

  return (
    <div className="shell">
      <header className="masthead">
        <div className="brand">
          <span className="brand-dot" />
          Monad Lab
        </div>
        <span className="badge">Monad Testnet · chain 10143</span>
      </header>

      <nav className="stepper">
        {STEPS.map((s) => {
          const cls =
            s.id === step
              ? 'active'
              : s.id < maxReached
                ? 'done'
                : s.id > maxReached
                  ? 'locked'
                  : ''
          return (
            <button
              key={s.id}
              className={`step-chip ${cls}`}
              onClick={() => go(s.id)}
              title={s.label}
            >
              {s.short} {s.label}
            </button>
          )
        })}
      </nav>

      <main>
        {step === 0 && <IntroStep />}
        {step === 1 && <ConnectStep wallet={wallet} />}
        {step === 2 && <FaucetStep wallet={wallet} />}
        {step === 3 && <AnatomyStep />}
        {step === 4 && <SendStep wallet={wallet} />}
        {step === 5 && <ErrorStep onGo={() => go(4)} />}
        {step === 6 && <UseCaseStep />}
      </main>

      <div className="btn-row" style={{ marginTop: 24 }}>
        <button className="btn ghost" onClick={prev} disabled={step === 0}>
          ← Anterior
        </button>
        <button
          className="btn"
          onClick={next}
          disabled={step === STEPS.length - 1}
        >
          Siguiente paso →
        </button>
        <span className="muted small">
          Paso {step + 1} de {STEPS.length} · {STEPS[step].label}
        </span>
      </div>

      <footer className="footer-note">
        Laboratorio educativo construido sobre Monad Testnet. Leé la cadena
        directamente por JSON-RPC — RPC: <code>{monadTestnet.rpcUrls.default.http[0]}</code>.
        No hay backend: todo corre en tu navegador.
      </footer>
    </div>
  )
}

import { KV, Pipeline } from '../components/Lab'
import { monadTestnet } from '../lab/network'
import { formatMon } from '../lab/useWallet'
import type { WalletState } from '../lab/useWallet'

export function ConnectStep({ wallet }: { wallet: WalletState }) {
  const onTestnet = wallet.chainId === monadTestnet.id

  return (
    <>
      <div className="card">
        <div className="kicker">Paso 1 · Conexión</div>
        <h2>Conectá tu MetaMask</h2>
        <p className="lead">
          Conectar es solo <strong>pedir permiso para ver tus cuentas públicas</strong>.
          No se firma nada, no se mueve nada, no se paga nada.
        </p>

        <Pipeline activeIndex={1} doneIds={wallet.address ? ['dapp', 'wallet'] : []} />

        {!wallet.address ? (
          <>
            <div className="btn-row">
              <button
                className="btn"
                onClick={() => void wallet.connect()}
                disabled={wallet.isConnecting}
              >
                {wallet.isConnecting && <span className="spinner" />}
                Conectar MetaMask
              </button>
              {!wallet.providerReady && (
                <span className="muted small">
                  <span className="spinner" />
                  Esperando a MetaMask…
                </span>
              )}
            </div>

            {!wallet.providerReady && (
              <div className="notice warn">
                <strong>Todavía no veo tu wallet</strong>
                {wallet.diagnostics?.hint ??
                  'Buscando la extensión en esta ventana…'}
                <div className="small muted" style={{ marginTop: 8 }}>
                  ¿Estás seguro de estar en el mismo navegador y perfil donde
                  instalaste MetaMask? (Firefox y Chrome son perfiles separados.)
                </div>
              </div>
            )}

            {wallet.providerReady && !wallet.diagnostics?.isMetaMask && (
              <div className="notice warn">
                <strong>Encontré una wallet, pero no es MetaMask</strong>
                {wallet.diagnostics?.hint}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="notice ok">
              <strong>Wallet conectada</strong>
              Estás en la red correcta y podés consultar tu balance.
            </div>
            <KV
              items={[
                ['Dirección', <span key="a">{wallet.address}</span>],
                [
                  'Red',
                  onTestnet ? (
                    <span style={{ color: 'var(--ok)' }} key="n">
                      Monad Testnet (10143)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--err)' }} key="n">
                      Red equivocada ({wallet.chainId ?? '?'})
                    </span>
                  ),
                ],
                ['Balance', formatMon(wallet.balance)],
              ]}
            />
            {!onTestnet && (
              <div className="btn-row">
                <button className="btn" onClick={() => void wallet.switchToTestnet()}>
                  Cambiar a Monad Testnet
                </button>
              </div>
            )}
            <div className="btn-row">
              <button
                className="btn ghost small"
                onClick={() => void wallet.refreshBalance()}
              >
                Refrescar balance
              </button>
              <button className="btn ghost small" onClick={wallet.disconnect}>
                Desconectar
              </button>
            </div>
          </>
        )}

        {wallet.error && <div className="notice err">{wallet.error}</div>}
      </div>

      <div className="card">
        <div className="kicker">Por qué importa</div>
        <h2>Conectar NO es transaccionar</h2>
        <div className="concepts">
          <div className="concept open">
            <div className="concept-term">Conectar</div>
            <div className="concept-body">
              <code>eth_requestAccounts</code> — devuelve tu dirección pública.
              Es como un permiso de lectura de una app: reversible, gratis,
              instantáneo.
            </div>
          </div>
          <div className="concept">
            <div className="concept-term">Transaccionar</div>
            <div className="concept-body">
              <code>eth_sendTransaction</code> — sí mueve valor, sí paga gas, sí
              necesita confirmación. Esa todavía no ocurrió.
            </div>
          </div>
        </div>
        <div className="notice info">
          <strong>El dato clave</strong>
          Tu <em>dirección</em> es pública y se puede ver en cualquier explorer.
          Tu <em>clave privada</em> nunca sale de MetaMask. La dApp recibe tu
          dirección, nunca tu clave.
        </div>
      </div>
    </>
  )
}

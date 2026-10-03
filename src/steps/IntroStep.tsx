import { Concept } from '../components/Lab'

export function IntroStep() {
  return (
    <>
      <div className="card">
        <div className="kicker">Paso 0 · Conceptos</div>
        <h2>Qué es una blockchain</h2>
        <p className="lead">
          Una base de datos pública donde nadie es dueño y todos pueden verificarla.
          Cada transacción se agrupa en bloques que se encadenan. Si cambiás algo en
          un bloque anterior, hay que rehacer todos los siguientes. Por eso es
          inmutable.
        </p>

        <div className="concepts">
          <Concept term="Cadena de bloques">
            Cada bloque guarda el hash del anterior. Alterar el bloque 100 rompe el
            101, el 102… hasta el final. Todos lo notan.
          </Concept>
          <Concept term="Dirección">
            0x7A2F…9B1C. Es una identidad pública derivada de tu clave privada.
            No tiene balance por sí sola: es solo un identificador.
          </Concept>
          <Concept term="Wallet">
            La app que guarda tu clave privada. MetaMask es una wallet. Firmar es
            usar esa clave para autorizar una transacción.
          </Concept>
          <Concept term="Transacción">
            Una instrucción firmada: "mové 0.1 MON de mí a 0xABC…". Se ejecuta en
            la red, no en tu navegador.
          </Concept>
        </div>
      </div>

      <div className="card">
        <div className="kicker">Por qué Monad</div>
        <h2>Ethereum-compatible, pero más rápido y barato</h2>
        <p className="lead">
          Monad habla el mismo lenguaje y usa las mismas herramientas que Ethereum
          (Solidity, EVM). Si algo compila en Ethereum, compila en Monad. La
          diferencia es el rendimiento: más transacciones por segundo y costos muy
          bajos.
        </p>
        <div className="notice info">
          <strong>Traducción para quien empieza</strong>
          Monad no es una criptomoneda rara con su propio lenguaje. Es la misma
          infraestructura que ya conocés, optimizada. Eso lo hace ideal para
          aprender sin gastar plata real.
        </div>
      </div>

      <div className="card">
        <div className="kicker">Testnet</div>
        <h2>Es una red de mentira (pero que se comporta real)</h2>
        <p className="lead">
          Testnet es una red con las mismas reglas que la principal, pero su MON no
          vale nada. Todo lo que aprendas acá —gas, bloques, confirmaciones— es
          exactamente igual que en mainnet.
        </p>
        <KVish
          rows={[
            ['Red', 'Monad Testnet'],
            ['Chain ID', '10143'],
            ['RPC', 'https://testnet-rpc.monad.xyz'],
            ['Moneda', 'MON (de prueba)'],
            ['Explorer', 'https://testnet.monadvision.com'],
          ]}
        />
        <div className="notice warn small">
          El <strong>chain ID</strong> es el DNI de la red: es lo que le dice a tu
          wallet con qué blockchain está hablando. Si la app dice una cosa y
          MetaMask está en otra, la operación falla.
        </div>
      </div>
    </>
  )
}

function KVish({ rows }: { rows: string[][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

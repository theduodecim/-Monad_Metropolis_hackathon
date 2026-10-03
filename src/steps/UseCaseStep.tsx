const USECASES = [
  {
    emoji: '💸',
    title: 'Pagos',
    body: 'Transferencias globales sin intermediario. Barato y rápido incluso entre países.',
  },
  {
    emoji: '🪙',
    title: 'Tokens',
    body: 'Activos que viven en la cadena. Se pueden crear y mover con una transacción.',
  },
  {
    emoji: '🖼️',
    title: 'NFTs',
    body: 'Propiedad verificable de un item digital. Un contrato registra quién es dueño.',
  },
  {
    emoji: '🎮',
    title: 'Gaming',
    body: 'Items y monedas de juego que existen de verdad y se pueden shincanear.',
  },
  {
    emoji: '📈',
    title: 'DeFi',
    body: 'Intercambiar, prestar y prestar activos sin pasar por un banco.',
  },
  {
    emoji: '✅',
    title: 'Trazabilidad',
    body: 'Historial inmutable. Nadie puede borrar un registro que ya ocurrió.',
  },
]

export function UseCaseStep() {
  return (
    <>
      <div className="card">
        <div className="kicker">Paso 6 · Para qué sirve</div>
        <h2>¿Y esto para qué está?</h2>
        <p className="lead">
          Todo lo que acabás de hacer —conectar, firmar, mandar, verificar— es la
          misma base que usa cualquiera de estas aplicaciones.
        </p>

        <div className="usecases">
          {USECASES.map((u) => (
            <div key={u.title} className="usecase">
              <div className="usecase-emoji">{u.emoji}</div>
              <div className="usecase-title">{u.title}</div>
              <div className="usecase-body">{u.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="kicker">Lo que aprendiste</div>
        <h2>Recap</h2>
        <div className="notice ok">
          <strong>Hiciste, observaste, entendiste</strong>
          Conectaste una wallet y entendiste que conectar no es transaccionar.
          Trajiste tokens y descubriste que tu balance es el resultado de
          transacciones, no un número guardado. Analizaste una transacción
          leyendo el RPC crudo. Mandaste MON y viste el fee salir de tu balance.
          Y viste que las operaciones fallan.
        </div>
        <div className="notice info">
          <strong>Siguiente paso natural</strong>
          Escribir un smart contract en Solidity y desplegarlo en Monad Testnet.
          Con esto ya entendés la capa que está debajo.
        </div>
        <div className="btn-row">
          <a
            className="btn ghost"
            href="https://docs.monad.xyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs de Monad ↗
          </a>
          <a
            className="btn ghost"
            href="https://testnet.monadvision.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            MonadVision ↗
          </a>
        </div>
      </div>
    </>
  )
}

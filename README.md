# Monad Lab

An interactive, step-by-step **blockchain laboratory** built on **Monad Testnet** with **MetaMask**.
Not a wallet dashboard — a lab where you perform real testnet operations and see what happened underneath.

## Why this exists

Most blockchain demos show you a result. This one shows you the *mechanism*.

Every "what really happened" panel in this app reads directly from the chain over JSON-RPC
(`eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_getBlockNumber`).
The explorer is only ever linked for further inspection, never used as the data source.

## The flow

| Step | What you do | What you learn |
|------|-------------|----------------|
| 0 | Read the concepts | What a blockchain is, wallet vs address vs transaction, why Monad, what testnet means |
| 1 | Connect MetaMask | Connecting is *not* transacting — `eth_requestAccounts` only reads your public address |
| 2 | Get testnet MON | Your balance is not a stored number, it's the result of recorded transactions |
| 3 | Paste a tx hash | Anatomy of a transaction: nonce, gas limit vs gas used, block, confirmations, fee |
| 4 | Send MON | The full pipeline, live: `dApp → MetaMask → sign → RPC → Monad → block → confirm` |
| 5 | Break things on purpose | Four real failure modes, and why rejection is not the same as revert |
| 6 | See use cases | What this enables: payments, tokens, NFTs, gaming, DeFi, traceability |

## Tech decisions

- **React + TypeScript + Vite** — small, fast, zero-config deploy.
- **viem directly, no wagmi.** Deliberate. With wagmi the signing flow is a black box.
  Using viem directly makes `eth_requestAccounts → eth_sendTransaction → eth_getTransactionReceipt`
  explicit in the code, which is the exact journey the user is meant to understand.
- **No backend, no database.** Everything runs in the browser. Deployable anywhere in one command.

## Network

| | |
|---|---|
| Network | Monad Testnet |
| Chain ID | `10143` (`0x279f`) |
| RPC | `https://testnet-rpc.monad.xyz` |
| Currency | MON (test) |
| Explorer | `https://testnet.monadvision.com` |
| Faucet | `https://faucet.monad.xyz` |

## Run it

```bash
npm install
npm run dev
```

You need the MetaMask extension, switched to Monad Testnet.
If MetaMask doesn't know the network, the app offers to add it (`wallet_addEthereumChain`).

## Try the failure path

Go to step 4, click **Firmar y enviar**, then **Reject** in the MetaMask popup.
You'll see error code `4001`: no hash, no gas paid, balance untouched.
That distinction — *rejected* (nothing happened) vs *reverted* (happened and failed, gas charged) —
is the single most valuable thing in this lab.

## Build

```bash
npm run build
```

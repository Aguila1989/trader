# `src/chains/hyperliquid` — the Hyperliquid ChainAdapter (Phase 2c)

Status: **built, unit-tested, NOT wired into the app and NOT verified against
the real Hyperliquid API.** `hyperliquidAdapter` (adapter.ts) is a thin facade
over the real `./info` (reads) and `./exchange` (writes) sibling modules —
mirroring how `src/chains/stellar/adapter.ts` is a thin facade over
`src/stellar/*`. It is not imported by `src/chains/registry.ts` yet (see
"Integration TODO" below) and `TradeProposal` has no `chain` field for the
orchestrator to route on, so nothing in the running app can reach this code
today.

## What this file owns vs. what it delegates to

| Concern | Lives in |
|---|---|
| Wire shapes, HTTP, retries, msgpack/EIP-712 signing | `./info.ts`, `./exchange.ts`, `./eip712.ts`, `./crypto.ts`, `./http.ts` (NOT owned by this adapter) |
| Asset-ref parsing/routing (`hyperliquid:BTC` etc.), the custodial-key resolve/decrypt, the preflight gate, and adapting the above onto the chain-neutral `ChainAdapter` shapes | `adapter.ts` (this file) |

## Design decisions worth knowing

- **Markets are USDC-quoted only.** `getMarketSnapshot`'s `quote` argument
  must resolve to `"USDC"` (bare) or `"hyperliquid:USDC"`, or the call throws.
  Perp positions aren't "held asset units" the way a Stellar balance is —
  `getBalances` reports withdrawable USDC plus each open position's signed
  size as a best-effort analogue, not a literal spot balance.
- **No tx hash.** The durable `handle` persisted before `submit()` is a
  **client order id (`cloid`)**, a fresh 16-byte hex value generated in
  `prepareOrder`/`prepareModify`.
- **`sign()` does no cryptographic work.** Hyperliquid's real L1-action
  signing is fused with the network POST inside `./exchange.ts`'s
  `placeOrders`/`cancelOrders`/`modifyOrders` — each mints a **fresh nonce**
  (`Date.now()`) right at the HTTP call, because a stale nonce can fail
  Hyperliquid's replay-window check. A signature literally cannot be
  precomputed in a separate step and reused later. The crash-recovery
  invariant `sign()` exists for only needs a durable id to exist and be
  **persisted before any network call** — and the cloid already satisfies that
  from `prepareOrder()`/`prepareModify()` onward. So `sign()` just confirms and
  returns it; the actual decrypt + sign + POST all happen together inside
  `submit()`. This is a deliberate, documented deviation from the letter of
  the `ChainAdapter.sign()` doc comment ("signs in place") while preserving
  its actual purpose (the crash-recovery ordering guarantee).
- **Custodial key only.** The operator's secp256k1 private key is stored
  AES-256-GCM at rest in `dbo.Wallets` (`chain='hyperliquid'`), decrypted only
  for the duration of the `submit()` call that needs it, zeroed immediately
  after (the `Buffer` — a derived hex `string` can't be zeroed in JS; same
  limitation any string-typed secret has here). Reuses
  `src/crypto/secretBox.ts`'s default `"wallet-seed"` purpose — no new
  `SecretPurpose` needed, since it's structurally the same thing ("a wallet
  secret at rest for this user"). A `HYPERLIQUID_PRIVATE_KEY` env var mirrors
  `config.stellarSecret`: it's the **DEFAULT account fallback only** (single-
  operator/background-loop convenience), never used for a logged-in user.
  Non-custodial (client-signed) Hyperliquid wallets aren't built — `submit()`
  throws `NotSupportedOnChainError` if the active wallet has no encrypted
  secret.
- **`bookLevels()` needs no asymmetric conversion.** Unlike Horizon (Stellar),
  where bid amounts are in the counter asset and asks in the base asset,
  Hyperliquid's L2 book gives **both** sides in base-asset size units already.

## Config keys (add to `src/config.ts` — see the orchestrator's integrationSpec)

| Key | Env var | Purpose |
|---|---|---|
| `config.hyperliquidApiUrl` | `HYPERLIQUID_API_URL` | Optional override of the REST host. Blank = derive from `config.network` (`testnet` → `api.hyperliquid-testnet.xyz`, `public` → `api.hyperliquid.xyz`). |
| `config.hyperliquidPrivateKey` | `HYPERLIQUID_PRIVATE_KEY` | Hex secp256k1 key for the **default account** fallback only (mirrors `STELLAR_SECRET`). Optional — the custodial `dbo.Wallets` flow is the real path for a logged-in user. |

## What's verified vs `TODO(hl-verify)`

Nothing here has been exercised against the real Hyperliquid API (mainnet or
testnet) — every wire shape is sourced from public docs and from the sibling
`./info.ts`/`./exchange.ts` authors' own best-effort reading of them. Grep this
adapter and its siblings for `TODO(hl-verify)` for the full list; the ones that
matter most before any real order goes out:

1. **The `$10` minimum order notional** (`MIN_NOTIONAL_USD` in adapter.ts) —
   confirm the current figure and whether it varies by market.
2. **Fee tiers** (`estimateFee`) — maker/taker bps are a base-tier guess, not
   read from a live account/tier.
3. **The `oid`-only cancel/modify path** — `prepareCancel`/`prepareModify`
   assume `orderId` is always the numeric exchange `oid` (as returned by
   `getOpenOrders`); there is no cancel-by-`cloid` path.
4. **The explorer URL** (`explorerAccountUrl`) — path guessed, not confirmed.
5. **`recentTrades`/`flowBuyPct`** are always empty/null — `./info.ts`'s
   current contract has no trades feed to source them from.
6. Everything inside `./info.ts`/`./exchange.ts`/`./eip712.ts`/`./crypto.ts`
   themselves (wire field names, the msgpack encoding, the EIP-712 domain,
   the action-hash byte layout) — see their own file headers for their
   `TODO(hl-verify)` markers.

## ⚠️ Known integration bug in the sibling modules (not fixed here — out of this file's ownership)

`./exchange.ts` imports `signL1Action`/`privateKeyToAddress` from `./crypto`
(see its own header comment, which documents this as the agreed contract) —
but as of this build, **`signL1Action` actually lives in `./eip712.ts`**, not
`./crypto.ts` (`./crypto.ts` only exports the lower-level `sign`/`keccak256`/
`privateKeyToAddress`/hex-utility primitives). `npx tsc --noEmit` currently
fails on `exchange.ts(34,10)`: `Module "./crypto" has no exported member
'signL1Action'`. This adapter does **not** import `./crypto` or `./eip712`
directly at all (it goes through `./exchange`'s `signerAddress` re-export
instead), so it is unaffected either way — but the whole `hyperliquid/`
module will not typecheck until whoever owns `crypto.ts`/`exchange.ts`
reconciles this (most likely: re-export `signL1Action` from `./crypto.ts`, or
fix `exchange.ts`'s import to `"./eip712"`).

## Testnet checklist (Kevin's Phase 2a spike)

Do this on **Hyperliquid testnet only**, in order, before trusting any of the
above against real money:

1. **Wallet setup**: register a testnet EVM keypair, fund it with testnet
   USDC (Hyperliquid's testnet faucet), and store its private key either via
   `HYPERLIQUID_PRIVATE_KEY` (quick spike) or a real `dbo.Wallets` row
   (`chain='hyperliquid'`, AES-256-GCM `encryptedSecret`).
2. **Build**: call `hyperliquidAdapter.prepareOrder(proposal)` for a small,
   liquid market (e.g. BTC) with a **postOnly** limit far from the touch (so
   it rests, not fills) — confirm the resulting payload's `order.assetIndex`
   matches the coin's real position in `getMeta()`'s universe, and `size` is
   correctly rounded to `szDecimals`.
3. **Sign**: call `.sign(prepared)` — confirm `handle` is a well-formed
   `0x`-prefixed 32-hex-char cloid, and that this step makes **no** network
   call (check `./http.ts`'s fetch isn't hit).
4. **Persist**: confirm the caller (once wired into the orchestrator) durably
   records `handle` before calling `submit()`.
5. **Place**: call `.submit(signed)` — confirm the order actually appears
   resting on Hyperliquid's testnet UI/API at the expected price/size, and
   that the returned `OrderReceipt.fill` matches (`filledBase: 0`,
   `restingOrderId` set).
6. **Read-back**: call `.getOpenOrders(address)` — confirm the resting order
   shows up with the right `id` (should equal the `restingOrderId` above),
   `price`, `amount`.
7. **Cancel**: call `.prepareCancel(proposal, thatOrderId)` → `.sign()` →
   `.submit()` — confirm it disappears from `.getOpenOrders()` afterward.
8. **Fill**: repeat step 2 with a **crossing** (non-postOnly) limit so it
   actually fills — confirm `OrderReceipt.fill.filledBase`/`avgPrice` match
   what testnet actually executed, and `.getBalances(address)`/
   `.probeAccount(address)` reflect the new position/withdrawable margin.
9. Only after all seven steps read sanely: repeat once with a **modify**
   (`.prepareModify` on a still-resting order) before considering this
   adapter fit to wire into the orchestrator for real.

## Integration TODO (future phases, not done by Phase 2c)

- Add `hyperliquidAdapter` to `src/chains/registry.ts`'s `adapters` map (see
  this build's `integrationSpec` for the exact lines).
- `TradeProposal` has no `chain` field — the orchestrator needs one before it
  can route a proposal to this adapter at all.
- `config.chains` (the wallet-level `CHAINS=stellar,solana` allowlist) is a
  separate concept from trading-chain registration; deciding whether/how
  Hyperliquid wallets show up there is a follow-up, not assumed here.
- Sub-account/vault trading (`vaultAddress`) is unimplemented — every call
  trades on the signer's own account.

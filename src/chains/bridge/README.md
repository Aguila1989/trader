# Cross-chain "Convert" — design (NOT implemented)

Goal: let a user trade a token on one chain for a token on another (e.g.
XLM → SOL). **No atomic cross-chain trade exists anywhere** — every product
that offers one is either a custodial exchange (internal ledger) or composes
legs. Atrium is non-custodial, so we compose, with the user signing each leg:

```
XLM → SOL  =  ① DEX-swap XLM→USDC on Stellar        (existing swap path, user signs)
              ② bridge USDC Stellar→Solana           (BridgeProvider, user signs burn + mint)
              ③ DEX-swap USDC→SOL on Solana          (Jupiter, user signs)
```

**Safety invariant:** every intermediate state rests as REAL Circle USDC on a
real chain — resumable or keepable ("stranded-safe"), never wrapped, never in a
third-party pool, never lost. `types.ts` encodes this as the transfer state
machine (`pending → burned → attested → minted → done | stranded`).

## Provider choice (verified by web research, 2026-07-23 — re-verify at build time)

| Route | Verdict |
|---|---|
| **Circle CCTP V2** | **Chosen.** Native burn-and-mint of real USDC; live on Stellar since May 2026, on Solana for years. No pool to drain; trust = Circle (already the app's USDC issuer). Standard transfer: $0 fee, finality-bound. Fast transfer: ~8–20s, 0–14 bps. REST attestation API (`iris-api.circle.com`), fits client-signs-each-leg exactly. |
| Rango (aggregator) | Conflicting evidence on Stellar support (one source: full incl. trustline handling + base64 XDR; another: not listed). Candidate for one-click UX later — verify directly first. |
| Squid / Axelar | Stellar leg only ~2 months old (Axelar Stellar ITS, and Axelar-Solana went live 2026-06). Too new for real funds; watch. |
| Allbridge Core | **Avoid.** Pooled AMM bridge, flash-loan exploited TWICE — Apr 2023 ($570k) and **2026-07-20 ($1.65M, Solana pools)** — paused at research time. |
| THORChain / Chainflip / LI.FI / deBridge / Across / 1inch Fusion+ | No Stellar support. (THORWallet's "Stellar swaps" are NEAR Intents — a per-swap deposit-address/solver model, i.e. a custodial hop; not for us.) |

## Product constraints (why this is phase-2, and manual-first)

- **Manual-first:** non-custodial means the USER signs legs ①–③ on their
  device. The AI autopilot cannot hop chains without per-leg approval — by
  design. UX = a "Convert across chains" wizard with a live state tracker.
- **Prereqs before any code:** the Solana adapter needs its trading leg
  (Jupiter) and client-side tx signing first (see ../solana/README.md); a
  persisted `BridgeTransfer` table + resume UI; and the bridge-risk story needs
  its own legal look (bridges are the most-exploited component in crypto —
  disclosure at minimum). Fees/PnL accounting must first move off
  XLM-as-the-unit to USDC (settlement-unit generalization).
- **Failure UX:** a flow that stops after ② leaves the user holding USDC on the
  destination chain — always offer "resume leg ③" and "keep as USDC" (both
  legitimate outcomes), plus "refund path" from the `fundsRestOn` anchor.

## Where it plugs in

`CrossChainSwapService` (future) composes `adapterFor(from)` + a
`BridgeProvider` + `adapterFor(to)` — the ChainAdapter seam stays untouched.
Server builds every unsigned payload (mirroring `/api/pay/build`), the client
validates + signs (mirroring `web/src/wallet/signing.ts`'s allowlist model),
the server relays + tracks state (mirroring `/api/submit` + the monitor).

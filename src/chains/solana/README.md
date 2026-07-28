# Solana chain module

## Status: wallet-level support only (multi-chain P0)

Implemented and live behind `CHAINS=stellar,solana`:
- **Address validation** — base58 of a 32-byte ed25519 public key (`base58.ts`).
- **Account probing** — native lamports + SPL token balances (classic +
  Token-2022) via plain JSON-RPC `fetch` (`rpc.ts`); drives funded-ness display
  and the remove-chain zero-funds gate.
- **Per-user wallet** — non-custodial ONLY: the key is generated in the browser
  (`web/src/wallet/solanaKey.ts`, reusing @stellar/stellar-base's ed25519 —
  same curve), encrypted with the user's passphrase into IndexedDB, and the
  server stores just the base58 address (`dbo.Wallets`, `encryptedSecret NULL`,
  `chain='solana'`).
- **Receive** — per-chain address + QR on the Receive page.

Everything trading-shaped throws `NotSupportedOnChainError` (`adapter.ts`).

## Trading integration plan (NOT built — do not start before the strategy
## question in the vault's multichain decision note is settled)

1. **Taker flow first (Jupiter).** Quote + swap via Jupiter's REST API
   (`/quote`, `/swap` returning an unsigned versioned transaction), client-side
   signing mirroring the Stellar build→review→sign→submit flow. This gives
   manual swaps + the cross-chain Convert leg (see ../bridge/README.md) without
   any maker infrastructure.
2. **Maker/CLOB later, if ever.** Solana's real liquidity is AMM-dominated;
   its CLOBs (Phoenix — team pivoted to perps; OpenBook v2) are a small niche.
   The maker/spread-capture strategy this bot runs on Stellar's SDEX should be
   validated on a busier CLOB (research pointed at Hyperliquid) before building
   a Solana maker leg. Treat `prepareOrder/prepareCancel/prepareModify` as the
   seam a Phoenix/OpenBook integration would fill.
3. **Per-token decimals from the mint** (`getMint` / token metadata) — replace
   `defaultDecimals("solana")`'s placeholder 9 with real per-asset values the
   moment any non-SOL asset is priced or traded.
4. **Fee model:** base fee per signature (~5000 lamports) + compute-unit
   priority fees that spike ~100× under congestion (memecoin waves). Any
   trading leg needs priority-fee bidding + landing verification (blockhash
   expiry ≈ ~60–90s) — the `estimateFee()` stub documents the shape.
5. **Submission/reconciliation:** `sendTransaction` + confirmation polling by
   signature with an expiry-aware retry (mirrors the Horizon 504-poll pattern);
   fills read back from parsed transaction meta (pre/post token balances).

## Config

- `CHAINS=stellar,solana` — offers Solana wallets to users.
- `SOLANA_RPC_URL` — private/paid RPC endpoint; blank = the public cluster URL
  (`api.devnet.solana.com` for testnet config, `api.mainnet-beta.solana.com`
  for public). Public endpoints are rate-limited: set this before enabling
  Solana for real users.
- Network mapping follows the app's Stellar convention: `NETWORK=public` →
  mainnet-beta, anything else → devnet.

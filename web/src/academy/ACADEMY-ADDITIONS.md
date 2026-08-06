# Academy additions — Chapter 40 (Market Structure)

## What was added

One new chapter, in all four locales, at **`c40` / number 40** (the next free
slot — `chapter39` in every locale was already taken by the existing "Setting
Up AI Trading" chapter, so this work could not use 39 as the task brief
assumed):

- `web/src/academy/content/en/chapter40.ts`
- `web/src/academy/content/nl/chapter40.ts`
- `web/src/academy/content/fr/chapter40.ts`
- `web/src/academy/content/es/chapter40.ts`

**Title:** "Market Structure: Order Books, AMMs, and Execution Cost"
**Level:** `ADVANCED`
**Lessons (5) + quiz (5 questions):**

1. Order books (CLOB) vs AMMs — two ways any market matches trades.
2. Makers vs takers — who supplies liquidity, who pays for consuming it,
   maker rebates.
3. Spread and slippage — the two costs hidden in every trade.
4. Perpetual futures and funding rates, as general concepts.
5. Why execution cost decides whether a thin statistical edge survives —
   ties the whole chapter together (mid-price edge vs net-of-cost edge).

## Public-scope rule followed

The Academy ships to every product user, not just the personal build, so this
chapter teaches **only general crypto/market-structure concepts** that apply
to any exchange or venue:

- No mention of single-user or personal mode, custodial autonomous operation,
  "our Hyperliquid engine," admin/ops tooling, or any operator-only feature.
- Perpetual futures and funding rates are taught as **industry-standard
  concepts** (what they are, why funding exists, which way it flows) — never
  tied to a specific provider or to any internal execution engine.
- Order-book vs AMM and maker/taker content deliberately stays venue-neutral
  (examples use a generic "ETH/USDC" pair, not the app's own Stellar SDEX/AMM
  mechanics) so it does not overlap with or contradict the existing
  Stellar-specific coverage already in chapters 12/12-ext/32/35 (which do
  correctly go into Stellar's own SDEX, path payments, and 0.30% pool fee).
- Nothing here references the app itself, its UI, its fee tiers, or any
  account state — it is pure, standalone market education, consistent with
  the rest of the Academy's non-account-gated chapters.

## Registration (NOT applied by this task — see integrationSpec)

`web/src/academy/content.ts` is the shared registry (not owned by this task).
It needs four new imports and four array-append edits, mirroring exactly how
`chapter38`/`chapter39` were wired in. See the orchestrator's
`integrationSpec.otherSharedEdits` for the exact lines.

## Verification performed

- `npx vue-tsc -b --force` from `web/`, exit code 0, no output — the whole
  Vue project (including all four new `chapter40.ts` files, matched against
  the `Chapter` interface in `web/src/academy/types.ts`) type-checks cleanly.
- Did not run `npm run dev`/`npm start`/any script that boots a server, per
  the task's absolute rules.
- The new files are not yet reachable from the app (registry not updated),
  so no runtime/browser check was possible or attempted from this task; the
  orchestrator applying `integrationSpec` will make chapter 40 live.

## Remaining public-scope lessons from DEPLOY.md section D (still unwritten)

To-do for a future Academy batch — all public-scope, none require touching
gated/account content:

- [ ] Risk disclaimer (a plain-language lesson: crypto trading risk, "this is
      not financial advice", volatility, total-loss possibility).
- [ ] Key ownership / non-custodial basics (what "your keys, your crypto"
      means in general — generic education, not this app's own wallet
      implementation details).
- [ ] Fees & slippage as a dedicated beginner-facing lesson (this chapter
      covers spread/slippage at ADVANCED level; a plainer BASIC-level pass
      aimed at brand-new users may still be worth adding separately).
- [ ] Memo/destination-tag sends — why some chains require a memo/tag on
      deposits and what happens if you omit one (general, not Stellar-only).
- [ ] 2FA — general account-security education (authenticator apps, backup
      codes, why SMS 2FA is weaker) — public-scope, not tied to this app's
      own 2FA implementation.

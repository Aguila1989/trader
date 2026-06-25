import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Protecting Your Assets",
  description: "The real security risks in crypto and how this bot guards against them, from server-side key handling to the authoritative balance pre-check.",
  lessons: [
    {
      id: "c13-l1",
      title: "The biggest security risks in crypto — keys, phishing, fake apps",
      paragraphs: [
        "Every security risk in crypto inherits one property: finality. When a Stellar transaction is included in a ledger, it is irreversible. There is no chargeback, no bank, no support desk that can claw funds back. Most other risks are simply this one amplified by a mistake, so the right model is not how do I undo damage but how do I block bad actions before they reach the chain.",
        "A Stellar account is defined by a keypair. The public key starts with G and is safe to share; it is the address others pay you at. The secret key starts with S and grants total control. Whoever holds the S-key can sign transactions and move every asset in the account, with no second password layered on top. A leaked secret key is therefore not a partial breach. It is full custody, transferred to the attacker.",
        "The threat list is short and concrete. A leaked secret key gives an attacker everything. Phishing and fake sites or apps trick you into handing the key over yourself. Signing a malicious transaction authorises a transfer you never intended. Sending to the wrong address moves funds to a stranger permanently. And trusting a fake token or issuer leaves you holding something worthless that merely resembles the real asset.",
        "Notice that most of these are human errors, not exotic exploits. They succeed because irreversibility removes the safety net that other financial systems rely on. The defence is layered and boring: keep the key where attackers cannot reach it, verify every destination, distrust unsolicited contact, and let automated guards refuse doomed or unfunded operations. This bot is built around exactly that posture, and the rest of this chapter shows the specific mechanisms.",
      ],
      example: "You copy a destination address from your clipboard, but clipboard-hijacking malware silently replaced it with the attacker address. You confirm. The asset lands in their account within seconds and cannot be recovered. Comparing the first four and last four characters of the address against the source you trust would have caught the swap before signing.",
    },
    {
      id: "c13-l2",
      title: "How to recognise a scam — red flags and examples",
      paragraphs: [
        "Phishing is impersonation engineered to make you act before you think. The attacker reconstructs a wallet, exchange, or support team convincingly, then manufactures a reason to hurry: a security warning, a closing airdrop window, a login page that looks pixel-perfect. The goal is almost always the same — get you to reveal your secret key or seed phrase, or sign a transaction you do not understand.",
        "One rule defeats most of it: a legitimate app never needs your secret key or recovery phrase. Your key signs locally; no real service asks you to type, paste, email, or DM a string beginning with S. Treat any such request as definitive proof of a scam, regardless of how official the branding looks.",
        "Learn the secondary tells so you catch the cleverer attempts. Support that messages you first is a red flag, because real support waits for you to open a ticket. Guaranteed or too-good returns are bait. Look-alike domains substitute or double letters and add reassuring words like secure or verify. Urgency and countdowns exist to suppress your judgement. And unsolicited airdrops or trustline spam are designed to lure you into interacting with a malicious issuer, which is why this bot trades only a whitelist of vetted assets rather than anything that appears in your account.",
        "Your habit, not your cleverness, is the defence. Slow down, type known domains yourself instead of following links, and verify the exact address character by character. When something pressures you to skip those steps, that pressure is itself the signal.",
      ],
      example: "A direct message arrives unprompted: Stellar Support here, your wallet was flagged for suspicious activity, restore access within one hour at stellar-wallett-verify.com and confirm your seed phrase. Three tells stack up — support contacting you first, the doubled t look-alike domain, and a request for your seed phrase under a one-hour countdown. A real provider would do none of these, and never needs your secret key.",
    },
    {
      id: "c13-l3",
      title: "Signing keys, why they never leave the device, and how this app handles them",
      paragraphs: [
        "The reason a secret key must never leave a trusted device is structural: on Stellar there is no recovery flow and no separate account password. Possession of the S-key is authority. A key that travels through a browser form, a chat message, a screenshot, or a shared file has, for security purposes, already been disclosed, because you can no longer prove it was not captured in transit.",
        "This app is architected so the key stays on the server and nowhere else. The secret is supplied only as a server-side environment variable, STELLAR_SECRET, read once at startup. The browser frontend never receives it, never stores it, and never transmits it. Every signing operation happens in the backend signer, so the key material never crosses the network to the client. The frontend only ever sends an instruction to trade; it cannot itself sign anything.",
        "Authority is then gated by mode. With no secret configured the app evaluates to read-only, so it can watch and plan but cannot submit on-chain. Even with a key present it boots read-only by default — the auto-arm flag is off — and Live trading must be deliberately armed and additionally requires the position monitor to be running before a real submit can occur. Paper trading needs no key at all, since fills are simulated. A Kill switch sits over all of this and blocks every trade instantly.",
        "If the secret is ever exposed, treat it as an active incident, not a worry. Public repositories and pasted snippets are scanned by bots within minutes, and disclosure equals theft once an attacker signs first. The correct response is rotation: create a fresh keypair, move all funds to it, retire the old account, and replace STELLAR_SECRET. Rotation costs a transaction fee; recovery after a drain costs everything.",
      ],
      example: "A teammate pastes the production config, secret key included, into a public issue tracker for eight minutes before deleting it. Eight minutes is plenty — automated scanners watch public sources continuously. Deleting the post does not undo the exposure. The only safe move is to immediately rotate STELLAR_SECRET to a new keypair and sweep the balance across before an attacker signs.",
    },
    {
      id: "c13-l4",
      title: "The balance pre-check — how the frontend and backend protect you",
      paragraphs: [
        "Before any real trade is signed, the bot runs a balance pre-check, called preflight. It answers a single question — would this transaction actually settle, and leave the account healthy? Only an all-clear lets the bot proceed to sign. Any failure produces a clean block with a machine-readable reason code rather than a doomed submission, and crucially the block happens before signing, so a guaranteed on-chain failure such as op_underfunded or op_no_trust never burns a network fee.",
        "Protection starts in the frontend as a fast first filter. The manual order form lets you sell only assets you actually hold, via a held-only dropdown, shows your available balance inline, and disables or flags the order when the amount exceeds what you have. That catches the obvious mistake at the keyboard, before any request leaves the browser. But the frontend is convenience, not authority — it can be bypassed, so it is never the last word.",
        "The backend check in src/stellar/preflight.ts is authoritative and runs regardless of what the frontend believed. It confirms the public key is configured, that the account exists and is funded on the correct network, and that a trustline exists for the asset the trade would RECEIVE, since Stellar cannot accept an asset you have not explicitly trusted. Then it computes spendable balance, not raw balance. Spendable equals the balance minus amounts locked in your open offers (selling_liabilities), minus the XLM base reserve of (2 + subentry_count) x 0.5 XLM, minus a roughly 0.05 XLM fee buffer.",
        "On failure it returns a structured block carrying a reason code — no_public, account, no_trustline, or insufficient_balance — together with the required-versus-available amounts so the cause is unambiguous. For AI or system-initiated trades it goes one step further and arms a five-minute insufficient-balance cooldown for that pair and side, so the same unfundable proposal is not re-raised while you top up. This is a coarse time gate, so depositing the missing asset mid-cooldown does not lift it early.",
      ],
      example: "An AI buy would spend nearly your whole XLM holding. Preflight subtracts the XLM locked in an existing open offer, the (2 + subentry_count) x 0.5 reserve, and the fee buffer, finds spendable falls short of the cost, and returns insufficient_balance with required-versus-available figures. No transaction is signed, so no fee is wasted, and the pair plus side is parked under a five-minute cooldown instead of being re-proposed every scan.",
    },
    {
      id: "c13-l5",
      title: "Best practices for safe trading with this app — a checklist",
      paragraphs: [
        "Begin where mistakes are free, then earn your way up. Run first on Stellar testnet with a throwaway hot wallet, and use Paper mode, which simulates fills and needs no key, to confirm the strategy behaves before any mainnet value is at stake. Keep early position sizes small and attach trailing stops, so the price of learning is paid in lessons rather than capital.",
        "Guard the key as the single point of total authority. Keep STELLAR_SECRET offline and server-side, never paste it into a website or chat, and never let it reach a screenshot, log, or repository. Stay in Read-only or Paper mode until you have genuinely decided to go live, arm Live trading deliberately rather than by habit, and confirm the position monitor is running so stops and exits are actually enforced. Keep the Kill switch within reach for an instant full stop.",
        "Let the structural guards do their job, and respect their refusals. Trade only whitelisted tokens so you never interact with a fake or hostile issuer. Trust the preflight block — when it reports no_trustline or insufficient_balance, the fix is to establish the trustline or fund the account, not to override the check. Double-check every destination address and send a tiny test amount first when sending somewhere new, because irreversibility means there is no second chance.",
        "Finally, build a verification loop into routine. Watch the AI log to understand why trades are proposed, accepted, or blocked, so a misconfiguration surfaces as a pattern rather than a surprise loss. And if a key is ever exposed in any form, stop trading, rotate to a fresh keypair, and sweep the funds across immediately. Security here is mostly disciplined habit applied consistently, backed by guards that fail closed.",
      ],
      example: "A sound first week: practise in Paper mode on testnet with a disposable wallet, set conservative per-trade sizing and a tight token whitelist, then arm Live trading with a tiny mainnet balance, the position monitor running and the Kill switch one click away. You watch the AI log each session and keep STELLAR_SECRET strictly server-side, so you learn the system's edges without risking anything you would mind losing.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Why does irreversibility make crypto risks like a wrong address or a leaked key so severe?",
      options: [
        { text: "Because reversing a confirmed transaction costs a high network fee.", explanation: "Incorrect. Reversal is not a pricey option, it is simply impossible once the transaction is in a ledger; the fee is irrelevant." },
        { text: "Once a transaction is in a ledger it cannot be reversed, so a wrong address or a signed scam is permanent and theft via a leaked key is final.", explanation: "Correct. Stellar has no chargeback or undo, so ordinary mistakes and key leaks become permanent losses, which is why prevention matters more than recovery." },
        { text: "Because volatile prices make it impossible to value the loss.", explanation: "Incorrect. Price volatility is a separate concern; the core danger is that the transfer itself cannot be undone regardless of price." },
        { text: "Because funds take several days to settle, leaving a long exposure window.", explanation: "Incorrect. Stellar settles in seconds, and fast settlement actually makes irreversibility bite sooner rather than later." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q2",
      prompt: "Which is the single strongest sign that a message is a phishing or scam attempt?",
      options: [
        { text: "It asks you to enter, paste, or confirm your secret key or seed phrase.", explanation: "Correct. A legitimate app never needs your secret key or recovery phrase, so any request for it is definitive proof of a scam regardless of branding." },
        { text: "It mentions Stellar or your wallet by name.", explanation: "Incorrect. Real services also name the platform, so that detail alone proves nothing." },
        { text: "It contains a clickable link.", explanation: "Incorrect. Links are common and not inherently malicious; the request for your key is the real giveaway, though you should still verify domains yourself." },
        { text: "It arrives late at night or on a weekend.", explanation: "Incorrect. Timing is irrelevant; both automated and legitimate messages can arrive at any hour." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q3",
      prompt: "How does this app handle the secret signing key, and what is the public key for?",
      options: [
        { text: "The frontend stores the secret key in the browser so it can sign trades quickly, and the public key is a backup of it.", explanation: "Incorrect. The frontend never sees the secret key, and the public key is not a backup; it is the cryptographically distinct shareable address." },
        { text: "Both keys can be shared as long as the account also has a password protecting it.", explanation: "Incorrect. Stellar accounts have no separate password, and the secret key alone controls all funds, so it must never be shared." },
        { text: "The secret key is the public key reversed, so protecting one protects both.", explanation: "Incorrect. They are independent values from a keypair, not transforms of each other; the public key cannot be derived back into the secret." },
        { text: "The secret key (S...) controls all funds and is configured only server-side as STELLAR_SECRET so the browser never sees it, while the public key (G...) is the shareable address; the app also boots read-only by default.", explanation: "Correct. Signing happens only in the backend, the frontend never receives the key, the app starts read-only until Live is deliberately armed, and the G-key is safe to share for receiving." },
      ],
      correctIndex: 3,
    },
    {
      id: "c13-q4",
      prompt: "What does the backend balance pre-check (preflight) verify before the bot signs, and why does blocking early help?",
      options: [
        { text: "Only that the current market price is favourable enough to be profitable.", explanation: "Incorrect. Preflight checks settlement feasibility and account health, not whether the price is a good deal." },
        { text: "That the account exists, holds a trustline for the asset it will receive, and has enough spendable balance after open offers, the XLM reserve, and the fee buffer; blocking before signing wastes no network fee on a doomed op_underfunded or op_no_trust.", explanation: "Correct. Spendable is balance minus selling_liabilities, the (2 + subentry_count) x 0.5 XLM reserve, and a ~0.05 XLM fee buffer, and stopping pre-signing means a guaranteed on-chain failure costs nothing." },
        { text: "That you typed the correct secret key for this trading session.", explanation: "Incorrect. The key is server-side configuration, not session input; preflight validates trustlines and spendable balance, not key entry." },
        { text: "That no other trader is active in the same market at the same moment.", explanation: "Incorrect. Preflight concerns only your own account's ability to fund and receive the trade, not other participants." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Which set of habits best reflects safe trading with this app?",
      options: [
        { text: "Arm Live trading immediately, disable the position monitor, and trade every token that appears in the account.", explanation: "Incorrect. This strips away the read-only default, the monitor that enforces stops, and the whitelist that keeps you off hostile issuers." },
        { text: "Keep STELLAR_SECRET in a shared cloud folder so the bot can run from any machine.", explanation: "Incorrect. The secret key must stay offline and server-side; anyone with access to that folder gains total control of the funds." },
        { text: "Practise in Paper mode on testnet with a throwaway wallet, trade only whitelisted tokens, arm Live small with the monitor running and the Kill switch ready, and rotate any exposed key.", explanation: "Correct. This uses the free practice modes and every built-in guard, respects preflight blocks, and treats key exposure as an incident, so you learn without risking meaningful capital." },
        { text: "Override preflight blocks when they report insufficient_balance so trades are never missed.", explanation: "Incorrect. A preflight block means the trade would fail or overspend the reserve; the fix is to fund the account or add the trustline, not to bypass the check." },
      ],
      correctIndex: 2,
    },
  ],
};

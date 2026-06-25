import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Protecting Your Assets",
  description: "The real security risks in crypto and how this bot guards against them, from key safety to the balance pre-check.",
  lessons: [
    {
      id: "c13-l1",
      title: "What are the biggest security risks in crypto?",
      paragraphs: [
        "Crypto is unforgiving in one specific way: actions are final. When a Stellar transaction is confirmed, it is irreversible. There is no bank to call, no chargeback, no support line that can claw funds back. That single fact reshapes every risk below it, because a mistake is usually permanent.",
        "The biggest risks cluster into a handful of categories. Losing or leaking your secret signing key gives an attacker total control of your funds. Phishing and fake sites trick you into handing over that key yourself. Signing a malicious transaction can authorise a transfer you never intended. Sending to the wrong address moves money to a stranger forever. And trusting a fake token or issuer can leave you holding something worthless that merely looks real.",
        "Notice that most of these are not exotic hacks. They are ordinary human errors, amplified by irreversibility. The defence is not cleverness; it is slow, deliberate habits and tools that block bad actions before they reach the chain. That is exactly what this bot is built to do.",
      ],
      example: "You paste a destination address from your clipboard, but malware swapped it for the attacker's address. You confirm. The funds land in their account within seconds, and no force on earth can reverse it. A two second check of the first and last characters would have stopped it.",
    },
    {
      id: "c13-l2",
      title: "How to recognise a scam or phishing attempt",
      paragraphs: [
        "Phishing is the art of impersonation. An attacker builds a site or message that looks like a wallet, an exchange, or a support team, then nudges you to enter your secret key or recovery phrase. The trap is urgency and familiarity: a warning that your account is at risk, a generous airdrop, a login page that looks exactly right.",
        "Hold on to one rule and most phishing fails: a legitimate app will never ask for your secret key by email, chat, or a web form. Your key signs transactions on your own machine; no real service needs to see it. If anything asks you to paste a key beginning with S, treat that as proof it is a scam.",
        "Beyond that, slow down and verify. Check the exact domain, character by character, because look-alike letters and extra words are common. Be suspicious of unsolicited links and of pressure to act fast. When in doubt, navigate to the site yourself rather than following a link someone sent you.",
      ],
      example: "A message arrives: Your wallet was flagged, verify within one hour at stellar-wallett-secure.com or lose access. The doubled t in the domain and the demand for your seed phrase are the tells. A real provider would never need your secret key, and would never set a countdown to panic you.",
    },
    {
      id: "c13-l3",
      title: "What is a signing key and why should you protect it?",
      paragraphs: [
        "A Stellar account has two keys. The public key starts with G and is safe to share; it is like an account number others use to pay you. The secret signing key starts with S and must stay private. Whoever holds the secret key can sign transactions, which means they can move every asset in the account. There is no separate password layered on top.",
        "This bot needs the secret key configured so it can sign live trades on your behalf. To keep that power contained, it boots in read-only mode by default and will only submit real transactions once you deliberately arm Live trading. Until then it can watch and plan but cannot spend. The machine and environment holding the key are therefore as sensitive as a vault; anyone with access to them effectively has access to your funds.",
        "Treat exposure as an emergency. If the secret key ever appears in a screenshot, a log, a shared file, or a code repository, assume it is compromised and rotate it: create a new account, move funds across, and retire the old key. Rotation is cheap; recovery after theft is impossible.",
      ],
      example: "A developer commits a config file with the live S-key into a public git repository for ten minutes before deleting it. That is enough. Bots scan public repos constantly. The correct response is not to hope nobody saw it but to immediately rotate the key and move the balance to a fresh account.",
    },
    {
      id: "c13-l4",
      title: "What is the balance pre-check and how does it protect you?",
      paragraphs: [
        "Before signing any trade, the bot runs a balance pre-check, also called preflight. It is a guard that asks: would this transaction actually succeed and leave the account healthy? Only if every answer is yes does the bot proceed to sign. If any check fails, it blocks the trade cleanly instead of submitting something that would fail on-chain or quietly overspend.",
        "The pre-check verifies three things in particular. First, that the account exists and is funded. Second, that it holds a trustline for the asset it would receive, since Stellar cannot accept an asset you have not explicitly trusted. Third, that there is enough spendable balance once you subtract amounts locked in open offers, the XLM minimum reserve the network requires, and a small buffer for the transaction fee.",
        "The point is protection from self-harm. Without preflight, a marginal trade might fail after submission, waste a fee, or dip into the reserve and put the account at risk. With it, doomed trades are stopped before they cost you anything, and you get a clear reason rather than a cryptic on-chain error.",
      ],
      example: "You queue a buy that would spend nearly your whole XLM balance. Preflight subtracts the funds tied up in an existing open offer, the minimum reserve, and the fee buffer, and finds the spendable amount falls short. It blocks the trade and reports insufficient spendable balance, sparing you a failed submission and a depleted reserve.",
    },
    {
      id: "c13-l5",
      title: "Best practices for safe trading with this app",
      paragraphs: [
        "Start where mistakes are free. Practise in Paper mode, which simulates trades without real funds, and run on Stellar testnet with a throwaway hot wallet before you touch mainnet money. When you do go live, begin small. The cost of learning should be measured in lessons, not in lost capital.",
        "Lean on the built-in safety layers. Read-only mode lets the bot watch without spending. The kill switch blocks all trading instantly when you want to stop. Per-trade and daily-loss limits cap how much any single trade or bad day can cost you. A whitelist of allowed tokens keeps the bot away from fake or untrusted issuers. Together these turn a fast automated system into one you can rein in.",
        "Finally, guard the key and stay deliberate about going live. Keep the secret key off shared machines and out of logs and repositories. Leave the bot in its default read-only state until you have genuinely decided to arm Live trading, and re-check that decision rather than leaving it armed by habit. Security here is mostly discipline made routine.",
      ],
      example: "A sensible first week: run Paper mode on testnet with a disposable wallet to confirm the strategy behaves, set a conservative daily-loss limit and a tight token whitelist, then arm Live trading with a tiny balance and the kill switch one click away. You learn the system's edges without betting anything you would mind losing.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Why does irreversibility make crypto risks so severe?",
      options: [
        { text: "Confirmed transactions cannot be reversed, so a wrong address or signed scam is usually permanent.", explanation: "Correct. There is no chargeback or bank to undo a confirmed Stellar transaction, which is why ordinary mistakes become permanent losses." },
        { text: "Because exchanges charge high fees to reverse a payment.", explanation: "Incorrect. Reversal is not an expensive option, it is simply not possible once a transaction is confirmed." },
        { text: "Because crypto prices change too quickly to undo a trade.", explanation: "Incorrect. Price volatility is a separate issue; the core danger is that the transfer itself cannot be undone regardless of price." },
        { text: "Because you must wait several days before funds settle.", explanation: "Incorrect. Stellar settles in seconds, and fast settlement actually makes irreversibility hit sooner, not later." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q2",
      prompt: "Which is the strongest single sign that a message is a phishing attempt?",
      options: [
        { text: "It mentions Stellar or your wallet by name.", explanation: "Incorrect. Legitimate services also name the platform; that alone proves nothing." },
        { text: "It asks you to enter or paste your secret key or seed phrase.", explanation: "Correct. A legitimate app never asks for your secret key by email, chat, or web form, so any such request is a clear scam signal." },
        { text: "It arrives outside normal business hours.", explanation: "Incorrect. Timing is irrelevant; automated and real messages alike arrive at any hour." },
        { text: "It includes a clickable link.", explanation: "Incorrect. Links are common and not inherently malicious; the request for your key is the real giveaway, though you should still verify domains." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q3",
      prompt: "What is the difference between a Stellar public key and a secret key?",
      options: [
        { text: "The public key signs trades and the secret key only receives funds.", explanation: "Incorrect. It is the reverse: the secret key signs and controls funds, the public key is for receiving." },
        { text: "Both keys can be shared freely as long as the account has a password.", explanation: "Incorrect. Stellar accounts have no separate password; the secret key alone controls the funds and must stay private." },
        { text: "The public key starts with G and is safe to share, while the secret key starts with S and controls all funds.", explanation: "Correct. Whoever holds the S-key can sign transactions and move every asset, so it must be kept private while the G-key is shareable." },
        { text: "The secret key is just a display version of the public key.", explanation: "Incorrect. They are cryptographically distinct; the secret key is the private signing key, not a view of the public one." },
      ],
      correctIndex: 2,
    },
    {
      id: "c13-q4",
      prompt: "What does the balance pre-check (preflight) verify before the bot signs a trade?",
      options: [
        { text: "Only that the current market price is favourable.", explanation: "Incorrect. Preflight checks account health and feasibility, not whether the price is a good deal." },
        { text: "That the account exists, has a trustline for the asset it will receive, and has enough spendable balance after offers, reserve, and fee.", explanation: "Correct. These three checks ensure the trade can succeed on-chain and will not overspend the reserve, so doomed trades are blocked cleanly." },
        { text: "That you have entered the correct secret key for the session.", explanation: "Incorrect. Key configuration is separate; preflight validates balances and trustlines, not key entry." },
        { text: "That no other bot is trading the same token at the same time.", explanation: "Incorrect. Preflight is about your own account's ability to fund the trade, not about other traders' activity." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Which set of habits best reflects safe trading with this app?",
      options: [
        { text: "Arm Live trading immediately, disable the loss limits, and trade the whole token universe to maximise chances.", explanation: "Incorrect. This removes every safety layer at once; limits, a whitelist, and a cautious start exist precisely to prevent this." },
        { text: "Store the secret key in a shared cloud folder so you can trade from any device.", explanation: "Incorrect. The secret key must stay off shared machines and storage; anyone with access to it controls your funds." },
        { text: "Practise in Paper mode on testnet with a throwaway wallet, keep loss limits and a token whitelist, then go live small with the kill switch ready.", explanation: "Correct. This uses the free practice modes and built-in guards so you learn the system's edges without risking meaningful capital." },
        { text: "Leave Live trading armed permanently so you never miss an opportunity.", explanation: "Incorrect. The bot defaults to read-only for a reason; you should arm Live deliberately and re-check that decision rather than leaving it on by habit." },
      ],
      correctIndex: 2,
    },
  ],
};

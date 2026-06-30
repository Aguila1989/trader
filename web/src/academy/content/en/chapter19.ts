import type { Chapter } from "../../types";

export const chapter19: Chapter = {
  id: "c19",
  number: 19,
  level: "BASIC",
  title: "What is a Trustline and Should You Add One?",
  description: "Trustlines in plain language: what they are, why they cost 0.5 XLM, the real risks, how to research a token first, and how to remove one later.",
  lessons: [
    {
      id: "c19-l1",
      title: "What is a trustline?",
      paragraphs: [
        "On Stellar your account holds XLM by default, but it cannot hold any other token until you explicitly opt in to it. That opt-in is called a trustline. Think of it like giving a specific shop permission to place items in your wallet: you choose exactly which shops you trust, and nothing else can put anything in without your say-so.",
        "A trustline names one token precisely — its asset code plus the account that issues it. Adding the trustline says \"I am willing to hold this particular issuer's version of this token.\" It does not buy the token, it does not cost you the token's price, and it does not give the issuer access to your XLM. It simply opens a slot so the token can arrive.",
        "Until a trustline exists, anyone trying to send you that token, or any trade that would deliver it, simply fails. So adding a trustline is the necessary first step before you can receive, buy, or trade a non-XLM asset — and choosing which trustlines to open is choosing which issuers you are willing to deal with.",
      ],
      example: "You want to hold USDC. Before you can receive a single unit, your account needs a trustline to USDC issued by Circle's specific issuing account. Once that trustline exists, USDC can land in your wallet. Without it, a friend trying to send you 10 USDC gets an error and the payment never arrives.",
    },
    {
      id: "c19-l2",
      title: "Why does adding a trustline cost 0.5 XLM?",
      paragraphs: [
        "Adding a trustline does not spend 0.5 XLM — it reserves it. Stellar requires every account to keep a minimum balance, and each trustline you open raises that minimum by 0.5 XLM. That 0.5 XLM stays yours; it is simply locked and cannot be spent or sent while the trustline is open.",
        "This reserve exists to stop spam. Because every trustline costs locked balance, nobody can cheaply create millions of empty entries to bloat the network. It keeps the ledger lean and makes each trustline a small, deliberate commitment rather than something you scatter without thinking.",
        "The practical consequence: opening many trustlines locks up real XLM. Ten trustlines reserve 5 XLM you can no longer move. When you close a trustline you no longer need, that 0.5 XLM is released back into your spendable balance.",
      ],
      example: "Your account holds 20 XLM with no trustlines. You add a trustline to USDC and another to AQUA. Your reserved minimum rises by 1 XLM (0.5 each), so only about 19 XLM minus the base reserve is now spendable. Remove the AQUA trustline later and 0.5 XLM frees back up.",
    },
    {
      id: "c19-l3",
      title: "What are the risks of adding a trustline?",
      paragraphs: [
        "A trustline ties you to an issuer, and not every issuer is trustworthy. The classic danger is a rug pull: a project attracts holders, then the issuer mints a flood of new tokens or pulls liquidity, and the price collapses to nothing. Your trustline did not cause this, but it is what let you hold the token that became worthless.",
        "Anonymous issuers are a particular warning sign. If you cannot tell who runs the project, who controls the issuing key, or whether the supply can be inflated at will, you are trusting a stranger with no accountability. Many worthless tokens are scam clones that copy the code of a well-known asset but use a different, attacker-controlled issuer.",
        "A trustline itself cannot drain your XLM or your other tokens — that part is safe. The risk is entirely about the value of the token you choose to hold and the conduct of its issuer. The only direct cost is the 0.5 XLM reserve, which you get back when you close the trustline.",
      ],
      example: "A token called \"USDC\" appears with a huge advertised yield, but its issuer account is brand new, has no website, and could mint unlimited supply. You add the trustline and buy in. A week later the issuer mints ten million more units and dumps them; the price falls 99%. Your XLM was never at risk, but the tokens you bought are now near-worthless.",
    },
    {
      id: "c19-l4",
      title: "How to research a token before adding a trustline",
      paragraphs: [
        "Start with the issuer's identity. A credible token publishes a stellar.toml file at its home domain that names the organisation, links its website, and lists the exact issuing account. If there is no such file, no domain, and no way to identify who is behind it, treat that as a strong reason to stay away.",
        "Then look at liquidity and adoption. How many accounts already hold a trustline to it? Is there real trading volume against XLM, or is the order book empty? A token with thousands of holders and steady volume is a very different proposition from one with a handful of holders and no trades. The app's weekly trustline scan summarises exactly these signals for you.",
        "Finally, be sceptical of urgency and outsized promises. Guaranteed high yields, countdown timers, and pressure to add the trustline \"before it's too late\" are classic manipulation. A sound token does not need to rush you — so take the time to verify the issuer and the numbers yourself.",
      ],
      example: "Before trusting a new token you open its home domain and find a stellar.toml listing the project, its website, and the issuer key — and it matches the issuer you were given. You also see it has 8,000 holders and a healthy XLM order book. That checks out. A second token has no domain, 12 holders, and no trades; you decline it.",
    },
    {
      id: "c19-l5",
      title: "How to remove a trustline you no longer want",
      paragraphs: [
        "You are never stuck with a trustline. Removing one closes the slot and releases the 0.5 XLM reserve back into your spendable balance. In this app you remove a trustline from the Trustlines panel: each held token has a Remove button next to it.",
        "There is one rule: you can only remove a trustline when your balance of that token is exactly zero. Stellar will not let you close a trustline while you still hold the token, because that would strand the balance. So sell or transfer the token down to zero first, then the Remove button becomes available.",
        "Removing a trustline is a normal, reversible housekeeping step. If you change your mind later you can simply add the trustline again (paying the 0.5 XLM reserve again). Closing unused trustlines is good practice: it frees up reserved XLM and shrinks the list of issuers you are exposed to.",
      ],
      example: "You hold 0 of a token you no longer want but still have its trustline open. In the Trustlines panel its Remove button is active, so you click it; the trustline closes and 0.5 XLM returns to your spendable balance. A different token still shows a balance of 30, so its Remove button is disabled until you sell those 30 down to zero.",
    },
  ],
  quiz: [
    {
      id: "c19-q1",
      prompt: "What does adding a trustline actually do?",
      options: [
        { text: "It buys the token for you at the current market price.", explanation: "Incorrect. A trustline does not buy anything; it only allows your account to hold the token. You still have to acquire it separately." },
        { text: "It opts your account in to holding one specific token from one specific issuer.", explanation: "Correct. A trustline names a token and its issuer and opens a slot so that token can be received, bought, or traded." },
        { text: "It gives the token's issuer permission to spend your XLM.", explanation: "Incorrect. A trustline never grants anyone access to your XLM or other tokens; it only lets you hold the named asset." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q2",
      prompt: "What happens to the 0.5 XLM when you add a trustline?",
      options: [
        { text: "It is paid to the token issuer as a fee.", explanation: "Incorrect. The issuer receives nothing. The 0.5 XLM is not a payment." },
        { text: "It is spent permanently and cannot be recovered.", explanation: "Incorrect. It is not spent — it is reserved, and you get it back when you close the trustline." },
        { text: "It is reserved (locked) in your own account and released again if you remove the trustline.", explanation: "Correct. Each trustline raises your minimum balance by 0.5 XLM; the amount stays yours but is locked until the trustline is closed." },
      ],
      correctIndex: 2,
    },
    {
      id: "c19-q3",
      prompt: "Which of these is a genuine red flag before adding a trustline?",
      options: [
        { text: "The issuer publishes a stellar.toml with its name, website, and issuing key.", explanation: "Incorrect. That is a good sign — it lets you identify and verify who is behind the token." },
        { text: "The issuer is anonymous, has no website, and the supply could be inflated at will.", explanation: "Correct. An unidentifiable issuer with uncapped supply is a classic rug-pull setup; there is no accountability if it goes wrong." },
        { text: "The token has thousands of holders and a steady XLM order book.", explanation: "Incorrect. Real adoption and liquidity are reassuring signals, not warning signs." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q4",
      prompt: "When can you remove a trustline you no longer want?",
      options: [
        { text: "Only once your balance of that token is exactly zero.", explanation: "Correct. Stellar refuses to close a trustline while you still hold the token, so you sell or transfer it to zero first; then the 0.5 XLM reserve is released." },
        { text: "At any time, even with a large balance still held.", explanation: "Incorrect. A non-zero balance blocks removal, because closing would strand the tokens." },
        { text: "Never — once added, a trustline is permanent.", explanation: "Incorrect. Trustlines are reversible; you can remove one (at zero balance) and even add it again later." },
      ],
      correctIndex: 0,
    },
  ],
};

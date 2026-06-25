import type { Chapter } from "../../types";

export const chapter12: Chapter = {
  id: "c12",
  number: 12,
  level: "EXPERT",
  title: "Advanced Stellar Features",
  description:
    "Go deeper on the SDEX order book, trustlines, path payments, AMM pools, and consolidating holdings back into XLM.",
  lessons: [
    {
      id: "c12-l1",
      title: "What is the SDEX (Stellar Decentralized Exchange)?",
      paragraphs: [
        "The SDEX is the Stellar Decentralized Exchange, an order book built directly into the Stellar protocol. There is no separate company running it: anyone with an account can place buy or sell offers, and those offers match against each other on-chain. Every market, such as XLM against USDC, has its own order book of resting offers waiting to be filled.",
        "This bot does all of its automated trading on the SDEX order book, placing limit and market offers there. It does not trade on a centralized exchange, and it does not route the trading loop through liquidity pools. When the AI decides to act, it submits an offer to the relevant SDEX market and lets the protocol match it.",
        "A defining detail is how the bot enters: it uses maker-first execution. Rather than crossing the spread and paying the price the other side is asking, it prefers to rest its own offer at the current best bid or ask. By sitting on the book as a maker, it aims to capture the spread instead of paying it, which matters a great deal when the edge is only a few basis points wide.",
      ],
      example:
        "Suppose the XLM/USDC book shows a best bid of 0.1170 and a best ask of 0.1180. To buy XLM, a maker-first bot does not pay the 0.1180 ask. Instead it rests its own buy offer at 0.1170, joining the bid side. If a seller comes along and hits that offer, the bot buys at 0.1170 and pockets the spread, rather than crossing to 0.1180 and giving it away.",
    },
    {
      id: "c12-l2",
      title: "What is a trustline and when do you need one?",
      paragraphs: [
        "A trustline is an explicit opt-in that lets your Stellar account hold a specific non-native asset from a specific issuer. Assets on Stellar are defined by a code plus the account that issued them, so USDC issued by Circle is a different thing from any other token also calling itself USDC. Before your account can receive or hold an asset, you must open a trustline to that exact code-and-issuer pair.",
        "The one asset that never needs a trustline is XLM, the native lumen. Everything else does. You add and remove trustlines from the dashboard, and the app's balance pre-check verifies that a trustline already exists for any asset a trade would receive, so a buy cannot land an asset you have no line to hold.",
        "Trustlines are not free in one sense: each open trustline raises your account's minimum XLM reserve slightly. That reserve is locked and cannot be spent or traded while the line is open. So it is worth closing trustlines for assets you no longer hold, both to reclaim a little reserve and to keep the wallet tidy.",
      ],
      example:
        "You want the bot to buy USDC from Circle. First you open a trustline to USDC issued by Circle's issuing account on the dashboard. That trustline nudges your minimum XLM reserve up a notch, locking a small amount of XLM. Now a buy that receives USDC passes the balance pre-check. If you later sell all your USDC and close the trustline, that reserve is freed again.",
    },
    {
      id: "c12-l3",
      title: "What is a path payment and how does this app use it?",
      paragraphs: [
        "A path payment is a Stellar payment that converts one asset into a different asset inside a single atomic transaction, automatically hopping through one or more intermediate markets to find a route. You specify what you want to send and what you want to receive, and the network walks a path, for example send asset to a middle asset to the receive asset, all settled together or not at all.",
        "This app uses path payments for its wallet Swap and Convert feature, not for the automated order-book trading loop. When you request a swap, the app produces a quote showing the route or path it found and the estimated amount you would receive. You review that quote before committing, so you can see the conversion before it happens.",
        "Because the whole hop is atomic, a path payment either completes the full conversion or fails cleanly with nothing changed. There is no risk of converting halfway and getting stuck holding an unwanted intermediate asset. That makes path payments a clean tool for moving between assets you actually want to hold.",
      ],
      example:
        "You hold yXLM and want USDC, but there may be no deep direct market between them. You request a swap. The app returns a quote whose path routes yXLM into XLM and then XLM into USDC, estimating you would receive about 96 USDC. You accept, and the path payment executes both hops in one atomic transaction: either you end up with the USDC, or the whole thing reverts and you keep your yXLM.",
    },
    {
      id: "c12-l4",
      title: "What is an AMM liquidity pool on Stellar?",
      paragraphs: [
        "Beyond the order book, Stellar also supports automated market maker pools. An AMM liquidity pool holds two assets together, funded by liquidity providers who deposit both sides. Traders then swap against the pool rather than against another trader's offer, and the pool prices each swap using a constant-product formula, where the product of the two reserves stays roughly constant as one side is bought and the other sold.",
        "It is important to be clear about what this bot does. The bot does not route its automated trades through AMM pools. Its trading loop works the SDEX order book, placing maker-first offers as described earlier. AMM pools are introduced here as a general Stellar concept you may encounter, not as a venue the bot's strategy targets.",
        "There is one subtle exception worth knowing. Path payments, which power the Swap feature, can incidentally route through an AMM pool at the protocol level if the network finds that the best path runs through one. That is the protocol choosing an efficient route for a one-off conversion, and it is separate from the order-book trading the bot performs on its scanning loop.",
      ],
      example:
        "Imagine an XLM/USDC pool holding 100000 XLM and 12000 USDC. A trader swaps in some USDC, the pool's USDC reserve rises, its XLM reserve falls, and the constant-product rule sets the rate so the price drifts as the trade size grows. The bot ignores this pool for its automated trades, resting offers on the order book instead, though a one-off Swap quote could legitimately route a conversion through such a pool.",
    },
    {
      id: "c12-l5",
      title: "What is auto-swap to XLM and when should you use it?",
      paragraphs: [
        "Auto-swap to XLM means consolidating your non-XLM holdings back into XLM using the Swap and Convert feature. Since that feature is built on path payments, auto-swap is really a convenience layered on top of swapping: instead of converting each token by hand, it helps gather scattered non-native balances back into the native lumen.",
        "There are a few good reasons to reach for it. Consolidating into XLM can free up the buy side, since holding XLM lets the bot sell XLM into dips when an opportunity appears. It also simplifies a cluttered wallet of small leftover tokens, and it can top up your XLM balance to comfortably cover the minimum reserve that trustlines and base account requirements demand.",
        "Treat auto-swap as an evolving convenience feature rather than a fully automatic background process that silently sweeps your wallet. You stay in control: it builds on the same Swap quotes you would review yourself, so you can see what each conversion would yield before it happens. Use it deliberately, when tidying up or repositioning, not as a hands-off setting you forget about.",
      ],
      example:
        "Your wallet holds 40 USDC, 15 AQUA, and a thin 300 XLM that barely clears your reserve. You want the bot's XLM-selling buy side active and your reserve comfortable. You use auto-swap to XLM, which produces swap quotes converting the USDC and AQUA into XLM. After accepting, you hold one larger XLM balance, a tidier wallet, and enough headroom above the minimum reserve to keep trustlines open and trade freely.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "What is the SDEX, and how does this bot trade on it?",
      options: [
        {
          text: "A centralized exchange the bot connects to with an API key, crossing the spread on every order.",
          explanation:
            "Incorrect. The SDEX is decentralized and built into the protocol, and the bot rests maker offers rather than always crossing the spread.",
        },
        {
          text: "A protocol-level decentralized order book where the bot places maker-first offers to capture the spread.",
          explanation:
            "Correct. The SDEX is Stellar's built-in on-chain order book, and the bot prefers to rest offers at the best bid or ask rather than crossing it.",
        },
        {
          text: "An AMM liquidity pool that the bot's automated loop swaps against on every trade.",
          explanation:
            "Incorrect. The bot trades the order book, not AMM pools; pools are a separate Stellar concept.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q2",
      prompt: "When do you need to open a trustline?",
      options: [
        {
          text: "Before holding or receiving any asset, including XLM.",
          explanation:
            "Incorrect. XLM is the native asset and never needs a trustline; only non-native assets do.",
        },
        {
          text: "Only after a trade has already failed for lack of one.",
          explanation:
            "Incorrect. The balance pre-check verifies the trustline first, so the trustline should exist before the trade, not after a failure.",
        },
        {
          text: "Before your account can hold a specific non-native asset from a specific issuer, such as USDC from Circle.",
          explanation:
            "Correct. A trustline is the opt-in for a specific code-and-issuer pair, and each open one slightly raises your minimum XLM reserve.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q3",
      prompt: "What does a path payment do, and how does this app use it?",
      options: [
        {
          text: "It converts one asset into another in a single atomic transaction, and the app uses it for the wallet Swap and Convert feature.",
          explanation:
            "Correct. A path payment hops through intermediate markets atomically, and the app uses it for swaps that show a route and an estimated received amount, not for the order-book loop.",
        },
        {
          text: "It is the mechanism the bot uses for every automated order-book trade.",
          explanation:
            "Incorrect. The automated trading loop uses SDEX order-book offers; path payments power the Swap feature instead.",
        },
        {
          text: "It splits a payment into several separate transactions that each settle independently.",
          explanation:
            "Incorrect. A path payment is a single atomic transaction that either completes the full conversion or reverts entirely.",
        },
        {
          text: "It opens a trustline automatically for any asset you receive.",
          explanation:
            "Incorrect. Trustlines are opened separately on the dashboard; a path payment converts assets, it does not create trustlines.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q4",
      prompt: "What is an AMM liquidity pool on Stellar, and does this bot trade through one?",
      options: [
        {
          text: "It is the protocol's main order book, and the bot rests all its offers there.",
          explanation:
            "Incorrect. The order book and AMM pools are different mechanisms; the bot rests offers on the order book, which is not a pool.",
        },
        {
          text: "It is a constant-product pool of two assets that traders swap against, and the bot routes its automated trades through it.",
          explanation:
            "Incorrect. The pool description is right, but the bot does not route automated trades through pools; it trades the order book.",
        },
        {
          text: "It is a constant-product pool of two assets funded by liquidity providers, and the bot trades the order book rather than routing automated trades through pools.",
          explanation:
            "Correct. AMM pools price swaps with a constant-product formula, but the bot's automated loop uses the SDEX order book; only a one-off path payment might incidentally route through a pool.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q5",
      prompt: "What is auto-swap to XLM mainly for?",
      options: [
        {
          text: "Consolidating non-XLM holdings back into XLM to free up the buy side, tidy the wallet, or top up the reserve.",
          explanation:
            "Correct. It is a convenience built on the Swap feature that gathers non-native balances into XLM, helping reposition for selling XLM, simplify the wallet, and cover the minimum reserve.",
        },
        {
          text: "A fully automatic background process that silently sweeps every token without you reviewing anything.",
          explanation:
            "Incorrect. It is an evolving convenience built on Swap quotes you can review; it is not a hands-off background sweep.",
        },
        {
          text: "A way to open trustlines in bulk for new assets you want to start trading.",
          explanation:
            "Incorrect. Auto-swap converts holdings into XLM; opening trustlines for new assets is a separate dashboard action.",
        },
      ],
      correctIndex: 0,
    },
  ],
};

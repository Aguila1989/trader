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
      title: "How the SDEX works — order matching, fees, settlement",
      paragraphs: [
        "The SDEX is the Stellar Decentralized Exchange, an order book that lives inside the protocol itself rather than on a company's servers. Anyone with an account can submit offers. A manageSellOffer says I will give up this much of asset A for at least this price in asset B; a manageBuyOffer expresses the same intent from the other direction. Each offer rests on-chain in the order book for its market, for example XLM against USDC, until it is taken, replaced, or cancelled.",
        "Matching follows price-then-time priority. The protocol fills the best-priced resting offer first, and when two offers share a price, the older one matches ahead of the newer. A new offer that crosses the existing book is matched immediately against those resting offers; whatever quantity is left over after crossing becomes a new resting offer at your limit price. Matching, the asset transfers, and settlement all happen atomically inside a single ledger, which closes roughly every five seconds. There is no separate clearing step and no waiting for confirmations beyond that one ledger close.",
        "The cost model is unusual coming from centralized venues. There is no percentage trading fee. You pay the network base fee, currently 100 stroops, which is 0.00001 XLM per operation, a fraction of a US cent. The real cost of trading is the spread you cross when you take liquidity, plus that tiny fee. Crossing a 10 basis point spread to get an immediate fill costs far more than the network fee ever will.",
        "This bot is maker-first. Instead of crossing the spread and paying the ask (or hitting the bid) to trade now, it rests its own offer at the best bid or ask so it sits on the book as a maker. When someone else crosses to it, the bot captures the spread rather than paying it. It only crosses as a taker when it genuinely needs an immediate fill. On an edge measured in single-digit basis points, the difference between paying the spread and capturing it is often the difference between a profitable and an unprofitable trade.",
      ],
      example:
        "The XLM/USDC book shows a best bid of 0.1170 and a best ask of 0.1180, a 10 bps spread. A taker buying now pays 0.1180. The maker-first bot instead rests a buy offer at 0.1170, joining the bid. When a seller later crosses down to 0.1170, the bot is filled within that ledger close. It paid 100 stroops in network fee and captured the spread instead of conceding 0.0010 per XLM.",
    },
    {
      id: "c12-l2",
      title: "What is a trustline and when is one required?",
      paragraphs: [
        "A trustline is an explicit opt-in, created with the changeTrust operation, that authorizes your account to hold a specific non-native asset. Stellar identifies every non-native asset by a code plus its issuing account, written as CODE:ISSUER. That pairing matters: USDC issued by Circle is a completely different asset from any other token that also calls itself USDC. A trustline is to one exact code-and-issuer pair, so trusting Circle's USDC does not let you hold some other issuer's USDC.",
        "The one asset that never needs a trustline is XLM, the native lumen. Every account can hold and send XLM by default. Everything else, every issued token, requires a trustline before your account can receive or hold any amount of it. Send someone an asset they have no trustline for and the payment simply fails.",
        "Trustlines carry a cost in locked reserve. Each open trustline is a subentry on your account, and every subentry raises your minimum XLM reserve by 0.5 XLM. That 0.5 XLM is locked while the line is open: it cannot be spent, traded, or withdrawn until you remove the trustline. Five open trustlines therefore lock 2.5 XLM on top of the base reserve, and that locked amount is purely a holding cost, never spent or earned. Closing a trustline for an asset you no longer hold reclaims that 0.5 XLM, which is why tidy wallets close lines they no longer need.",
        "This bot guards against the failed-payment trap with a balance pre-check. Before it signs any trade, it verifies that a trustline already exists for whatever asset the trade would receive. A buy that would land USDC is only signed if the account already trusts that exact USDC issuer. The check happens before signing, not after a rejection, so the bot never wastes a transaction discovering at settlement time that it had nowhere to put the asset it just bought.",
      ],
      example:
        "You want the bot to buy USDC from Circle. First you open a trustline to USDC:Circle-issuer on the dashboard. That subentry raises your minimum XLM reserve by 0.5 XLM, locking that amount while the line stays open. Now a buy that receives Circle's USDC passes the pre-check and is signed. Sell all that USDC later and close the trustline, and the 0.5 XLM is freed back into your spendable balance.",
    },
    {
      id: "c12-l3",
      title: "What is a path payment, and how this app uses it to swap to XLM",
      paragraphs: [
        "A path payment converts a send asset into a different receive asset inside one atomic transaction, hopping through one or more intermediate markets to find a route. Stellar exposes two forms. pathPaymentStrictSend fixes the amount you send and lets the received amount float down to a minimum you set; pathPaymentStrictReceive fixes the amount you want to receive and lets the amount sent float up to a maximum you set. Either way the network walks a path, for example asset A to a middle asset to asset C, and the whole hop settles together or not at all.",
        "Atomicity is the key property. The entire conversion either completes across every hop or reverts with nothing changed. You can never get stranded halfway, holding some unwanted intermediate asset because one leg failed. That makes path payments a clean tool for moving between assets you actually want to hold.",
        "This app uses path payments for its wallet Swap and Convert feature, and not for the automated order-book trading loop. When you request a swap, the app returns a quote describing sendAsset, sendAmount, destAsset, destAmount, and the path it found, the ordered list of intermediate assets the route runs through. You review that quote before committing, so you see the full conversion, the route, and the estimated amount you would receive before anything is signed.",
        "Auto-swap to XLM is this feature pointed at the lumen: consolidating non-XLM holdings back into XLM through that same swap. The two main reasons are positioning and reserve. Holding XLM frees the XLM-selling buy side of the strategy, because the bot can only sell XLM into a dip if it actually holds XLM. And a larger XLM balance tops up the minimum reserve that the base account and every open trustline demand. The swap is the mechanism; auto-swap to XLM is simply choosing XLM as the destination asset.",
      ],
      example:
        "You hold yXLM and want plain XLM, but the direct yXLM-to-XLM book is thin. You request a swap. The app returns a quote: sendAsset yXLM, sendAmount 100, destAsset XLM, destAmount about 99.4, with a path routing yXLM through USDC into XLM. You review it and accept. The path payment executes both hops atomically in one ledger: you either end up with roughly 99.4 XLM, or the whole transaction reverts and you keep your 100 yXLM.",
    },
    {
      id: "c12-l4",
      title: "AMM liquidity pools vs the order book",
      paragraphs: [
        "Stellar supports two ways to trade an asset pair: the order book and automated market maker pools. The order book, the SDEX, is a set of discrete resting offers at specific prices, matched price-then-time as covered earlier. An AMM liquidity pool is different in shape. It holds a reserve of two assets together, funded by liquidity providers who deposit both sides, and traders swap against the pool rather than against another trader's offer.",
        "A pool prices each swap with a constant-product formula, x times y equals k. The product of the two reserves stays constant as one side is bought and the other sold, so the more of one asset you pull out, the steeper the price moves against you. That is price impact, and it grows with trade size: a small swap barely moves the rate, a large swap can move it a lot. Against an order book, by contrast, you walk discrete resting offers level by level. The two venues have genuinely different slippage profiles for the same nominal trade.",
        "Be precise about what this bot does. Its automated trading uses the SDEX order book, resting maker-first offers as described in the earlier lessons. The strategy does not target AMM pools and does not size trades against a constant-product curve. Pools are presented here as a general Stellar mechanism you will encounter, not as a venue the trading loop aims at.",
        "There is one subtle overlap. A path payment, which powers the Swap feature, can incidentally route through an AMM pool at the protocol level if the network finds the best path runs through one. That is the protocol picking an efficient route for a single one-off conversion, and it is entirely separate from the order-book trading the scanning loop performs. So a pool can touch your wallet through a swap, but never through the automated strategy.",
      ],
      example:
        "Picture an XLM/USDC pool holding 100000 XLM and 12000 USDC, so k is 1.2 billion and the marginal price is 0.12. Swap in 1200 USDC and the USDC reserve rises to 13200; to keep k constant the XLM reserve falls to about 90909, so you receive roughly 9091 XLM at an average rate worse than 0.12, the price impact. The bot ignores this pool for automated trades, resting offers on the order book instead, though a one-off Swap quote could legitimately route through it.",
    },
    {
      id: "c12-l5",
      title: "Is an auto-swap to XLM worth it? The profitability math",
      paragraphs: [
        "There is no automatic profit-checker inside the trading loop deciding for you whether an auto-swap to XLM pays off. The loop trades the order book; it does not silently evaluate or trigger swaps. Judging whether a swap is worth it is your job, and the Swap quote gives you everything you need to do it. Treat the quote as a small spreadsheet rather than a button.",
        "The method is to compare destAmount, the XLM the quote says you would receive, against the value of what you give up. What you give up is sendAmount of the send asset, valued at a fair reference rate. The gap between the two is eaten by the spread you cross along the path plus the per-operation network fee of 100 stroops. A multi-hop path is more expensive than a single hop, because you cross a spread at each market the route passes through, not just once. So a two-hop route can quietly cost two spreads.",
        "A swap is worth it when the quoted received XLM beats your best alternative. The alternatives are usually: hold the asset as it is, or sell it on a deeper direct market and then buy XLM yourself. If a direct market for your asset is deeper than the swap path, selling there and converting manually can lose less to spread than a thin multi-hop route. The quote does not know your alternatives; you supply that judgment by comparing its destAmount to what those other routes would yield.",
        "Work an example with real numbers. Say you hold 50 USDC and the fair XLM price is 0.12, so a frictionless conversion would give 50 divided by 0.12, about 416.7 XLM. The Swap quote returns destAmount of 414.0 XLM through a single-hop route. The shortfall of about 2.7 XLM, roughly 0.65 percent, is the spread crossed plus the negligible 100-stroop fee. If holding the USDC or selling it on a deeper direct book would net you more than 414.0 XLM of value, skip the swap. If 414.0 XLM is genuinely the best you can do and you need XLM to free the buy side or top up the reserve, the swap is worth it. The arithmetic, not a built-in checker, makes the call.",
      ],
      example:
        "You hold 50 USDC; the fair rate is 0.12, so frictionless is about 416.7 XLM. A single-hop Swap quote shows destAmount 414.0 XLM, a 0.65 percent haircut for the spread plus the 100-stroop fee. A two-hop quote through AQUA shows 410.5 XLM, worse because it crosses two spreads. You take the 414.0 single-hop route only because you need XLM for the reserve and no deeper direct market would beat it.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "How does the SDEX match orders and charge fees, and how does this bot trade on it?",
      options: [
        {
          text: "It matches price-then-time and settles atomically within a ledger; there is no percentage fee, just a tiny per-operation base fee plus any spread crossed, and the bot is maker-first to capture the spread.",
          explanation:
            "Correct. The SDEX fills best-price-first then oldest-first, settles inside one roughly five-second ledger, charges only the 100-stroop base fee plus the spread you cross, and this bot rests offers to capture that spread rather than pay it.",
        },
        {
          text: "It charges a percentage trading fee on every fill and settles after several block confirmations, and the bot always crosses the spread as a taker.",
          explanation:
            "Incorrect. There is no percentage fee, settlement is atomic within one ledger rather than many confirmations, and the bot is maker-first rather than always taking.",
        },
        {
          text: "It matches newest offers first and settles off-chain through an exchange operator, with the bot paying that operator a commission.",
          explanation:
            "Incorrect. Matching is oldest-first at a given price, settlement is on-chain and atomic, and there is no operator or commission.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q2",
      prompt: "When is a trustline required, and what does opening one cost?",
      options: [
        {
          text: "Before holding any asset including XLM, and it costs a percentage fee on each receipt.",
          explanation:
            "Incorrect. XLM is native and never needs a trustline, and the cost is a locked reserve, not a percentage fee.",
        },
        {
          text: "Before your account can hold a specific non-native CODE:ISSUER asset such as Circle's USDC, and each open trustline locks 0.5 XLM in your minimum reserve.",
          explanation:
            "Correct. A trustline is the opt-in for one exact code-and-issuer pair, XLM never needs one, and every open line raises your minimum reserve by 0.5 XLM until closed.",
        },
        {
          text: "Only once a trade has already failed for lack of one, and it costs nothing.",
          explanation:
            "Incorrect. The pre-check verifies the trustline before signing rather than after a failure, and each line locks 0.5 XLM of reserve.",
        },
        {
          text: "Before sending XLM to any new account, and it permanently burns 0.5 XLM.",
          explanation:
            "Incorrect. Sending XLM needs no trustline, and the 0.5 XLM is locked reserve that is reclaimed when you close the line, not burned.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q3",
      prompt: "What does a path payment do, and how does this app use it?",
      options: [
        {
          text: "It splits one payment into several independent transactions that each settle on their own.",
          explanation:
            "Incorrect. A path payment is a single atomic transaction; either the whole conversion completes or it reverts entirely.",
        },
        {
          text: "It is the mechanism behind every automated order-book trade the bot makes.",
          explanation:
            "Incorrect. The automated loop uses SDEX order-book offers; path payments power the wallet Swap and Convert feature instead.",
        },
        {
          text: "It converts a send asset into a different receive asset atomically through one or more hops, and the app uses it for the wallet Swap and Convert feature, returning a quote with sendAsset, destAmount, and the path.",
          explanation:
            "Correct. A path payment hops through intermediate markets in one atomic transaction, and the app uses it for swaps, including auto-swap to XLM, showing the route and estimated received amount before you commit.",
        },
        {
          text: "It opens a trustline automatically for whatever asset you receive.",
          explanation:
            "Incorrect. Trustlines are opened separately with changeTrust on the dashboard; a path payment converts assets and does not create trustlines.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q4",
      prompt: "How does an AMM pool differ from the order book, and which does this bot's automated loop trade?",
      options: [
        {
          text: "A pool prices swaps along a constant-product curve with size-dependent impact, the order book matches discrete resting offers, and the bot's automated loop trades the order book.",
          explanation:
            "Correct. AMM pools use x times y equals k so larger trades move the price more, the order book uses discrete offers, and the automated loop rests maker-first offers on the order book, not pools.",
        },
        {
          text: "A pool and the order book are the same mechanism, and the bot routes every automated trade through the pool.",
          explanation:
            "Incorrect. They are different mechanisms, and the automated loop trades the order book rather than routing through pools.",
        },
        {
          text: "A pool is a set of discrete resting offers, the order book is a constant-product curve, and the bot trades the curve.",
          explanation:
            "Incorrect. The descriptions are swapped: the order book holds discrete offers and the pool is the constant-product curve, and the bot trades the order book.",
        },
        {
          text: "A pool has zero price impact at any size, so the bot routes its automated trades there to avoid slippage.",
          explanation:
            "Incorrect. A constant-product pool has price impact that grows with size, and the bot trades the order book rather than pools.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q5",
      prompt: "How should you judge whether an auto-swap to XLM is worth it?",
      options: [
        {
          text: "Trust a built-in profit-checker in the trading loop that decides automatically whether each swap pays off.",
          explanation:
            "Incorrect. There is no automatic profit-checker in the trading loop; you evaluate the swap yourself from the quote.",
        },
        {
          text: "Assume any swap is worthwhile because the network fee is tiny, ignoring the spread.",
          explanation:
            "Incorrect. The dominant cost is the spread crossed along the path, and a multi-hop route crosses one at each hop; the tiny fee is not the deciding factor.",
        },
        {
          text: "Compare the quote's destAmount in XLM against the value of what you give up, subtracting the spread crossed at each hop and the per-operation fee, and take it only if that beats holding or selling on a deeper direct market.",
          explanation:
            "Correct. You read destAmount versus the fair value of sendAmount, account for the spread at every hop plus the 100-stroop fee, and swap only when the received XLM beats your alternatives.",
        },
        {
          text: "Pick whichever quote has the most hops, since more hops always means a better price.",
          explanation:
            "Incorrect. More hops mean more spreads crossed, which usually makes the route worse, not better.",
        },
      ],
      correctIndex: 2,
    },
  ],
};

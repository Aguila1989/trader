// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Arbitrage and Market Efficiency (EXPERT): what arbitrage is, how Stellar path
// payments enable atomic price-gap capture, why arbitrageurs tighten spreads and
// add liquidity, whether MEV exists on Stellar, and how all of this shapes the
// SDEX and AMM prices you trade against in the app. Owns no new glossary terms;
// reuses vocabulary taught in earlier chapters. Authored to the exact same shape
// as content/en/pending/chapter22.ts, with the per-chapter `whoFor` one-liner
// typed via a local intersection so the live Chapter interface stays untouched.
import type { Chapter } from "../../../types";

export const chapter35: Chapter & { whoFor: string } = {
  id: "c35",
  number: 35,
  level: "EXPERT",
  whoFor: "For traders who want to understand the forces that keep prices honest",
  title: "Arbitrage and Market Efficiency",
  description:
    "What arbitrage is, how Stellar path payments let it capture price gaps atomically, why arbitrageurs make markets more efficient, whether MEV exists on Stellar, and how all of it shapes the prices you see in this app.",
  lessons: [
    {
      id: "c35-l1",
      title: "What is arbitrage?",
      paragraphs: [
        "Arbitrage is the act of buying an asset where it is cheap and selling the identical asset where it is expensive, capturing the difference as profit. Think of a trader who notices that a certain brand of coffee costs 2 USDC at a discount supermarket and 3 USDC at a premium grocer across the street. If they can buy at the cheap shop and immediately sell to the expensive one, they pocket 1 USDC per bag with no view on whether coffee is a good long-term investment. They are not betting on the price going up or down; they are harvesting the gap between two prices for the same thing at the same moment.",
        "In crypto the same logic applies across trading venues. The very same asset — say XLM priced in USDC — can trade at slightly different rates on the SDEX order book, inside an AMM liquidity pool, and on a centralised exchange elsewhere. Whenever those quoted prices drift apart, a price gap opens, and capturing that gap is arbitrage. The defining feature is that the two legs reference the same underlying value, so the profit does not depend on the market moving in your favour; it depends only on the mismatch existing long enough to trade against.",
        "Two properties make real arbitrage hard. First, gaps are usually tiny, often a fraction of a percent, because everyone is hunting them; the profit per unit is small and only worthwhile at size or speed. Second, the two legs must be as close to simultaneous as possible: if you buy cheap but the expensive venue moves before you sell, the gap can vanish or invert and your risk-free trade becomes a plain directional bet. This is why the mechanics of execution — settlement time, fees, and atomicity — matter as much as spotting the gap. This is educational material, not financial advice.",
      ],
      example:
        "Suppose an AMM pool quotes XLM at 0.1200 USDC while the SDEX order book has resting bids at 0.1210 USDC. An arbitrageur buys XLM from the pool at 0.1200 and sells it into the SDEX bid at 0.1210, netting 0.0010 USDC per XLM before fees. On a 10,000 XLM trade that is 10 USDC of gross edge — thin, but repeatable and directionally neutral, because the profit came from the 0.0010 gap, not from any opinion about where XLM is heading.",
    },
    {
      id: "c35-l2",
      title: "How does arbitrage work on Stellar via path payments?",
      paragraphs: [
        "Stellar has a native feature almost purpose-built for arbitrage: the path payment. As introduced in the Advanced Stellar Features chapter, a path payment converts one asset into another by hopping through a chain of markets in a single operation — for example XLM to USDC to yXLM and back to XLM — filling each hop against the best available SDEX order books and AMM liquidity pools along the route. The whole path either completes as one unit or fails and reverts; there is no state in which you are left half-converted. That all-or-nothing property is called atomicity, and it is exactly what an arbitrageur needs to eliminate the leg risk described earlier.",
        "For arbitrage the powerful variant is a path payment that starts and ends in the same asset. You send, say, 1,000 XLM through a route that touches several markets and specify that you must receive at least 1,001 XLM back; if the market prices around the loop do not add up to a profit, the operation simply fails and you have lost only the trivial network fee (~0.00001 XLM). Stellar's protocol will even search for a favourable path across the order books and pools it knows about. Because the entire loop settles in one ledger close, the price gap you spotted cannot move against you between legs — the classic arbitrageur's nightmare of the second leg slipping away is structurally impossible.",
        "The mechanism is a circular conversion: money flows out in one asset, ricochets through intermediate order books and 0.30% AMM pools, and returns in the same asset at a net surplus. The trader specifies a strict minimum received (a sendMax and destination-amount constraint under the hood), so the ledger enforces the profitability threshold. Competition is fierce and edges are quickly closed, so successful Stellar arbitrage is largely about detecting fleeting cross-venue mismatches faster than rivals and expressing them as a single atomic path before the next ledger closes.",
      ],
      example:
        "An arbitrage bot watches Horizon and spots that the XLM/USDC AMM pool is momentarily cheap relative to the yXLM/USDC and yXLM/XLM order books. It submits one path payment: send 1,000 XLM, route XLM to USDC (pool), USDC to yXLM (order book), yXLM to XLM (order book), destination minimum 1,000.6 XLM. If every hop fills at the expected rates the loop returns more XLM than it sent and the bot keeps the surplus; if any hop has already moved, the destination-minimum check fails, the whole operation reverts, and only the tiny base fee is spent.",
    },
    {
      id: "c35-l3",
      title: "What do arbitrageurs do for the market? Why are they useful?",
      paragraphs: [
        "Although arbitrageurs act purely for their own profit, the side effect of their activity is a more honest, more usable market for everyone else. Every time an arbitrageur buys from the cheap venue and sells into the expensive one, they push the cheap price up and the expensive price down. Repeated across thousands of tiny trades, this drags the price of the same asset into near-alignment everywhere it trades. Without them, the SDEX, the AMM pools, and outside exchanges would routinely disagree, and a naive trader could unknowingly transact at a stale, off-market rate.",
        "This price-alignment work also tightens spreads and adds effective liquidity. An arbitrageur who stands ready to buy any pool that dips below fair value and sell any book that spikes above it is, in practice, providing depth: their willingness to trade the gap means large orders move the price less, because someone is always leaning against the mispricing. The bid-ask spread — the distance between the best buy and best sell — narrows because arbitrage removes the easy profit from a wide gap, and a narrower spread is a direct cost saving for ordinary traders.",
        "The economic name for the end state they push toward is market efficiency: a market where prices rapidly reflect all available information and where obvious, risk-free profit opportunities are competed away almost as fast as they appear. No market is perfectly efficient, and fleeting gaps always exist, but arbitrage is the mechanism that keeps the imperfection small. The healthier and more contested the arbitrage, the smaller and shorter-lived the mispricings, which is why deep, liquid pairs stay pinned to fair value while thin, neglected tokens can drift much further before anyone bothers to correct them. In this sense arbitrageurs are unpaid janitors of the price system — self-interested, but keeping the venue you rely on consistent and fairly priced, and their absence is itself a warning sign that a market is illiquid or hard to trade.",
      ],
      example:
        "Imagine the XLM/USDC AMM pool sags to 0.1180 USDC while every order book and outside exchange still trades near 0.1210. Arbitrageurs pour buy orders into the cheap pool, lifting it, and sell the acquired XLM into the higher books, pressing them down, until the pool re-converges to roughly 0.1205 — within a fraction of a percent of everywhere else. A trader who opened the app mid-episode and simply took the pool price would have overpaid to sell; the arbitrageurs' correction is what protects the next trader from that stale quote.",
    },
    {
      id: "c35-l4",
      title: "What is MEV (Maximal Extractable Value) and does it exist on Stellar?",
      paragraphs: [
        "MEV, or Maximal Extractable Value, is the profit that whoever controls the ordering of transactions in a block can extract by inserting, reordering, or censoring transactions. On many blockchains, block producers (or the searchers who bid to them) can see a pending transaction in the public mempool and act on it: front-running (jumping ahead of a known buy to profit from the price impact), back-running (trailing it to capture the resulting gap), or the sandwich attack (buying just before and selling just after a victim's large order). This value is extracted at the expense of ordinary users, who receive worse fills than the market would otherwise give them.",
        "Stellar's architecture makes classic MEV materially harder than on a typical single-leader proof-of-work or proof-of-stake chain. Consensus is reached through the Stellar Consensus Protocol (SCP), a Federated Byzantine Agreement in which nodes agree on a transaction set via overlapping quorum sets rather than a single miner unilaterally choosing block order. Ledgers close fast (a few seconds) and there is no lucrative gas-price auction: transactions carry a tiny flat-ish fee, and when a ledger is over capacity Stellar uses surge pricing with randomised selection among same-fee transactions rather than a strict highest-bidder-wins ordering. There is no long-lived public mempool that a searcher can farm the way Ethereum's is farmed, which removes much of the front-running surface.",
        "MEV is limited on Stellar, though, not eliminated. Anyone observing Horizon can still see broadcast transactions and race to submit a competing path payment into the same ledger; deterministic tie-breaking within a transaction set can be studied and gamed at the margin; and the arrival of Soroban smart contracts (with DeFi protocols such as Blend, Soroswap, and DeFindex) reintroduces richer, composable state where ordering can matter more, so the extractable surface grows as on-chain DeFi grows. The honest summary is that Stellar's fee model and SCP-based, quorum-driven ordering blunt the most predatory MEV patterns seen elsewhere, but any public ledger with shared liquidity leaves some ordering value on the table.",
      ],
      example:
        "On a mempool-driven chain, a searcher who sees your pending large XLM buy can sandwich it: buy just before you to push the price up, let your order execute at the inflated rate, then sell right after — you get a worse fill and they pocket the difference. On Stellar the same searcher has no persistent public mempool to snipe from, ledgers close in seconds, and same-fee transactions are selected without a pure highest-bid auction, so that clean sandwich is far harder to land — but a fast bot racing a competing path payment into the very next ledger close is still a real, if narrower, form of extraction.",
    },
    {
      id: "c35-l5",
      title: "How does arbitrage affect the prices you see in this app?",
      paragraphs: [
        "Every price this app shows you is downstream of arbitrage. When the Manual Trading tab quotes a YOU SELL / YOU BUY rate, or the token detail page draws candlesticks with hour, day, week, and year tabs, those numbers come from live SDEX order books and AMM pools that arbitrageurs are continuously policing. Because they keep the pool price, the order-book price, and outside-exchange prices tightly aligned, the rate you trade against is effectively a market rate rather than a stale or manipulated one. You benefit from their work without ever seeing it happen.",
        "This also means the app rarely offers you a suspiciously good price, and that is a feature, not a disappointment. If the SDEX or an AMM pool briefly showed XLM far below its value everywhere else, arbitrageurs would have already traded that gap away — usually within a ledger or two — before your order could reach it. Practically, it tells you that when you set a limit order or an editable slippage tolerance on a market order, you should benchmark against the prevailing efficient price, because trying to fill meaningfully better than the aligned market is trying to out-race the same bots that erased the gap. When the AI analyst proposes a trade with a confidence score, its expected fills assume this same competitive, arbitrage-tightened pricing.",
        "There is a flip side worth internalising. Arbitrage narrows spreads and aligns venues, but it does not remove the costs baked into a trade: the 0.30% AMM pool fee, order-book spread on thin pairs, network fees, and your own slippage tolerance all still apply, and on low-liquidity tokens the aligned price can still be far from where you could actually exit at size. Efficient does not mean free or infinitely deep. Reading the app's price as a fair, arbitrage-maintained snapshot — while respecting fees, depth, and slippage — is the realistic mental model. None of this is investment advice; it is a description of how the plumbing behind your quotes behaves.",
      ],
      example:
        "You open the token detail page for a liquid pair and see XLM at 0.1207 USDC on both the chart and the YOU SELL form. That agreement is not luck: arbitrage bots have already reconciled the AMM pool, the SDEX book, and outside venues to within a fraction of a percent, so the app can only show you the real market rate. If you then set a limit sell at 0.1240 hoping to beat the market, it may simply never fill — you would be asking to sell above the price the arbitrageurs have pinned as fair, and the same competition that tightened the spread is what stops that optimistic fill from happening.",
    },
  ],
  quiz: [
    {
      id: "c35-q1",
      prompt: "What most precisely defines an arbitrage trade?",
      options: [
        {
          text: "Buying an asset you expect to rise in value over the coming weeks.",
          explanation:
            "That is directional speculation, not arbitrage. Arbitrage does not depend on a future price move; it captures a gap that exists between venues right now for the same asset.",
        },
        {
          text: "Holding an asset for a long time to earn network rewards.",
          explanation:
            "That describes yield or staking-style income, not arbitrage. Arbitrage is about exploiting a momentary cross-venue price mismatch, not about holding for rewards.",
        },
        {
          text: "Buying the same asset where it is cheap and selling it where it is expensive at essentially the same moment, capturing the price gap.",
          explanation:
            "Correct. Arbitrage harvests a price difference for the identical asset across venues, with near-simultaneous legs so the profit is directionally neutral rather than a bet on the market's direction.",
        },
        {
          text: "Deliberately buying at the top of a price spike because momentum is strong.",
          explanation:
            "That is momentum chasing and carries full directional risk. Arbitrage is the opposite: it seeks a risk-minimised gap between two prices for the same thing, not a directional entry.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q2",
      prompt: "Why is a Stellar path payment that starts and ends in the same asset such a natural tool for arbitrage?",
      options: [
        {
          text: "Because it lets you convert an asset without ever paying any network fee.",
          explanation:
            "Incorrect. A path payment still pays the tiny base network fee (~0.00001 XLM). Its value for arbitrage is atomic multi-hop conversion, not fee avoidance.",
        },
        {
          text: "Because it hops through multiple order books and pools in one atomic operation, so if the loop is not profitable it reverts and you lose only the trivial fee.",
          explanation:
            "Correct. The all-or-nothing loop, with a strict minimum received, means the price gap cannot slip away between legs — atomicity removes the leg risk that plagues manual arbitrage.",
        },
        {
          text: "Because it guarantees the price will move in your favour after you send it.",
          explanation:
            "Incorrect. Nothing guarantees a favourable move. The point is precisely that a same-asset path payment does not need one — it either fills the pre-computed profitable loop atomically or reverts.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c35-q3",
      prompt: "Which statement best captures what arbitrageurs do for the wider market?",
      options: [
        {
          text: "They align the same asset's price across the SDEX, AMM pools, and outside exchanges, tightening spreads and adding effective liquidity — pushing toward market efficiency.",
          explanation:
            "Correct. Buying cheap venues and selling expensive ones drags prices into alignment, narrows bid-ask spreads, and lets large orders move price less, which is exactly what market efficiency describes.",
        },
        {
          text: "They widen spreads and pull venue prices apart, making the market less predictable.",
          explanation:
            "This is the reverse of reality. Arbitrage narrows spreads and pulls prices together; it is the corrective force against divergence, not the cause of it.",
        },
        {
          text: "They exist only to manipulate prices and always harm ordinary traders.",
          explanation:
            "Incorrect. Arbitrageurs act for their own profit, but the side effect is more consistent, fairly priced venues; they protect ordinary traders from stale, off-market quotes rather than harming them.",
        },
        {
          text: "They remove all trading costs, so ordinary traders pay nothing to trade.",
          explanation:
            "Incorrect. Arbitrage tightens spreads but never removes the 0.30% AMM pool fee, order-book spread on thin pairs, network fees, or your own slippage; efficient is not the same as free.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c35-q4",
      prompt: "How does Stellar's design affect MEV (Maximal Extractable Value) compared with a typical mempool-driven chain?",
      options: [
        {
          text: "Stellar completely eliminates MEV, so no ordering-based extraction is possible at all.",
          explanation:
            "Overstated. Stellar blunts the worst patterns, but observers can still race competing path payments into the same ledger and Soroban DeFi grows the extractable surface — MEV is limited, not eliminated.",
        },
        {
          text: "Stellar has more MEV than other chains because it runs a permanent public mempool auction like Ethereum.",
          explanation:
            "Incorrect. Stellar does not run an Ethereum-style gas-price mempool auction; the lack of a long-lived public mempool is precisely why classic front-running is harder there.",
        },
        {
          text: "Stellar makes classic MEV harder — SCP quorum-based ordering, fast ledgers, no long-lived public mempool, and randomised same-fee selection instead of a pure gas auction — but does not remove it entirely.",
          explanation:
            "Correct. The Stellar Consensus Protocol's Federated Byzantine Agreement, flat-ish fees with surge-priced randomised selection, and the absence of a farmable mempool blunt front-running and sandwiching, yet some ordering value always remains on a public ledger.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q5",
      prompt: "You set a limit sell for XLM well above the price the app currently shows on a liquid pair. Given how arbitrage shapes prices, what should you expect?",
      options: [
        {
          text: "It will almost certainly fill instantly, because arbitrage guarantees prices rise to meet any limit order.",
          explanation:
            "Incorrect. Arbitrage aligns prices to fair value; it does not push them up to satisfy your optimistic order. A sell far above the aligned market simply sits unfilled.",
        },
        {
          text: "It may never fill, because arbitrageurs have already pinned the price near fair value across venues, so asking to sell well above that is trying to out-race the same bots that closed the gap.",
          explanation:
            "Correct. On a liquid pair the SDEX, pools, and outside exchanges are tightly aligned by arbitrage, so a fill meaningfully above that efficient price is exactly what the competitive market prevents.",
        },
        {
          text: "The app will secretly adjust the market price upward so your order fills at your target.",
          explanation:
            "Incorrect. The app shows live SDEX and AMM prices maintained by external arbitrage; it does not and cannot move the market to satisfy an individual limit order.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

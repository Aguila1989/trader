// Chapter 40: General market-structure education. An ADVANCED chapter teaching
// concepts that apply across crypto markets broadly (not any one venue or
// product): order books vs AMMs, makers vs takers, spread and slippage,
// perpetual futures and funding rates, and why execution cost decides whether
// a thin statistical edge actually survives trading. Public-scope content only
// — no mention of any specific operating mode, provider, or internal feature;
// it teaches the concepts a trader needs to reason about any exchange.
import type { Chapter } from "../../types";

export const chapter40: Chapter & { whoFor: string } = {
  id: "c40",
  number: 40,
  level: "ADVANCED",
  whoFor: "Anyone who wants to understand how crypto exchanges actually work under the hood",
  title: "Market Structure: Order Books, AMMs, and Execution Cost",
  description:
    "Order books vs AMMs, makers vs takers, spread and slippage, perpetual futures and funding rates, and why execution cost is what decides whether an edge survives.",
  lessons: [
    {
      id: "c40-l1",
      title: "Two ways a market organizes trades: the order book and the AMM",
      paragraphs: [
        "Every trading venue has to solve the same problem: match someone who wants to buy with someone who wants to sell, at a price both sides accept. There are two dominant designs for doing that, and almost every exchange you will ever use, on any chain, is built on one of them.",
        "The first is the order book, sometimes called a central limit order book or CLOB. It is a live, ranked list of standing offers: everyone who wants to buy names a price and a size, everyone who wants to sell does the same, and the venue matches them whenever a buy and a sell price cross. You have almost certainly seen one — it is the classic stack of green buy prices and red sell prices you see on any exchange's trading screen. An order book only works when there is someone on the other side willing to trade at (or near) your price; if nobody is offering near where you want to trade, your order simply sits there unfilled.",
        "The second is the automated market maker, or AMM. Instead of matching individual people, an AMM holds a shared pool of two assets and prices every trade off a formula based on how much of each asset is currently in the pool. There is no counterparty to find — you always trade against the pool itself, and the pool always quotes a price, even for a pair nobody has traded in hours. The tradeoff is that a large trade measurably shifts the pool's own price (this is called price impact), because you are changing the ratio of assets the formula prices from.",
        "Neither design is simply better than the other — they suit different situations. An order book gives precise control (you can name an exact price and wait) and tends to offer tighter pricing on actively-traded pairs where many people are quoting. An AMM guarantees you can always trade something, instantly, even on an obscure pair, at the cost of that trade moving the price more as it gets bigger. Understanding which one you are trading against changes how you should think about the price you are quoted.",
      ],
      example:
        "Say you want to trade a well-known pair like ETH/USDC. On an order-book exchange, you would see a ladder of resting buy and sell orders and your trade fills against whichever of those is best. On an AMM-based exchange, there is no ladder to look at at all — you simply see a quoted price computed from the pool's current reserves, and a small trade barely moves it while a very large one visibly does, because the trade itself is what shifts the ratio the formula prices from.",
    },
    {
      id: "c40-l2",
      title: "Makers and takers: who provides liquidity, and who pays for it",
      paragraphs: [
        "On an order-book exchange, every trader falls into one of two roles for any given trade, and the distinction matters because it usually determines what you pay in fees. A maker places an order that does not fill immediately — it rests on the book, adding a visible price where someone else could trade, and effectively supplying liquidity for others to use. A taker places an order that fills right away against an order already resting on the book — they consume the liquidity the maker supplied, taking whatever price was on offer rather than waiting for their own.",
        "Because makers are the ones supplying the book with prices to trade against, most exchanges reward that behavior: maker fees are typically lower than taker fees, and on some venues makers are actually paid a small rebate to place resting orders, funded by the higher fee taken from takers. The logic is simple — a venue with a thin, empty order book is unattractive to trade on, so exchanges have a direct incentive to pay people to keep it populated with resting quotes.",
        "The same maker/taker split shows up in an AMM context too, just under different names: a liquidity provider deposits assets into the pool (the AMM's version of a maker, supplying the reserves everyone trades against) and earns a cut of every trading fee the pool collects, while anyone swapping against the pool (the taker) pays that fee as the cost of instant execution.",
        "This distinction is worth internalizing whenever you place any order, on any venue: a limit order that sits and waits behaves like a maker order, usually cheaper, but with no guarantee of ever filling; a market order that takes whatever is currently on offer behaves like a taker order, usually a little more expensive, but it fills immediately.",
      ],
      example:
        "Two traders both want to buy the same asset at the same moment. The first places a limit order slightly below the current market price and waits — it rests on the book as a maker order, paying the lower maker fee, but only fills if the price actually dips to meet it. The second places a market order right now, taking whatever sell orders are currently resting on the book — it fills instantly, pays the higher taker fee, and gets whatever price those resting orders were offering, which may be a little worse than the first trader's patient limit price.",
    },
    {
      id: "c40-l3",
      title: "Spread and slippage: the two costs hiding in every trade",
      paragraphs: [
        "The spread is the gap between the best price someone is willing to buy at and the best price someone is willing to sell at, right now, on an order book. A tight spread (buy and sell prices close together) means the market is liquid and heavily traded; a wide spread means fewer people are actively quoting, so there is a bigger built-in cost just to cross from one side to the other. Even a trade that fills instantly, at the best available price, still pays this cost — it is the difference between where you could sell and where you could buy the same instant.",
        "Slippage is different: it is the gap between the price you expected when you placed a trade and the price you actually got once it filled. It happens whenever your order is large enough, or the market moves fast enough, that filling it eats through more than just the very best price on offer — a large market order can fill part of itself at the best price, then more at a slightly worse one, and so on, until the whole size is filled. On an AMM, slippage is really the same idea expressed through the pricing formula: the larger your trade relative to the pool, the more the pool's price moves against you by the time your trade finishes.",
        "Both costs grow with two things: how large your trade is relative to the available liquidity, and how thinly-traded the asset is in general. A small trade in a heavily-traded pair barely touches either cost; the same trade size in an illiquid, rarely-traded pair can cost noticeably more, purely from spread and slippage, before any exchange fee is even applied.",
        "Most exchanges let you set a maximum slippage tolerance on a trade — the largest gap between expected and actual price you are willing to accept before the trade is rejected instead of executed. This exists to protect you: without it, a sudden burst of volatility between placing an order and it filling could execute you at a dramatically worse price than you intended.",
      ],
      example:
        "Picture a thinly-traded token where the best buy offer is 0.098 and the best sell offer is 0.102 — a wide 4% spread just to cross the book. You place a market order to buy a large amount: it fills part of the size at 0.102, but there is not enough resting there, so the rest fills at 0.104, then 0.107, for an average fill price well above the 0.102 you first saw quoted. That gap between the 0.102 you expected and the roughly 0.105 average you actually paid is slippage, stacked on top of the spread you already paid just by being a taker.",
    },
    {
      id: "c40-l4",
      title: "Perpetual futures and funding rates",
      paragraphs: [
        "A perpetual future (often shortened to \"perp\") is a derivative contract that lets you take a leveraged, directional bet on an asset's price without ever owning the underlying asset itself. Unlike a traditional futures contract, a perp has no expiry date — it can, in principle, be held indefinitely — which is exactly what makes it \"perpetual\" and why it has become one of the most heavily-traded instrument types in crypto.",
        "Because a perp never expires and settles, exchanges need some mechanism to keep its price closely tracking the actual spot price of the underlying asset — otherwise the two could drift apart indefinitely with nothing to pull them back together. That mechanism is the funding rate: a periodic payment exchanged directly between traders holding long positions (betting the price rises) and traders holding short positions (betting it falls), calculated from how far the perp's price has drifted from the spot price.",
        "The direction of the funding payment tells you which side the crowd is leaning. When the perp trades above spot (more demand to go long than short), longs pay shorts — a cost for staying long that nudges some longs to close and some shorts to open, pulling the perp price back down toward spot. When the perp trades below spot, the payment flips: shorts pay longs, nudging the price back up. Funding is not a fee paid to the exchange; it is a direct transfer between the two sides of the market, which is why it can occasionally be a genuine source of yield (being on the side that collects funding) rather than only a cost.",
        "Funding rates are usually quoted per-period (commonly every one or eight hours) and can swing from mildly positive to sharply negative depending on how one-sided market sentiment has become. A persistently large funding rate is itself information: it signals that one side of the trade has gotten crowded, and crowded positioning is often what precedes a sharp move as those over-extended positions get forced to close.",
      ],
      example:
        "Imagine a perpetual future on an asset is trading noticeably above its spot price because far more traders want to be long than short. Every funding interval, the longs collectively pay a small percentage of their position value to the shorts. If you are long and holding through many funding intervals while the market stays this one-sided, that steady drip of funding payments can quietly erode your position's return even while the price itself is flat — a cost that has nothing to do with spread or slippage, and everything to do with which side of a crowded trade you are on.",
    },
    {
      id: "c40-l5",
      title: "Why execution cost decides whether a thin edge survives",
      paragraphs: [
        "A trading \"edge\" is a statistical tendency — some pattern that, on average, makes one side of a trade slightly more likely to be profitable than the other. Almost every edge worth trading is thin: a few basis points (hundredths of a percent) of expected advantage per trade, not a dramatic mispricing. That thinness is exactly why execution cost matters so much more than it first appears to.",
        "Every trade you make pays some combination of spread, slippage, and exchange fees (maker or taker), plus — on a perp — potential funding drag if you hold through unfavorable periods. None of these costs care whether your underlying edge is real; they are charged on every single trade, win or lose. If your edge is worth 10 basis points per trade on average, but spread plus slippage plus fees cost you 8 basis points every time you act on it, you have not captured a 10 basis-point edge — you have captured 2, and a single unlucky trade with worse-than-usual slippage can wipe that out entirely.",
        "This is why the same underlying statistical edge can be genuinely profitable on a deep, liquid, low-fee venue and a genuine loser on a thin, wide-spread, high-fee one, even though the pattern in the price data is identical in both places. The edge does not live in a vacuum — it lives inside a specific cost structure, and that cost structure is set by how liquid the market is, how wide the spread runs, how much slippage a given trade size causes, and which side of maker/taker you land on.",
        "The practical takeaway is to always evaluate a strategy's edge net of realistic execution costs, not against the clean mid-price a chart shows you. A backtest that ignores spread, slippage, and fees will systematically overstate how good a strategy looks, because it is measuring a price nobody could have actually traded at. The size of the true edge, measured against real trading costs on the actual venue and size you intend to trade, is what ultimately decides whether an idea is worth acting on at all.",
      ],
      example:
        "Suppose research shows a pattern that is profitable by 12 basis points per trade on average, measured at the mid-price. On a deep, tightly-spread market where round-trip costs run about 3 basis points, that edge survives comfortably, leaving roughly 9 basis points of real expected profit per trade. Run the exact same pattern on a thin market where the spread alone eats 15 basis points round-trip, and the same statistical edge is now a loser before you even count slippage — the pattern in the price data never changed, only the cost of acting on it did.",
    },
  ],
  quiz: [
    {
      id: "c40-q1",
      prompt: "What is the key structural difference between an order-book (CLOB) exchange and an AMM?",
      options: [
        {
          text: "An order book matches individual buy and sell orders at prices people name; an AMM prices every trade off a formula against a shared pool of reserves, with no individual counterparty to match against.",
          explanation:
            "Correct. An order book needs a matching counterparty at your price; an AMM always quotes a price from its pool via a formula, at the cost of larger trades moving that price more.",
        },
        {
          text: "An order book only exists on centralized exchanges, while AMMs only exist on decentralized ones.",
          explanation:
            "No. Both order books and AMMs appear across centralized and decentralized venues — the distinction is about how trades are matched and priced, not about custody or the type of platform.",
        },
        {
          text: "An AMM guarantees a better price than an order book on every trade.",
          explanation:
            "No. Neither design is inherently better-priced — an order book can offer tighter pricing on actively-quoted pairs, while an AMM guarantees you can always trade, at the cost of price impact on larger trades.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q2",
      prompt: "Why do most order-book exchanges charge makers lower fees (or pay them rebates) compared to takers?",
      options: [
        {
          text: "Makers place resting orders that supply the book with liquidity for others to trade against, and a thin, empty book is unattractive to trade on — so exchanges are incentivized to reward the behavior that keeps it populated.",
          explanation:
            "Correct. Makers add depth to the book by waiting; takers consume that depth immediately. Rewarding makers keeps the book liquid, which benefits the exchange and every trader on it.",
        },
        {
          text: "Makers are large institutional traders and takers are always small retail traders.",
          explanation:
            "No. Maker and taker are roles determined by whether an order rests on the book or fills immediately — anyone, retail or institutional, can be either depending on the order type they use.",
        },
        {
          text: "Taker fees are actually always lower, because takers help match up open orders faster.",
          explanation:
            "No. It is typically the reverse — makers usually pay lower fees (sometimes even a rebate) because they are the ones supplying liquidity, while takers pay more for the convenience of an immediate fill.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q3",
      prompt: "What is the difference between spread and slippage?",
      options: [
        {
          text: "Spread is the gap between the best current buy and sell price on the book right now; slippage is the gap between the price you expected when placing a trade and the price you actually got once it filled.",
          explanation:
            "Correct. Spread exists even for an instant, tiny trade at the best price. Slippage shows up when your trade is large or the market moves fast enough that the fill eats through more than the single best price.",
        },
        {
          text: "They are two names for exactly the same cost, and exchanges just use whichever term fits their marketing.",
          explanation:
            "No. They are distinct costs that both eat into a trade — spread is a built-in gap on the book, slippage is the extra cost of a fill moving through multiple price levels or an AMM's formula shifting mid-trade.",
        },
        {
          text: "Spread only applies to AMMs and slippage only applies to order books.",
          explanation:
            "No. Spread is most visible on order books, but both concepts apply on either design — an AMM's price-impact-driven fill degradation is functionally the same idea as slippage on an order book.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q4",
      prompt: "What actually determines the direction of a perpetual future's funding payment?",
      options: [
        {
          text: "How far the perp's price has drifted from the underlying spot price — longs pay shorts when the perp trades above spot, and shorts pay longs when it trades below spot.",
          explanation:
            "Correct. Funding is the mechanism that pulls a never-expiring perp's price back toward spot, paid directly between the crowded side and the other side of the market.",
        },
        {
          text: "The exchange decides funding direction based on how much fee revenue it wants to collect that period.",
          explanation:
            "No. Funding is a transfer between traders, not a fee collected by the exchange — its direction is set by how the perp's price compares to spot, not by exchange revenue targets.",
        },
        {
          text: "Funding always flows from shorts to longs, regardless of price, as compensation for the risk of being short.",
          explanation:
            "No. Funding direction is not fixed — it flips depending on whether the perp is trading above or below the underlying spot price at the time.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q5",
      prompt: "A pattern in the price data shows a 12 basis-point average edge per trade at the mid-price. Why might that same pattern still lose money in practice?",
      options: [
        {
          text: "Because spread, slippage, and fees are charged on every trade regardless of whether the underlying pattern is real, and if those costs exceed the edge, the strategy is a net loser even though the mid-price pattern is genuine.",
          explanation:
            "Correct. A thin statistical edge is only real profit once realistic execution costs are subtracted — the same pattern can be profitable on a cheap venue and a loser on an expensive one.",
        },
        {
          text: "Because a genuine mid-price edge is always fully realized regardless of trading costs — costs only matter for edges that were never real to begin with.",
          explanation:
            "No. Even a genuine mid-price pattern can be erased entirely by execution costs; the size of the true, tradable edge is always the mid-price edge minus realistic spread, slippage, and fees.",
        },
        {
          text: "Because mid-price edges are a myth and no pattern measured that way is ever tradable.",
          explanation:
            "No. Mid-price patterns can be genuinely predictive — the point is that whether they are profitable to actually trade depends entirely on the execution costs of the venue and size you trade at.",
        },
      ],
      correctIndex: 0,
    },
  ],
};

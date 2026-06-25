import type { Chapter } from "../../types";

export const chapter02: Chapter = {
  id: "c2",
  number: 2,
  level: "BASIC",
  title: "Understanding Prices",
  description: "How prices form on the SDEX order book, and why bids, asks, spread, slippage, and liquidity all shape what you actually pay.",
  lessons: [
    {
      id: "c2-l1",
      title: "What is a market price?",
      paragraphs: [
        "A market price is not a fixed sticker set by some authority. It is simply the price at which someone is willing to buy and someone else is willing to sell right now. When you see XLM quoted in USDC, that number is the most recent agreement between a buyer and a seller, or the best price currently on offer.",
        "Because prices come from people, they move constantly. Every new offer, cancelled offer, or completed trade can nudge the number up or down. There is no single true price, only the price you can actually transact at this moment.",
        "This bot reads live prices straight from the Stellar Decentralized Exchange, the SDEX. The token detail view plots them as a price chart with hourly, daily, weekly, and yearly candles, so you can see how the agreed price has drifted over time rather than just the latest tick.",
      ],
      example: "Suppose XLM last traded at 0.118 USDC. A minute later, sellers lower their offers and the best price you can buy at becomes 0.117 USDC. Nobody announced a change; the market price simply moved because the cheapest willing seller changed. The candle chart would show that small dip as the latest hourly bar.",
    },
    {
      id: "c2-l2",
      title: "What is an order book and how do you read it?",
      paragraphs: [
        "An order book is a live list of everyone's standing offers to buy and to sell a token. The bot trades directly against this book on the SDEX, rather than against a pooled-funds AMM. In the Manual Trading tab, the Order book panel shows two stacked lists.",
        "The green side is the bids: people wanting to buy, shown with the highest price at the top. The red side is the asks: people wanting to sell, shown with the lowest price at the top. The two best prices facing each other at the centre are the top of book, the immediate prices you would trade at.",
        "Each row also shows how much volume sits at that price. In the bot you can click a bid level and it fills that exact price into the order form, saving you from typing it. Reading the book tells you not just the price, but how much you can trade before the price gets worse.",
      ],
      example: "You open the Order book for XLM and USDC. The top green bid reads 0.117 for 4,000 XLM, and below it 0.116 for 9,000 XLM. The top red ask reads 0.119 for 3,000 XLM. So 4,000 XLM could sell at 0.117; selling more would dip into the 0.116 level. Clicking the 0.117 bid drops that price into your order form instantly.",
    },
    {
      id: "c2-l3",
      title: "What is a bid, an ask, and a spread?",
      paragraphs: [
        "A bid is the price a buyer offers to pay. An ask is the price a seller wants to receive. The best bid is always a little lower than the best ask, because nobody offers to pay more than the cheapest seller is asking. The gap between those two best prices is the spread.",
        "The bot shows this spread directly, measured in basis points, where one basis point is one hundredth of one percent. An InfoTip in the app defines it for you: the difference between the best buy and best sell price, where a wider spread means a higher hidden cost per trade.",
        "Spread matters because it is a cost you pay simply for trading. If you buy at the ask and immediately sell at the bid, you lose the spread. That is why this bot watches it closely; the strategy here is mostly about capturing tiny spreads, and a wide one can wipe out the edge entirely.",
      ],
      example: "If the best bid for XLM is 0.117 USDC and the best ask is 0.119 USDC, the spread is 0.002 USDC. As a fraction of price that is about 1.7 percent, or roughly 170 basis points, which the bot would flag as wide. Buy then instantly sell, and you would be down that 0.002 per XLM before any other fees.",
    },
    {
      id: "c2-l4",
      title: "What is slippage and why does it happen?",
      paragraphs: [
        "Slippage is the difference between the price you expected and the price you actually got. You see a token at one price, but by the time your order executes, you fill at a slightly worse one. The bot's order form has a Slippage tolerance field where you set the most you are willing to accept.",
        "It happens for two main reasons. First, prices move between the moment you decide and the moment your order lands; someone else may trade first. Second, your order may be larger than the volume at the best price, so it eats into worse levels deeper in the order book to fill completely.",
        "The app's InfoTip puts it plainly: slippage is the maximum percent difference between the expected price and the actual execution price you are willing to accept. Setting it too tight may cancel your trade; setting it too loose lets you fill at a bad price. It is a guardrail you tune for each trade.",
      ],
      example: "You want to buy 10,000 XLM and the best ask is 0.119 USDC, but only 3,000 XLM sits there. The next 7,000 fill at 0.120. Your average price becomes about 0.1197, slightly above the 0.119 you saw. If your Slippage tolerance was set to 0.5 percent, this 0.6 percent move would cancel the order instead of filling it.",
    },
    {
      id: "c2-l5",
      title: "What is liquidity and why does it matter?",
      paragraphs: [
        "Liquidity is how much you can trade near the current price without pushing it around. A liquid market has lots of volume stacked close together on both sides of the order book, so even a sizeable order fills with little slippage. A thin market has only small offers, so any decent-sized trade moves the price sharply.",
        "The bot tracks each market's trading volume over the last 24 hours and treats it as a health check. If a market is too thin, it simply refuses to trade there, because the spread and slippage would make any edge unprofitable and getting back out cleanly could be difficult.",
        "For you as a manual trader, liquidity is why two markets at the same price can feel completely different. A deep book lets you trade confidently; a shallow one means your own order is the thing moving the price against you. Always glance at the depth in the Order book panel before sizing a trade.",
      ],
      example: "XLM and USDC might show 800,000 USDC of volume over 24 hours with thousands of XLM at each price level, so a 5,000 XLM order barely moves it. A tiny token with only 200 USDC of daily volume and 50 units per level would lurch on the same order, so the bot would skip it entirely as too thin.",
    },
  ],
  quiz: [
    {
      id: "c2-q1",
      prompt: "In the bot's Order book panel, what does the green side show and how is it ordered?",
      options: [
        {
          text: "Bids from buyers, with the highest price at the top.",
          explanation: "Correct. Green is the bids, sorted highest-first so the best buy price sits at the top of book.",
        },
        {
          text: "Asks from sellers, with the lowest price at the top.",
          explanation: "Incorrect. Asks are the red side; the lowest ask is the best sell price, but that is not the green list.",
        },
        {
          text: "Completed trades from the last hour, newest first.",
          explanation: "Incorrect. The order book shows standing offers, not a history of past trades.",
        },
        {
          text: "The AMM pool balances backing the market.",
          explanation: "Incorrect. This bot trades the SDEX order book, not AMM pools, so there are no pool balances shown here.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c2-q2",
      prompt: "The best bid for XLM is 0.117 USDC and the best ask is 0.119 USDC. What is the spread, and why does it matter?",
      options: [
        {
          text: "It is 0.236 USDC, the sum of both prices, and it is the profit you make per trade.",
          explanation: "Incorrect. Spread is the difference, not the sum, and it is a cost you pay, not a profit.",
        },
        {
          text: "There is no spread because both numbers are close, so trading is free.",
          explanation: "Incorrect. Any gap between best bid and best ask is a real spread and a real cost.",
        },
        {
          text: "It is 0.002 USDC, the gap between best bid and ask, and it is a hidden cost per trade.",
          explanation: "Correct. 0.119 minus 0.117 is 0.002; buying at the ask and selling at the bid loses you that spread.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c2-q3",
      prompt: "Why does slippage happen when you place a larger order?",
      options: [
        {
          text: "The exchange charges a penalty fee for orders above a fixed size.",
          explanation: "Incorrect. Slippage is not a flat penalty fee; it comes from how the order book fills.",
        },
        {
          text: "The order eats through the best price level and fills the rest at worse prices deeper in the book.",
          explanation: "Correct. If your size exceeds the volume at the best price, the remainder fills at worse levels, worsening your average price.",
        },
        {
          text: "The bot deliberately worsens your price to capture the spread for itself.",
          explanation: "Incorrect. Slippage comes from limited depth and moving prices, not from the bot working against you.",
        },
        {
          text: "Slippage only happens on tiny orders, never on large ones.",
          explanation: "Incorrect. Larger orders are more likely to slip, because they more easily exhaust the volume at the best price.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c2-q4",
      prompt: "Why does the bot refuse to trade in a market with very low 24-hour volume?",
      options: [
        {
          text: "Low volume means the token is brand new and not yet listed on the SDEX.",
          explanation: "Incorrect. A market can be listed and still be thin; low volume is about depth, not listing status.",
        },
        {
          text: "Thin liquidity means wide spreads and heavy slippage, so any edge is eaten and exiting cleanly is hard.",
          explanation: "Correct. Without depth near the price, the spread and slippage costs make trades unprofitable and risky to unwind.",
        },
        {
          text: "Low volume always means the price is about to crash.",
          explanation: "Incorrect. Thin volume does not predict direction; it predicts higher trading cost and difficulty exiting.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

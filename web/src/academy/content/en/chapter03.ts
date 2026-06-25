import type { Chapter } from "../../types";

export const chapter03: Chapter = {
  id: "c3",
  number: 3,
  level: "BASIC",
  title: "Your First Trade",
  description: "Place your first manual trade: read the YOU SELL / YOU BUY form, choose market or limit, understand fees, and send tokens safely.",
  lessons: [
    {
      id: "c3-l1",
      title: "What does buying and selling a token mean?",
      paragraphs: [
        "Every trade is really a swap. You give away a token you already hold and receive a different token in return. There is no separate cash account behind the scenes, so to buy something you must spend something else you already own.",
        "In this app the swap is always framed as a sell. You pick a token under YOU SELL, then pick the token you want under YOU BUY. Internally the bot treats this as selling the YOU SELL asset in exchange for the YOU BUY asset, even when it feels like you are simply buying.",
        "Because you can only give away what you hold, the YOU SELL dropdown only lists tokens already in your wallet. If a token is not there, you have none of it to spend, so swap into it first from something you do hold.",
      ],
      example: "You hold 500 XLM and want some USDC. You set YOU SELL to XLM and YOU BUY to USDC, spending 100 XLM. The bot sells 100 XLM for USDC at the going rate. To later return to XLM, you would swap the other way: YOU SELL USDC, YOU BUY XLM.",
    },
    {
      id: "c3-l2",
      title: "What is the difference between a market order and a limit order?",
      paragraphs: [
        "The form has a Limit and Market toggle. The app describes them like this: Limit rests at the price you set and fills only at that price or better. Market fills immediately against the current best price in the book.",
        "A market order is fast and simple. It takes whatever the best price is right now, so it almost always fills, but you cannot control the exact rate you get. A limit order lets you name your price and wait, but it only fills if the market reaches that price, and it may never fill at all.",
        "When you choose Limit you must type a price. When you choose Market the bot uses the live best bid for you, so no price is needed. Beginners often start with small market orders to learn, then switch to limits for patience and control.",
      ],
      example: "USDC is trading around 0.085 XLM each. A market order to sell XLM fills instantly near 0.085. A limit order set to buy USDC only when XLM-per-USDC drops to 0.080 stays resting in the book and fills only if the price falls there; if it never does, nothing happens.",
    },
    {
      id: "c3-l3",
      title: "How to read the YOU SELL / YOU BUY interface in this app",
      paragraphs: [
        "The form reads top to bottom. YOU SELL is the token you give away, chosen from a dropdown of tokens you hold. YOU BUY is the token you receive, chosen from the full curated token universe. A live summary restates this as You sell X, you buy Y so there is no confusion.",
        "The Price field shows the YOU BUY amount per 1 unit of YOU SELL. Available balance tells you how much of the YOU SELL token you can spend. Slippage tolerance, as a percent, is how far the price may drift before the order is cancelled to protect you.",
        "An Advanced section adds an optional Target price and Invalidation price. These are reminders for your own plan and are optional. Every order also runs a balance pre-check before signing, so the bot refuses to submit a trade you cannot actually fund.",
      ],
      example: "You set YOU SELL to XLM, YOU BUY to USDC, Price 0.085, and Slippage 1 percent. Available balance reads 500 XLM. You enter 100 XLM. The summary says You sell 100 XLM, you buy about 8.5 USDC. If the rate moves more than 1 percent before filling, the order is cancelled instead of giving you a worse deal.",
    },
    {
      id: "c3-l4",
      title: "What is a trading fee and how much does Stellar charge?",
      paragraphs: [
        "On many exchanges you pay a percentage fee on every trade, sometimes one or two percent. Stellar works differently. The SDEX, the decentralised exchange this bot trades on, charges no percentage trading fee at all. You only pay a tiny network fee plus the spread.",
        "The network fee is paid in XLM and is charged per operation. The current base fee is 100 stroops, which is 0.00001 XLM per operation, a fraction of a US cent. A stroop is the smallest unit of XLM, one ten-millionth of a single XLM.",
        "The real cost to watch is the spread, the gap between the best buy and sell prices. Crossing a wide spread costs far more than the network fee. So size your trades around the spread, not around the network fee, which is almost negligible.",
      ],
      example: "You place one market order to sell XLM for USDC. The network fee is 100 stroops, or 0.00001 XLM, well under a cent. There is no percentage cut on top. If the spread between buy and sell prices is 0.3 percent, that spread, not the fee, is your main trading cost on the swap.",
    },
    {
      id: "c3-l5",
      title: "How to safely send tokens to another wallet",
      paragraphs: [
        "Apart from trading, the wallet has a Send and Pay feature for moving tokens to another address. You enter a destination public key, which starts with the letter G, then choose the asset, the amount, and an optional memo. Some exchanges require that memo to credit your deposit, so do not skip it when asked.",
        "Stellar payments are irreversible. If you type the wrong address there is no undo and no support desk to claw the funds back. So double-check the destination character by character, and never paste an address you have not confirmed from a trusted source.",
        "For any non-native asset, like USDC, the recipient must already hold a trustline for that asset, otherwise the payment fails. The safe habit is always the same: send a tiny test amount first, confirm it arrives, then send the rest.",
      ],
      example: "You want to send 200 USDC to a friend whose address starts with GBXY and ends with 7QWP. You first send 1 USDC as a test. It arrives, confirming both the address and that their wallet has a USDC trustline. Only then do you send the remaining 199 USDC, adding the memo their exchange requested.",
    },
  ],
  quiz: [
    {
      id: "c3-q1",
      prompt: "In this app, what is really happening when you fill in YOU SELL XLM and YOU BUY USDC?",
      options: [
        { text: "You are selling XLM in exchange for USDC.", explanation: "Correct. Every trade is a swap, and the app always frames it as selling the YOU SELL asset for the YOU BUY asset." },
        { text: "You are depositing XLM into a separate cash account.", explanation: "Incorrect. There is no separate cash account; a trade swaps one token directly for another." },
        { text: "You are borrowing USDC against your XLM.", explanation: "Incorrect. No borrowing happens. You simply give away XLM and receive USDC." },
      ],
      correctIndex: 0,
    },
    {
      id: "c3-q2",
      prompt: "According to the app, what does a Market order do?",
      options: [
        { text: "It rests until the price reaches a level you typed in.", explanation: "Incorrect. That describes a limit order, which fills only at your set price or better." },
        { text: "It fills immediately against the current best price in the book.", explanation: "Correct. A market order takes the live best price right away, so it almost always fills." },
        { text: "It cancels the trade if any fee applies.", explanation: "Incorrect. Order type has nothing to do with cancelling over fees." },
        { text: "It guarantees the exact price you wanted.", explanation: "Incorrect. A market order gives speed, not price control; the rate can move as it fills." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q3",
      prompt: "Why does the YOU SELL dropdown only list certain tokens?",
      options: [
        { text: "It only shows tokens the bot recommends buying.", explanation: "Incorrect. YOU SELL is about what you give away, not recommendations." },
        { text: "It only shows tokens with no network fee.", explanation: "Incorrect. The network fee applies to operations regardless of which token you sell." },
        { text: "It only lists tokens you already hold, since you can only spend what you own.", explanation: "Correct. You can only sell tokens in your wallet, so the dropdown is limited to held assets." },
      ],
      correctIndex: 2,
    },
    {
      id: "c3-q4",
      prompt: "How much does the Stellar SDEX charge in trading fees?",
      options: [
        { text: "A flat one percent of every trade.", explanation: "Incorrect. The SDEX charges no percentage trading fee at all." },
        { text: "No percentage trading fee; only a tiny per-operation network fee of 100 stroops plus the spread.", explanation: "Correct. The base fee is 100 stroops, or 0.00001 XLM per operation, and the real cost to watch is the spread." },
        { text: "A two percent fee paid in USDC.", explanation: "Incorrect. There is no percentage cut, and the network fee is paid in XLM, not USDC." },
        { text: "Nothing at all, not even a network fee.", explanation: "Incorrect. There is still a tiny network fee of 100 stroops per operation, even though there is no percentage trading fee." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q5",
      prompt: "What is the safest first step before sending a large amount of USDC to another wallet?",
      options: [
        { text: "Send a tiny test amount first to confirm the address and trustline.", explanation: "Correct. Payments are irreversible, so a small test confirms the address is right and the recipient has a USDC trustline before you send the rest." },
        { text: "Send the full amount immediately so it cannot be intercepted.", explanation: "Incorrect. Stellar payments are irreversible; a wrong address cannot be undone, so rushing is risky." },
        { text: "Skip the memo to keep the transfer private.", explanation: "Incorrect. Some exchanges need the memo to credit your deposit, so skipping it can lose the funds." },
        { text: "Use an address you found without confirming its source.", explanation: "Incorrect. Always confirm the destination from a trusted source, since a wrong address means permanent loss." },
      ],
      correctIndex: 0,
    },
  ],
};

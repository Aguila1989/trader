// PENDING — do not activate until green light.
// BASIC chapter on Stablecoins and USDC: what a stablecoin is, what USDC is and
// who backs it, why it works as a portfolio base, the real risks (depeg), and
// how to use it in this app. Authored to the exact same shape as
// content/en/pending/chapter22.ts. The only addition is the per-chapter `whoFor`
// one-liner, typed via a local intersection so the live Chapter interface stays
// untouched until integration. New BASIC glossary terms introduced here
// (stablecoin, peg, depeg) live in glossary.pending.ts, NOT in the live
// glossary, and are spelled verbatim in the prose so the first occurrence
// auto-links to a tooltip.
import type { Chapter } from "../../../types";

export const chapter24: Chapter & { whoFor: string } = {
  id: "c24",
  number: 24,
  level: "BASIC",
  whoFor: "For anyone who wants a safe home base for their money",
  title: "Stablecoins and USDC",
  description:
    "What a stablecoin is, what USDC is and who backs it, why it works as a steady base for your portfolio, the real risks, and how to use it in this app.",
  lessons: [
    {
      id: "c24-l1",
      title: "What is a stablecoin?",
      paragraphs: [
        "A stablecoin is a token designed to hold a steady value instead of swinging up and down. Most of them aim to match one ordinary currency, one-for-one, so that one token is always meant to be worth one dollar or one euro. That target value is called the peg, and holding the peg is the whole point of the coin.",
        "Regular crypto like XLM can jump or drop a lot in a single day, which is exciting but stressful if you just want your money to sit still. A stablecoin gives you the convenience of holding value on the blockchain, where you can send and trade it instantly, while keeping the price boring and predictable.",
        "Think of a stablecoin as a digital version of a currency you already know. It moves at the speed of the network and lives in your crypto wallet, but its value is meant to stay the same as the everyday money it tracks.",
      ],
      example:
        "Imagine a digital euro: exactly the same value as a euro in your bank, one for one, but it lives on the blockchain instead of in a bank account. You could send it across the world in seconds, and one of these digital euros would still be worth one real euro. That steady one-for-one value is the peg, and a coin built to hold it is a stablecoin.",
    },
    {
      id: "c24-l2",
      title: "What is USDC and who stands behind it?",
      paragraphs: [
        "USDC is one of the most widely used stablecoins, and it aims to always equal one US dollar. It is issued by a company called Circle, which means Circle is the party that creates new USDC and promises to honour each token as one dollar. On the Stellar network, USDC is a token you can hold, send, and trade just like any other.",
        "The promise only works if the dollars are really there. For every USDC in circulation, Circle says it holds an equal amount in safe reserves, such as actual US dollars and short-term government bonds. If you ever hand back your USDC, you should be able to get a real dollar in return, and that backing is what keeps the value steady.",
        "So trusting USDC really means trusting Circle to keep enough reserves and to be honest about them. This is not financial advice, and no reserve is risk-free, but the basic idea is simple: the token is a claim on a real dollar sitting somewhere safe.",
      ],
      example:
        "Picture a coat-check counter. You hand over your coat and get a numbered ticket. The ticket is not the coat, but everyone treats it as worth exactly one coat because you trust the counter to give the coat back. USDC is that ticket, Circle runs the counter, and the reserves are the coats in the back room. As long as there is a real dollar for every ticket, the ticket holds its value.",
    },
    {
      id: "c24-l3",
      title: "Why use USDC as the base currency for your portfolio?",
      paragraphs: [
        "When you own several coins whose prices all move at once, it is hard to tell whether you are actually doing well. A stablecoin fixes this by giving you a steady yardstick. Because USDC stays close to one dollar, measuring everything against it shows your real gains and losses clearly, instead of guessing while every price wobbles.",
        "USDC is also a place to park value without leaving crypto. If you sell a coin and move the proceeds into USDC, your money is out of the market's swings but still in your wallet, ready to trade again in seconds. You do not have to cash out to a bank and wait to come back in.",
        "In this app, USDC is the primary base currency, so most buying and selling is measured and quoted against it. That makes it the natural home base you return to between trades, and a clean reference point for reading how your portfolio is doing.",
      ],
      example:
        "Think of USDC as home base in a game of tag. You run out to make a play, a trade in this case, and then you can dash back to base where you are safe and can catch your breath. Because base never moves, you always know exactly how far you have travelled, which is why holding value in USDC makes your gains and losses easy to read.",
    },
    {
      id: "c24-l4",
      title: "Are stablecoins always stable? Risks explained",
      paragraphs: [
        "The word stable is a goal, not a guarantee. A stablecoin can lose its peg and trade for less than the dollar it is supposed to match, and this is called a depeg. It might last a few hours or, in the worst cases, never fully recover. The steadiness depends entirely on the promise behind the coin actually holding up.",
        "The main worry is trust in the issuer and the reserves. If people fear the company does not really hold enough safe assets, or cannot access them, they rush to sell, and the price slips below one dollar. A depeg is usually a crisis of confidence: once holders doubt the backing, the very selling driven by that doubt pushes the price down further.",
        "This does not mean stablecoins are bad, only that no token is completely risk-free. It is worth knowing who issues a coin and how it is backed before you trust it as your base. This is educational only and not financial advice.",
      ],
      example:
        "In 2022 a stablecoin called UST, which relied on clever software rather than real dollars in reserve, lost its peg and crashed from one dollar to a few cents in days, wiping out huge amounts of value. That is a depeg at its most severe. It is the sharpest reminder that stable is a target the coin tries to hold, not a law of nature, and that the backing behind a coin really matters.",
    },
    {
      id: "c24-l5",
      title: "How to use USDC in this app for swaps and trades",
      paragraphs: [
        "Before you can hold USDC on Stellar, you need a trustline to Circle, the issuer. A trustline is a small opt-in that tells the network you are willing to hold that specific token; it costs a tiny XLM reserve and only has to be done once per token. This app can guide you through adding it, and until it exists your wallet simply cannot receive USDC.",
        "Once you hold some USDC, you use it through the Manual Trading tab's YOU SELL and YOU BUY form. To buy a coin you put USDC in the YOU SELL side and the coin you want in the YOU BUY side; to move back to safety you do the reverse and end up holding USDC again. You can trade at the current market price or set a limit price, and adjust your slippage tolerance so a fast-moving market does not fill your order at a surprise rate.",
        "Because USDC is the app's base currency, most swaps naturally pass into or out of it, making it the coin you sit in between trades. If you would like a deeper walk-through of the buy and sell form and slippage, the chapters on manual trading cover it step by step.",
      ],
      example:
        "Say you hold 100 USDC and want some XLM. You open the YOU SELL and YOU BUY form, put USDC on the sell side and XLM on the buy side, check the slippage tolerance, and confirm. Later, to lock in and rest, you run the same form the other way, selling XLM back into USDC. Your value is home in the steady base coin again, ready for the next move once you decide to make it.",
    },
  ],
  quiz: [
    {
      id: "c24-q1",
      prompt: "What best describes a stablecoin?",
      options: [
        {
          text: "A token designed to hold a steady value, usually matching one currency one-for-one.",
          explanation:
            "Correct. A stablecoin's whole purpose is to stay steady, typically pegged to one dollar or one euro, so it behaves like a digital version of ordinary money.",
        },
        {
          text: "A coin whose price is meant to rise as fast as possible.",
          explanation:
            "No. That describes a speculative asset. A stablecoin is the opposite: it aims to stay boring and unchanged, not to shoot up.",
        },
        {
          text: "The native coin that pays Stellar network fees.",
          explanation:
            "That is XLM, not a stablecoin. XLM's price moves freely, whereas a stablecoin is built to hold a fixed value.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c24-q2",
      prompt: "Who issues USDC and what is meant to back it?",
      options: [
        {
          text: "No one issues it; its value comes purely from supply and demand.",
          explanation:
            "No. USDC is not backed by market forces alone. A specific company issues it and promises real reserves behind each token.",
        },
        {
          text: "The Stellar network itself mints it and guarantees the dollar value.",
          explanation:
            "Not quite. Stellar is just the network USDC lives on. The network does not issue it or hold the reserves.",
        },
        {
          text: "Circle issues it, and each token is meant to be backed by real dollars and safe reserves.",
          explanation:
            "Correct. Circle creates USDC and says it holds an equal value in safe assets, so each token is a claim on a real dollar. Trusting USDC means trusting that backing.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c24-q3",
      prompt: "Why does USDC make a good base currency for measuring your portfolio?",
      options: [
        {
          text: "Because its price rises steadily, so your holdings always grow.",
          explanation:
            "No. USDC is not designed to rise at all; it stays near one dollar. Its usefulness comes from being steady, not from growing.",
        },
        {
          text: "Because it stays close to one dollar, giving you a steady yardstick and a place to park value without leaving crypto.",
          explanation:
            "Correct. A steady value lets you read gains and losses clearly and sit out market swings while staying in your wallet. In this app USDC is the primary base currency.",
        },
        {
          text: "Because it cannot ever lose value under any circumstances.",
          explanation:
            "Not true. Even a stablecoin can slip from its peg. Its value is steady as a goal, not an absolute guarantee.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c24-q4",
      prompt: "What does it mean when a stablecoin experiences a depeg?",
      options: [
        {
          text: "It permanently upgrades to being worth more than one dollar.",
          explanation:
            "No. A depeg is not an upgrade. It means the coin has drifted away from its intended value, usually downward, and may not fully recover.",
        },
        {
          text: "It slips away from its target value and no longer matches the dollar it is supposed to track.",
          explanation:
            "Correct. A depeg is when a stablecoin loses its peg, often because holders lose confidence in the issuer or reserves and rush to sell, pushing the price below one dollar.",
        },
        {
          text: "It is automatically converted into XLM by the network.",
          explanation:
            "No. Nothing converts the coin to XLM. A depeg is simply the price failing to hold its intended one-for-one value.",
        },
        {
          text: "The trustline to the issuer is closed by the app.",
          explanation:
            "No. A depeg is about price, not trustlines, and this app never adds or removes a trustline on its own. A depeg can happen while your trustline stays perfectly open.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

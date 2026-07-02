// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Chapter 31 (Tokenomics): supply, market cap, minting and burning, and using
// tokenomics as a complementary lens on an AI trustline suggestion. Authored to
// the same shape as content/en/chapter22.ts, ADVANCED level, with the per-chapter
// `whoFor` one-liner typed via a local intersection so the live Chapter interface
// stays untouched until integration. This chapter owns no new glossary terms.
import type { Chapter } from "../../types";

export const chapter31: Chapter & { whoFor: string } = {
  id: "c31",
  number: 31,
  level: "ADVANCED",
  whoFor: "For traders who judge a token by its supply, not its hype",
  title: "Tokenomics",
  description:
    "Supply, market capitalisation, and inflation via minting and burning — and how to use tokenomics as a lens when the AI suggests a new trustline.",
  lessons: [
    {
      id: "c31-l1",
      title: "What is tokenomics?",
      paragraphs: [
        "Tokenomics is the economics of a token: how many units exist, how new ones are created (issuance), who holds them (distribution), and what behaviour the design rewards (incentives). It is the rulebook that governs the money supply of a single asset, decided by whoever issues it. On Stellar, XLM has its own fixed monetary policy, while any issuer can mint a custom token and write its own rules into a stellar.toml file.",
        "The four pillars matter because price is only half of value. A token can look active on the chart yet be quietly diluted by an issuer minting more of it, or concentrated so tightly that a handful of wallets can move the market at will. Reading supply and distribution tells you whether the price you see reflects a scarce, widely-held asset or an abundant one controlled by a few insiders.",
        "You do not need a spreadsheet to start. Three questions cover most of it: how many tokens are in play now, how many could ever exist, and who benefits when the supply changes. Tokenomics is simply the discipline of asking those questions before you trust a token with your capital. This is educational material, not financial advice — the goal is to help you read a token, not to tell you which to buy.",
      ],
      example:
        "Think of a concert venue. The number of seats printed on tickets is the supply, the box office deciding whether to print more is issuance, who is holding those tickets is distribution, and the perks that come with a front-row seat are the incentives. Two shows can charge the same ticket price, but the one that keeps printing extra tickets quietly makes every existing ticket worth less. Tokenomics is reading the seating chart before you pay.",
    },
    {
      id: "c31-l2",
      title: "What is circulating supply vs max supply?",
      paragraphs: [
        "Circulating supply is the number of tokens actually available and tradeable right now. Max supply is the largest number that can ever exist under the token's rules. The gap between them is the tokens that are promised but not yet released — locked in team vesting schedules, reserved for future rewards, or simply not minted yet.",
        "Picture a city. The homes people can rent or buy today are the circulating supply. The total build-out plan on the council's books — every plot zoned for future construction — is the max supply. If a city has 10,000 occupied homes but a plan for 100,000, you know a wave of new housing is coming. That future construction will compete with the homes standing today and can soften their price, even though nothing has been built yet.",
        "For a token, that future build-out is dilution risk. If circulating supply is a small slice of max supply, large tranches of tokens are scheduled to unlock, and each unlock adds sellers to the market. A token that trades well today can drift down for months purely because its supply schedule keeps releasing new units. Always compare the two numbers before you judge a price as high or low.",
      ],
      example:
        "A token trades at 2 USDC with 50 million tokens circulating, but its max supply is 500 million. Only 10 percent has been released. The remaining 450 million are set to unlock over the next three years for the team and early investors. Even if demand stays flat, that steady stream of new sellers can weigh the price down — so the 2 USDC you pay today is not competing only with today's holders, but with nine times as many tokens waiting in the pipeline.",
    },
    {
      id: "c31-l3",
      title: "What is market capitalisation and how do you calculate it?",
      paragraphs: [
        "Market capitalisation is the total value of a token's circulating supply: market cap = price x circulating supply. It answers a bigger question than price alone — not what one unit costs, but what the whole tradeable pool is worth. A market cap of 50 million USDC means the market currently values every circulating token, added together, at roughly that figure.",
        "This is why a low per-token price is not the same as cheap. Price depends entirely on how the supply is sliced. A token at 0.001 USDC with 100 billion units in circulation has a market cap of 100 million USDC — far larger than a token at 200 USDC with only 100,000 units, which is worth just 20 million. The single-unit price tells you nothing about size until you multiply by supply.",
        "Two more angles are worth knowing. Fully-diluted valuation applies the same maths to max supply instead of circulating supply, showing what the token would be worth if every future unit existed today — a useful sanity check against the dilution you learned about in the last lesson. And market cap divided by daily trading volume hints at liquidity: a huge cap on thin volume means you may struggle to exit at the quoted price.",
      ],
      example:
        "You are comparing two tokens on the token detail page. Token A shows 0.02 USDC per unit; Token B shows 45 USDC per unit. B looks 'expensive'. But A has 8 billion tokens circulating (market cap 160 million USDC) while B has 1 million circulating (market cap 45 million USDC). A is the far larger asset despite its tiny price tag. Judging by the sticker price alone would have had you exactly backwards.",
    },
    {
      id: "c31-l4",
      title: "What is inflation in crypto? Token minting and burning",
      paragraphs: [
        "Inflation in crypto means the supply is growing over time. The mechanism is minting: the issuer creates new tokens and adds them to circulation, often to fund rewards, staking payouts, or a treasury. Each newly minted token is a claim on the same underlying value, so unless demand grows to match, every existing holder's slice becomes a slightly smaller share of the whole — that is dilution.",
        "Burning is the opposite. Tokens are sent to an address no one can spend from, permanently removing them from supply. A deflationary design burns tokens faster than it mints them, so the total shrinks and each remaining token represents a larger share. On Stellar this is done by clawing supply back to the issuer or sending it to an unusable account; XLM itself has a fixed supply with no ongoing minting, so it does not inflate.",
        "For a holder, the direction and pace of supply change is as important as price. A token quietly minting 10 percent more units every year is a headwind you pay even when the price looks flat, because your ownership share erodes annually. A credible burn schedule is a tailwind. Neither is automatically good or bad — an early project may need to mint to bootstrap adoption — but you should know which way the supply is moving and why before you hold it.",
      ],
      example:
        "You hold 1,000 units of a token, which is 1 percent of a 100,000-unit supply. The issuer then mints 100,000 new units for a rewards programme, doubling the supply to 200,000. You still hold 1,000 units, but now that is only 0.5 percent of the token. Your position did not shrink — the pie doubled — yet your slice of it halved. If the price had not risen to reflect new demand, your stake just quietly lost half its relative weight.",
    },
    {
      id: "c31-l5",
      title: "How to use tokenomics to evaluate an AI trustline suggestion",
      paragraphs: [
        "When Atrium's weekly, observe-only scan suggests a new trustline, tokenomics is your pre-trust checklist. Before you opt in to hold a token — which costs a small XLM reserve and exposes you to the issuer — run the three questions from this chapter. What is the circulating supply against the max supply, so you can gauge dilution? What is the market cap, so you are not fooled by a low per-token price? And is the token minting, burning, or fixed, so you know which way your share is drifting? A token can pass every technical signal and still be a poor hold if its supply is set to balloon.",
        "This lens is deliberately complementary to what the AI already measures. The trustline suggestion chapters, Chapter 20 and Chapter 21, cover how the scan scores four signals per token — liquidity, legitimacy, trend, and risk — drawing on cues like order-book depth, a token's trustline count, and issuer trust signals such as a present or missing stellar.toml, and how it tracks deterioration warnings for held tokens across twelve weeks of history. Those signals read the market's behaviour around a token. Tokenomics reads the token's own monetary design, which no order-book depth or trustline count can reveal. Together they answer different halves of one question: is this asset both well-traded and well-structured?",
        "Keep the app's own guardrails in mind while you do this. The scan never auto-adds or removes a trustline — the decision is always yours — and a missing stellar.toml is a red flag precisely because it hides the issuer metadata you would use to verify supply and minting authority. If you cannot find who can mint the token or how much can ever exist, treat that opacity itself as a risk signal, and lean on your position-size and volatility risk factors accordingly. This is educational guidance, not financial advice.",
      ],
      example:
        "The scan flags a token with strong liquidity depth and a healthy trustline count — the AI signals look green. Before opting in, you check the tokenomics. Circulating supply is 5 percent of max supply, and the stellar.toml reveals the issuer retains full minting authority with a three-year unlock schedule. The market signals said 'well-traded', but the supply design says 'heavy dilution ahead and mint control in one pair of hands'. You skip the trustline — not because the AI was wrong, but because a second, complementary lens caught a risk the market signals could not see.",
    },
  ],
  quiz: [
    {
      id: "c31-q1",
      prompt: "Which set of factors best describes what 'tokenomics' covers?",
      options: [
        {
          text: "The token's supply, issuance, distribution, and incentives.",
          explanation:
            "Correct. Tokenomics is the economics of a token — how many units exist, how new ones are created, who holds them, and what the design rewards. Together these tell you whether the price reflects a scarce, widely-held asset or an abundant, concentrated one.",
        },
        {
          text: "Only the current market price and the 24-hour percentage change.",
          explanation:
            "Too narrow. Price and its recent change are chart data, not tokenomics. They say nothing about how much supply exists or who controls its issuance.",
        },
        {
          text: "The colour of the candlesticks and the shape of the volume bars.",
          explanation:
            "No. Those are chart-reading cues on the token detail page. Tokenomics is about the token's underlying monetary design, not the appearance of its price graph.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q2",
      prompt: "A token has 50 million tokens circulating and a max supply of 500 million. Why does that gap matter to you as a holder?",
      options: [
        {
          text: "It does not matter — only the circulating supply affects price.",
          explanation:
            "Incorrect. The gap represents 450 million tokens scheduled to unlock. Each unlock adds sellers to the market, which can weigh the price down for months even if demand holds steady.",
        },
        {
          text: "The 450 million un-released tokens are future dilution: as they unlock, they add sellers and can pressure the price.",
          explanation:
            "Correct. Like a city with 10,000 homes but a plan for 100,000, the future build-out competes with what exists today. A small circulating slice of a large max supply is a dilution headwind you should price in before buying.",
        },
        {
          text: "A large max supply guarantees the price will rise as more tokens are minted.",
          explanation:
            "Backwards. Minting more units without matching demand dilutes each holder's share. More supply is a headwind, not a guarantee of higher prices.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c31-q3",
      prompt: "Token A trades at 0.02 USDC with 8 billion units circulating. Token B trades at 45 USDC with 1 million units circulating. Which is the larger asset by market cap, and why?",
      options: [
        {
          text: "Token B, because its per-unit price of 45 USDC is far higher than A's.",
          explanation:
            "This is the exact trap the lesson warns about. A high per-token price does not mean 'bigger' — you must multiply price by circulating supply to get market cap.",
        },
        {
          text: "They are the same size, because market cap depends only on price.",
          explanation:
            "Incorrect. Market cap is price times circulating supply, so two tokens with very different supplies almost never have the same cap even at similar prices.",
        },
        {
          text: "Token A, because 0.02 x 8 billion = 160 million USDC, versus B's 45 x 1 million = 45 million USDC.",
          explanation:
            "Correct. Market cap = price x circulating supply. A's tiny sticker price hides a far larger tradeable pool. A low per-token price is never automatically 'cheap' until you account for supply.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c31-q4",
      prompt: "An issuer mints 100,000 new tokens for a rewards programme, doubling the supply from 100,000 to 200,000. You held 1,000 tokens. What happened to your ownership share?",
      options: [
        {
          text: "Your share fell from 1 percent to 0.5 percent — the supply doubled while your holding stayed the same.",
          explanation:
            "Correct. Minting is inflation: your 1,000 tokens are unchanged, but they now represent half as large a slice of a doubled pie. Unless price rose to reflect new demand, your relative stake was diluted.",
        },
        {
          text: "Your share stayed at 1 percent, because you still own the same number of tokens.",
          explanation:
            "Incorrect. Owning the same count is not the same as owning the same share. When the total doubles, your fixed holding covers a smaller fraction of it.",
        },
        {
          text: "Your share rose, because more tokens in circulation makes each holder more important.",
          explanation:
            "The opposite is true. New minting dilutes existing holders — more units means each one, including yours, represents a smaller portion of the whole.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q5",
      prompt: "The AI trustline scan flags a token with strong liquidity depth and a high trustline count. How should tokenomics fit into your decision?",
      options: [
        {
          text: "The AI's green signals are enough on their own; tokenomics adds nothing new.",
          explanation:
            "Incorrect. The scan's four signals — liquidity, legitimacy, trend, and risk — read the market's behaviour around a token. They cannot see the token's own supply design, which is exactly the gap tokenomics fills.",
        },
        {
          text: "Use tokenomics as a complementary lens: check circulating vs max supply, market cap, and minting or burning before opting in.",
          explanation:
            "Correct. As Chapters 20 and 21 explain, the scan scores market signals; tokenomics reads the token's monetary design. A token can pass every technical signal and still be a poor hold if its supply is set to balloon or its minting authority is opaque.",
        },
        {
          text: "Ignore the AI entirely and let the app auto-add the trustline based on tokenomics alone.",
          explanation:
            "Wrong on two counts. The two lenses are complementary, not rivals — and the app never auto-adds a trustline. Adding one is always your own decision, made with a small XLM reserve at stake.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

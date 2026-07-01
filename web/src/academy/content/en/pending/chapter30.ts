// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on On-Chain Data: reading wallet activity, whale moves, and
// TVL to look under the market's hood and sanity-check the AI's suggestions.
// Authored to the exact same shape as content/en/pending/chapter22.ts, with the
// per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms already taught in earlier chapters.
import type { Chapter } from "../../../types";

export const chapter30: Chapter & { whoFor: string } = {
  id: "c30",
  number: 30,
  level: "ADVANCED",
  whoFor: "For traders who want to look under the market's hood",
  title: "On-Chain Data",
  description:
    "What on-chain data is, what active wallets, whale moves, and TVL reveal about a token, and how to use those signals to sanity-check the AI's suggestions.",
  lessons: [
    {
      id: "c30-l1",
      title: "What is on-chain data and why is it different from market data?",
      paragraphs: [
        "Market data describes the price: the last trade, the bid and ask, the volume, the candlesticks you see on the token detail page under the hour, day, week, and year tabs. It tells you what a token is trading for and how much of it changed hands. On-chain data describes something else entirely: who actually holds and moves the asset. Because Stellar is a public ledger, every account, every trustline, every payment, and every trade is recorded permanently and can be read back by anyone.",
        "The two answer different questions. Market data answers what is the price doing right now. On-chain data answers who is behind that price. A token can have a rising chart while only a handful of wallets pass it back and forth, or a flat chart while thousands of new holders quietly open trustlines. Price alone hides that; the ledger does not.",
        "The practical value is that on-chain data is hard to fake at scale and it leads rather than follows. A large holder moving funds, a wave of new trustlines, or liquidity draining out of a pool all happen on-chain before they fully show up in price. Reading the ledger is how you check whether a move is backed by real participation or is just a thin price wiggle. Think of it as looking under the market's hood rather than only at the speedometer.",
      ],
      example:
        "Two tokens both show a chart that doubled this week. Token A did it on trades between six wallets that keep selling to each other; token B did it while three hundred new accounts opened trustlines and bought small amounts. The candlesticks look nearly identical, but the on-chain picture is opposite: A is a closed loop, B is genuine adoption. Only the ledger, not the price graph, tells you which is which.",
    },
    {
      id: "c30-l2",
      title: "What does the number of active wallets tell you about a token?",
      paragraphs: [
        "The count of wallets that hold a token, and how many are actively transacting, is one of the clearest adoption signals on-chain. A token held by thousands of independent accounts that regularly trade and transfer it has a real user base; a token sitting in five wallets that never move does not, no matter what its price says. On Stellar the trustline count is a direct proxy for this: because you must open a trustline before you can hold a non-native token, the number of trustlines is roughly the number of accounts that chose to hold it.",
        "This is exactly one of the inputs the app already uses. The token scoring blends Horizon trade aggregations, order-book depth, and trustline count as an adoption measure, and the liquidity scanner surveys tokens to gauge how tradeable and how widely held they are. When you read an AI trustline suggestion, the adoption score behind it is partly this wallet-and-trustline picture, tracked across twelve weeks so you can see whether holders are arriving or leaving.",
        "The caveat is sybil wallets. Nothing stops one person from opening hundreds of accounts and trustlines to fake adoption, and creating a Stellar account is cheap. So raw counts can be inflated. The defences are to weight distribution over headcount (are holdings spread across many independent wallets or concentrated in a few), and to watch the trend rather than the snapshot: steady organic growth is harder to fake than a single-day spike of near-identical new accounts. Treat a rising trustline count as supportive evidence, not proof.",
      ],
      example:
        "The liquidity scanner surfaces a token whose trustline count jumped from 400 to 1,600 in one week. Encouraging at first glance. But on closer look the 1,200 new trustlines were all created within the same hour, by accounts funded from a single source, none of which ever traded afterward. That is a sybil pattern: one actor manufacturing the appearance of adoption. A token that instead added 1,200 trustlines steadily over the twelve-week window, spread across independently funded wallets that actually trade, is the far stronger adoption signal.",
    },
    {
      id: "c30-l3",
      title: "What are whale movements and why do traders follow them?",
      paragraphs: [
        "A whale is a wallet large enough that its moves can shift a market on its own. Because the ledger is public, you can watch these wallets: a whale sending a big balance to a known exchange or issuer address, opening or closing a trustline, or adding and pulling liquidity from an AMM pool. Traders follow whales because a large holder often has better information or simply enough size that their action alone moves the price. A whale depositing a huge amount to sell can precede a drop; a whale accumulating quietly can precede a rise.",
        "Reading the move matters more than merely seeing it. A transfer to an exchange or issuer hints at intent to sell or redeem. A transfer between two wallets the same entity controls means nothing has really changed hands. Withdrawing liquidity from a pool thins the market and can amplify the next swing. The size relative to the token's normal volume is what makes a move significant: a whale-sized transfer in a thinly traded token is far more disruptive than the same amount in a deep, liquid one.",
        "The danger is following blindly. You rarely know the whale's true intent, and some large players deliberately telegraph fake moves to bait smaller traders. On-chain, a movement can also be an internal reshuffle, custody migration, or collateral operation that has no directional meaning at all. Use whale activity as a prompt to look closer and to check liquidity and your own risk tools, never as an automatic buy or sell signal. If a whale move only makes you want to trade because it feels urgent, that urge is FOMO, not analysis.",
      ],
      example:
        "You notice a wallet holding 20% of a small token's supply send its entire balance to a Circle-style issuer address, right as the daily volume for that token is only a fraction of that amount. That is a meaningful signal: a holder that large heading for the exit can swamp the order book and drive the price down. The disciplined response is not to panic-sell alongside them, but to check the order-book depth, tighten or confirm your stop loss, and decide whether your original thesis still holds — not to mirror the whale on reflex.",
    },
    {
      id: "c30-l4",
      title: "What is TVL (Total Value Locked)?",
      paragraphs: [
        "TVL, or Total Value Locked, is the total value of assets deposited into a pool or a protocol, usually quoted in USDC or dollar terms. For a single AMM pool it is the sum of both sides of the pool; for a whole protocol it is the sum across all its pools and vaults. On Stellar you see TVL most directly in AMM liquidity pools, which charge a 0.30% pool fee, and in Soroban DeFi protocols such as Blend, DeFindex, and Soroswap. TVL is a size-and-trust signal: a pool with millions locked can absorb larger trades with less slippage, and a protocol people are willing to lock real money into has, at minimum, earned some trust.",
        "For a trader the most useful read is depth. Higher TVL in the pool you trade against usually means a market order moves the price less, so your slippage tolerance is easier to respect. Falling TVL is a warning: liquidity leaving a pool makes it thinner and every subsequent trade more expensive and more volatile. Watching the direction of TVL over time often tells you more than the absolute number.",
        "TVL has real limits, so do not treat it as a safety rating. It can be inflated by a single whale or by mercenary capital chasing a temporary reward, and it can leave just as fast. High TVL does not mean the underlying contracts are audited or safe; Soroban protocols carry smart-contract risk regardless of how much is locked. And a high dollar TVL can itself swing simply because the price of the deposited assets moved, not because anyone added or removed funds. Read TVL as one input about market depth and interest, cross-checked against the actual order-book and pool composition — not as proof of quality or security.",
      ],
      example:
        "You want to swap a mid-size amount into a token and see two routes: an AMM pool with 2,000,000 USDC of TVL and another with 40,000. The deep pool can fill your order with minor slippage; the shallow one might move the price several percent against you and blow past your slippage tolerance. But a week later you notice the deep pool's TVL has quietly fallen to 300,000 as a large provider withdrew. Same token, but the market just got thinner — a signal to size down and recheck depth before trading, not to assume the earlier depth still exists.",
    },
    {
      id: "c30-l5",
      title: "How to use on-chain data to evaluate AI suggestions",
      paragraphs: [
        "The AI analyst proposes trades with a confidence score from 0 to 100, and the backend only auto-executes proposals at or above your threshold, subject to the trading cap and the drawdown pause gate. On-chain data is how you sanity-check that confidence with your own eyes rather than taking the number on faith. Before accepting a proposal, ask whether the on-chain picture agrees: is the token held by many independent wallets, is its trustline count rising, is there enough TVL and order-book depth to fill the trade inside your slippage tolerance, and are any whale moves pointing the opposite way from the AI?",
        "The app's own scoring already folds much of this in, and two earlier chapters cover exactly how. The Reading AI Trustline Suggestions chapter explains the weekly, observe-only scan of top-N plus held tokens, the four scores per token, the twelve weeks of history, and the deterioration warnings — and it stresses that the app never auto-adds or removes a trustline. The Token Evaluation on the Stellar Chain chapter explains how a token's score is built from Horizon trade aggregations, order-book depth, and trustline-based adoption, plus the red flag of a missing stellar.toml issuer file. Rather than duplicate those, use this chapter's on-chain lens to confirm or challenge what those scores summarise.",
        "When on-chain data and the AI disagree, treat it as a reason to slow down, not an instant override. Confidence built on thin liquidity, a shrinking holder base, or a whale heading for the exit deserves more skepticism than the raw score suggests; conversely, a modest score backed by broad adoption and deep TVL may be sturdier than it looks. Whatever you decide, put your conclusion into the app's tools — position size, stop loss, target price, and invalidation price whose reward-to-risk ratio gates the trade — so the decision is rule-based rather than a gut call. On-chain data does not replace the AI or the scores; it is the independent second opinion that keeps you from trusting a confident number over a thin market. None of this is financial advice.",
      ],
      example:
        "The AI proposes buying a token at confidence 82, above your threshold, so it would auto-execute. You check on-chain first: the trustline count has slipped for three straight weeks, the main AMM pool's TVL has halved, and a top-ten holder just sent a large balance toward an issuer address. Three independent on-chain signals all point the other way from the AI's optimism. You do not simply flip the AI off — you lower your position size, set a tighter stop loss, and confirm the invalidation price so the reward-to-risk ratio still justifies the trade. The score gave you a starting opinion; the ledger told you to trade it smaller and with tighter guards.",
    },
  ],
  quiz: [
    {
      id: "c30-q1",
      prompt: "What is the key difference between market data and on-chain data?",
      options: [
        {
          text: "Market data shows the price and volume, while on-chain data shows who actually holds and moves the asset on the public ledger.",
          explanation:
            "Correct. Market data answers what the price is doing; on-chain data answers who is behind that price — holders, trustlines, transfers, and pool activity that price alone hides.",
        },
        {
          text: "Market data is public and verifiable, while on-chain data is private and only exchanges can see it.",
          explanation:
            "Backwards. On-chain data is the public part: Stellar's ledger records every account, trustline, payment, and trade for anyone to read. Market data is what is aggregated on top.",
        },
        {
          text: "They are the same thing shown in two different colours on the token detail page.",
          explanation:
            "No. The candlesticks and volume tabs are market data; on-chain data is a separate view of participation that two identical-looking charts can completely disagree on.",
        },
        {
          text: "On-chain data always lags the price, so it is only useful after a move is over.",
          explanation:
            "The opposite is closer to true. Whale transfers, trustline waves, and liquidity changes often happen on-chain before they fully show up in price, which is why the ledger can lead rather than follow.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c30-q2",
      prompt: "A token's trustline count jumps from 400 to 1,600 in a single hour, all from accounts funded by one source that never trade afterward. What does this most likely indicate?",
      options: [
        {
          text: "Strong, genuine adoption you should trust immediately.",
          explanation:
            "Not from this pattern. Real adoption tends to accrue steadily across independently funded wallets that actually transact, not in a one-hour burst from a single funding source.",
        },
        {
          text: "A sybil pattern — one actor manufacturing the appearance of adoption with many cheap accounts.",
          explanation:
            "Correct. Because opening a Stellar account and trustline is cheap, one person can fake headcount. Same source, same hour, and no subsequent trading are classic sybil tells; weight distribution and trend over raw counts.",
        },
        {
          text: "That the liquidity scanner is broken, since trustline counts cannot change that fast.",
          explanation:
            "No. Trustline counts genuinely can spike that fast; the scanner is reporting real ledger activity. The question is whether that activity is organic, and here it is not.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c30-q3",
      prompt: "You see a whale send 20% of a small, thinly traded token's supply to an exchange-style issuer address. What is the disciplined response?",
      options: [
        {
          text: "Immediately sell everything, because whales always know best.",
          explanation:
            "No. You rarely know a whale's true intent, and some deliberately bait smaller traders. Mirroring the move on reflex is following blindly, which is the main danger with whale-watching.",
        },
        {
          text: "Ignore it completely, since one wallet can never affect a small token's price.",
          explanation:
            "Wrong the other way. A whale-sized transfer in a thinly traded token is exactly the case that can swamp the order book and move the price hard, so it should not be ignored.",
        },
        {
          text: "Treat it as a prompt to look closer: check order-book depth, confirm your stop loss, and decide whether your thesis still holds.",
          explanation:
            "Correct. Whale activity is a signal to investigate and manage risk, not an automatic buy or sell. Verify depth and lean on your own risk tools rather than reacting to urgency.",
        },
        {
          text: "Assume it is an internal reshuffle with no meaning and do nothing at all.",
          explanation:
            "Too dismissive. It might be an internal move, but a transfer to an issuer or exchange address hints at intent to sell or redeem — reason to look closer, not to assume it is nothing.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c30-q4",
      prompt: "Which statement about TVL (Total Value Locked) is accurate?",
      options: [
        {
          text: "High TVL proves a protocol's contracts are audited and safe to use.",
          explanation:
            "No. TVL is a size-and-interest signal, not a safety rating. Soroban protocols carry smart-contract risk no matter how much is locked, and TVL can be inflated by a single whale or mercenary capital.",
        },
        {
          text: "Higher TVL in the pool you trade against generally means less slippage, but it can leave quickly and does not guarantee quality.",
          explanation:
            "Correct. Deeper pools absorb larger trades with less price impact, yet TVL can drain fast, be inflated by one provider, or swing just because deposited-asset prices moved — read it as one input, cross-checked against real depth.",
        },
        {
          text: "TVL only ever changes when the price of the locked assets changes, never from deposits or withdrawals.",
          explanation:
            "Incomplete and misleading. Price moves do shift a dollar-denominated TVL, but deposits and withdrawals change it too — a large provider pulling liquidity is a common and important cause of falling TVL.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

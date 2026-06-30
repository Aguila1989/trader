import type { Chapter } from "../../types";

export const chapter21: Chapter = {
  id: "c21",
  number: 21,
  level: "EXPERT",
  title: "Token Evaluation on the Stellar Chain",
  description: "The mechanics behind the scores: what Horizon trade aggregations measure, how order-book depth is summed, what the trustline count really says, how to read 12 weeks of score history, and when to override the AI.",
  lessons: [
    {
      id: "c21-l1",
      title: "How Horizon trade aggregations work",
      paragraphs: [
        "The volume figures in the scan come from Horizon's trade aggregations endpoint. It groups completed trades for one asset pair into fixed time buckets — the app uses hourly buckets for the 24-hour figure and daily buckets for the 7-day figure — and reports, per bucket, the open/high/low/close price, the number of trades, and the base-asset volume traded.",
        "Two details matter. First, this is settled on-chain DEX activity for that specific pair (the token against XLM), not an exchange's reported figure and not AMM-pool swaps the order-book scan can't see — so a token whose liquidity lives against USDC or in a pool can look thinner here than it really is. Second, Horizon omits empty buckets entirely, so \"24 hourly candles\" on a thin market can actually span several days.",
        "The app sums base volume across the buckets to get its 24h and 7d volume numbers, and compares the first bucket's open with the last bucket's close to label the 7-day trend up, stable, or down. Knowing the source explains the limits: low volume here means low XLM-pair DEX volume specifically, which is the honest signal for whether you could actually trade the token on this venue.",
      ],
      example: "A token reports 7-day volume of 40,000 from daily aggregations against XLM. You check and see only 5 non-empty daily buckets — trading happened on 5 days out of 7. The number is real but lumpy, and it says nothing about that token's possibly-deeper USDC market. You weight it accordingly rather than reading 40,000 as smooth daily liquidity.",
    },
    {
      id: "c21-l2",
      title: "How order-book depth is calculated",
      paragraphs: [
        "Depth in the scan is a snapshot of resting liquidity, separate from traded volume. The app pulls the live order book for the token against XLM and sums the amounts on the top ten bid levels and the top ten ask levels, normalised to base-asset units. Volume tells you what has traded; depth tells you what is sitting there ready to trade right now.",
        "Depth is what determines your slippage on a real order. A book with large size stacked near the touch absorbs a sizeable trade with little price movement; a thin book means even a modest order walks several levels and fills at a much worse average price. Two tokens with identical 24h volume can have completely different depth, and the thin one is the more dangerous to enter or exit.",
        "Because it is a single-moment snapshot, depth can change minute to minute, and a single large resting order can flatter it. Read it together with volume and spread: healthy liquidity is steady volume, a tight spread, and depth on both sides of the book — not just one impressive number in isolation.",
      ],
      example: "Token A and token B both show 24h volume near 50,000. But A's top-ten depth sums to 30,000 base units with a 20 bps spread, while B's sums to 1,200 with a 400 bps spread. A 10,000-unit exit barely moves A's price; on B it blows through every level. Same volume, very different real liquidity — depth is what told you.",
    },
    {
      id: "c21-l3",
      title: "What the trustline count reveals about adoption",
      paragraphs: [
        "The trustline count comes from Horizon's assets endpoint — the num_accounts field — and is the number of accounts that have opened a trustline to that token. It is the broadest available proxy for adoption: how many distinct accounts have chosen to be able to hold this asset at all. A token with 15,000 trustlines has cleared a very different bar than one with 30.",
        "But know exactly what it does and does not mean. It counts holders (trustline openers), not active traders, and it includes dormant and zero-balance accounts — every account that ever opened the trustline and hasn't closed it. So it is a measure of cumulative reach, not of current activity. A high count with near-zero volume is a token that was once adopted and is now quiet.",
        "The most useful way to use it is as a denominator and as a trend. Cross-check it against volume and depth: many holders plus real liquidity is genuine adoption; many holders with no liquidity is a stale or abandoned token. And week over week, a falling trustline count — holders actively closing out — is one of the deterioration triggers precisely because people leaving is a meaningful signal.",
      ],
      example: "A token shows 9,000 trustlines, which looks strong — until you notice 24h volume of roughly zero and a flat price for weeks. Cross-referencing reveals an asset that attracted holders long ago and is now dormant. Next week the count reads 8,000: an 11% drop trips the 'fewer holders' warning, confirming holders are actively leaving rather than merely idle.",
    },
    {
      id: "c21-l4",
      title: "Interpreting 12 weeks of score history",
      paragraphs: [
        "Every weekly scan stores a snapshot per token, and the app keeps at least 12 weeks of that history. One week's scores are a photo; twelve weeks are a film. The trajectory of the overall score and its four components is far more informative than any single reading, because it shows whether a token is strengthening, decaying, or merely noisy.",
        "Look for direction and consistency. A token whose legitimacy and liquidity scores hold steady or climb across many weeks is earning trust; one whose scores grind downward is telling you something even if no single week trips a warning. Distinguish a real trend from one-off blips — a lone bad week amid eleven good ones is usually noise, whereas three consecutive declines is a pattern.",
        "The week-over-week triggers fire on single-step changes, but the 12-week view is where you catch the slow bleed those thresholds can miss — a token drifting from 8 to 7 to 6 to 5 over a month never trips the two-point score-drop rule in any single week, yet has clearly deteriorated. Use the history to confirm a warning is part of a trend, or to notice decay the triggers haven't flagged yet.",
      ],
      example: "A token never trips a warning, but its 12-week overall reads 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3 — a steady monthly slide that the two-point single-week rule never catches. The film, not the photo, tells you to trim or exit. Another token bounces 7, 8, 6, 8, 7 — noisy but trendless, and not a cause for alarm.",
    },
    {
      id: "c21-l5",
      title: "When to override an AI suggestion and how to document it",
      paragraphs: [
        "You are the final decision-maker, and there are good reasons to overrule the scan in both directions. You might decline a high-scoring token because you have off-chain knowledge the model lacks — a known team dispute, a regulatory cloud, a depeg risk. Or you might add a low-scoring one because you understand why it scores low and accept that risk deliberately, for instance a brand-new but credible project the model penalises purely for its short history.",
        "Override on evidence, not on a hunch. Before going against a score, write down the specific facts that justify it: what the scan saw, what you know that it doesn't, and which concrete signals (issuer identity, depth, holder trend, TOML contents) support your call. If you can't articulate a reason the model is wrong, that is usually a sign to defer to it.",
        "Documenting your reasoning is what makes overrides reviewable later. Record the date, the token, the scores at the time, your decision, and your rationale — the snooze on a warning, a note in your own log, or a comment beside the position. When you revisit in a few weeks you can judge whether your override was justified by the outcome, and you build a track record instead of repeating untested instincts.",
      ],
      example: "The scan flags a held token with a deterioration warning, but you know the volume drop is a one-week exchange outage, not decay. You snooze the warning for seven days and note: \"2026-07-01, token X, overall 5 (was 7); volume drop is the Acme exchange maintenance window, not fundamentals; holders and TOML unchanged; revisit next scan.\" Next week the metrics recover, your documented call is vindicated, and the note proves why you held.",
    },
  ],
  quiz: [
    {
      id: "c21-q1",
      prompt: "A token shows healthy 7-day volume in the scan, but you suspect most of its liquidity is elsewhere. What does the volume figure actually measure?",
      options: [
        { text: "Settled on-chain DEX trades for that token against XLM, summed from Horizon aggregation buckets.", explanation: "Correct. It is XLM-pair DEX volume specifically — it excludes AMM pools and other quote pairs, so a USDC-heavy token can look thinner here than it truly is." },
        { text: "The token's total trading volume across every exchange and venue worldwide.", explanation: "Incorrect. Horizon only reports settled SDEX trades for the queried pair, not external or aggregate volume." },
        { text: "The number of accounts currently holding the token.", explanation: "Incorrect. That is the trustline count from the assets endpoint, a different metric entirely." },
      ],
      correctIndex: 0,
    },
    {
      id: "c21-q2",
      prompt: "Two tokens have nearly identical 24h volume, but you must exit a large position quickly. Which metric best tells you what that exit will cost?",
      options: [
        { text: "The trustline count, since more holders means an easier exit.", explanation: "Incorrect. Holder count says nothing about resting liquidity right now; you can have many dormant holders and an empty book." },
        { text: "Order-book depth — the summed size on the top bid/ask levels — since it sets your slippage.", explanation: "Correct. Depth is the resting liquidity available now; a thin book makes a large order walk levels and fill at a far worse average price, regardless of past volume." },
        { text: "The 7-day price trend label.", explanation: "Incorrect. The trend tells you direction, not how much size the book can absorb on the way out." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q3",
      prompt: "A token shows 9,000 trustlines but almost no trading volume and a flat price. What is the most accurate reading?",
      options: [
        { text: "It is highly active right now, because the trustline count proves live trading.", explanation: "Incorrect. The trustline count includes dormant and zero-balance accounts; it measures cumulative reach, not current activity." },
        { text: "It was adopted at some point but is now largely dormant — high cumulative reach, little current activity.", explanation: "Correct. Many holders with near-zero volume points to a once-adopted, now-quiet token; the count is a denominator, read it against volume and depth." },
        { text: "The trustline count must be an error, because holders always trade.", explanation: "Incorrect. Holders frequently sit idle; a high count with no volume is a common and meaningful pattern, not a data error." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q4",
      prompt: "A held token's overall score reads 8, 7, 6, 5 over four consecutive weeks but never triggers the two-point score-drop warning. What should you take from the 12-week history?",
      options: [
        { text: "Nothing is wrong, because no single week dropped two points.", explanation: "Incorrect. The single-week trigger misses a slow, steady decline; the trajectory is the point of keeping the history." },
        { text: "A clear downward trend the per-week thresholds miss — a prompt to trim or exit.", explanation: "Correct. Four straight single-point declines never trip the two-point rule, yet the film shows obvious deterioration the photo can't." },
        { text: "The scores are just noise and can be ignored.", explanation: "Incorrect. A monotonic four-week slide is a trend, not noise; consistency in one direction is exactly what to act on." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q5",
      prompt: "The scan flags a held token, but you have specific evidence the dip is a temporary exchange outage. What is the disciplined way to override the warning?",
      options: [
        { text: "Ignore the warning silently and move on, since you have a feeling it's fine.", explanation: "Incorrect. An undocumented hunch can't be reviewed later; override on articulated evidence, not feeling." },
        { text: "Snooze the warning and record the date, scores, your reasoning, and a revisit plan so the decision is reviewable.", explanation: "Correct. Documenting the specific facts (what the scan saw, what you know it doesn't, when to recheck) makes the override accountable and builds a track record." },
        { text: "Immediately sell the entire position to be safe.", explanation: "Incorrect. If your evidence says the dip is temporary, a forced exit contradicts your own analysis; the point is a reasoned, documented decision." },
      ],
      correctIndex: 1,
    },
  ],
};

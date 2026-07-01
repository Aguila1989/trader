// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on Trading Strategies (day/swing/HODL, dollar-cost averaging,
// risk/reward ratio, position sizing, and the power of doing nothing). Authored
// to the exact same shape as content/en/chapter01.ts, with the per-chapter
// `whoFor` one-liner typed via a local intersection so the live Chapter
// interface stays untouched until integration. This chapter owns no new glossary
// terms; it naturally reuses vocabulary introduced in earlier chapters.
import type { Chapter } from "../../../types";

export const chapter29: Chapter & { whoFor: string } = {
  id: "c29",
  number: 29,
  level: "ADVANCED",
  whoFor: "For traders choosing a style and sizing that fits them",
  title: "Trading Strategies",
  description:
    "Day vs swing vs HODL, dollar-cost averaging, the risk/reward ratio, position sizing, and the underrated power of doing nothing.",
  lessons: [
    {
      id: "c29-l1",
      title: "Day trading vs swing trading vs HODLing — which suits you?",
      paragraphs: [
        "These three styles differ mainly in time horizon. A day trader opens and closes positions within hours, aiming to capture small intraday moves and rarely holding overnight. A swing trader holds for days or weeks, riding a single trend or reversal and accepting that prices gap while they sleep. A HODLer buys and holds for months or years, ignoring the noise and betting on the long-run thesis for an asset like XLM or a token they have opened a trustline to.",
        "Effort scales with speed. Day trading demands hours of focused screen time, fast execution, and tight discipline on fees and slippage — on Stellar each fill costs a tiny network fee plus AMM pool fees of 0.30% or the SDEX spread, and those costs compound when you trade often. Swing trading needs a daily check-in and patience through drawdowns. HODLing needs almost no daily attention, but it needs the emotional strength to hold through deep dips without panic-selling.",
        "Temperament is the real deciding factor. If constant screen-watching stresses you, day trading will grind you down no matter how good the setups look. If you cannot stand to see a position red for a week, swing trading will shake you out early. Be honest about the time you have and the volatility you can tolerate, then pick the slowest style that still fits your goals — slower usually means fewer forced errors and lower cumulative cost.",
      ],
      example:
        "Suppose you hold XLM and want more USDC exposure. A day trader might scalp five small XLM/USDC round-trips before lunch, netting fees each time. A swing trader would set one entry on a dip and hold a week for a larger move. A HODLer would simply keep the XLM and check the token detail page's week or year tab occasionally. Same asset, three completely different lifestyles — the right one is the one you can sustain without burning out.",
    },
    {
      id: "c29-l2",
      title: "What is dollar-cost averaging (DCA)?",
      paragraphs: [
        "Dollar-cost averaging means buying a fixed amount of an asset on a fixed schedule, regardless of the price that day. Instead of trying to time the perfect entry, you commit to, say, 50 USDC of XLM every week or month. When the price is low your fixed amount buys more units; when it is high it buys fewer. Over time your average cost smooths out, and you never accidentally put your whole stake in at the single worst moment.",
        "The point of DCA is to remove emotion and timing from the decision. Because the buy is mechanical, FOMO cannot push you to overbuy a spike and fear cannot stop you from buying a dip — the schedule already decided for you. It trades away the chance of a perfectly-timed lump-sum entry in exchange for consistency and far fewer sleepless nights. It works best for assets you believe in for the long run, not for coins you would not want to hold through a downturn.",
        "In this app there is no automatic recurring-buy button, so DCA is a discipline you run yourself: a repeating calendar reminder to place the same-sized YOU SELL USDC / YOU BUY XLM order at each interval. Note that every buy is a separate taxable event in most jurisdictions, so keep records — this is educational guidance, not tax advice, and rules vary by country.",
      ],
      example:
        "Think of a savings plan where you set aside 50 EUR every month no matter what the market is doing. You do not study charts before each deposit; you just pay in on the first of the month for years. If prices dip, your 50 EUR quietly buys more; if they rise, it buys less. DCA into XLM is the identical habit: a fixed 50 USDC every month, price ignored, emotion removed.",
    },
    {
      id: "c29-l3",
      title: "What is a risk/reward ratio and how do you calculate it?",
      paragraphs: [
        "The reward/risk ratio compares how much you stand to gain against how much you stand to lose on a single trade. You calculate it as the distance from your entry to your target price divided by the distance from your entry to your stop-loss. A ratio of 3:1 means your potential reward is three times your potential risk — you are risking one unit to try to make three.",
        "This ratio matters more than your win rate. With a 3:1 reward/risk you can be wrong more often than right and still come out ahead, because each win pays for several losses. A trade offering only 1:1 or worse forces you to win most of the time just to break even, which is a fragile way to trade. Many traders set a minimum, such as declining any setup below 2:1, so the maths stays in their favour over many trades.",
        "The Target Price and Invalidation Price chapter earlier in the Academy shows how to place these two levels on a real trade in this app — the target is where your thesis pays off and the invalidation is the price that proves you wrong. The AI analyst uses the same idea: the reward/risk implied by those levels gates a proposal, so a trade with too little reward for its risk is filtered out before it ever reaches your confidence threshold. Set the levels first, then let the ratio tell you whether the trade is worth taking.",
      ],
      example:
        "You buy XLM at 0.12 USDC. You set a target of 0.15 (a 0.03 gain) and a stop-loss at 0.11 (a 0.01 loss). Reward/risk = 0.03 / 0.01 = 3:1. Even if only 4 of every 10 such trades hit target and 6 hit the stop, you would net roughly +12 − 6 = +6 units of risk over ten trades — profitable despite losing more often than you win. That is the quiet power of insisting on a favourable ratio.",
    },
    {
      id: "c29-l4",
      title: "What is position sizing and why is it crucial?",
      paragraphs: [
        "Position sizing is deciding how much of your portfolio to commit to a single trade so that one loss cannot seriously hurt you. The common rule is to risk only a small percentage — often 1% to 2% — of your total portfolio on any one position. Crucially, you size from the risk, not the excitement: first pick your stop-loss, then work out how large a position lets that stop cost only your chosen percentage if it is hit.",
        "This is what keeps you in the game. A trader risking 2% per trade can lose ten in a row and still have most of their portfolio intact to recover; a trader who bets big on conviction can be wiped out by a single bad call. Good sizing turns a losing streak from a catastrophe into a survivable dip, which is why professionals treat it as more important than picking winners.",
        "In this app, the AI's Position Size risk factor governs exactly this. Set to LOW it proposes small, conservative slices of your balance per trade; MED and HIGH allow progressively larger positions. It works alongside a hard trading cap and a drawdown pause gate, so the AI can never quietly stake your whole wallet on one idea. The AI Risk Settings: Full Control chapter covers the precise mechanics of all six factors — here it is enough to know that the Position Size lever is your seatbelt.",
      ],
      example:
        "Your portfolio is 1,000 USDC and you cap risk at 2% (20 USDC) per trade. You want to buy XLM at 0.12 with a stop at 0.11 — a 0.01 risk per unit. Dividing your 20 USDC risk budget by the 0.01 per-unit risk gives a position of 2,000 XLM (240 USDC). If the stop hits, you lose exactly 20 USDC — 2% — not a fortune. Same maths whether you size by hand on the Manual tab or lean on the AI's LOW Position Size factor.",
    },
    {
      id: "c29-l5",
      title: "When to do nothing — the power of holding stablecoins",
      paragraphs: [
        "Cash is a position. Choosing to sit in a stablecoin like USDC and place no trade at all is a legitimate, often winning, decision — not a failure to act. When markets are choppy, directionless, or offering only poor reward/risk setups, the trade with the highest expected value is frequently no trade. Sitting in USDC keeps your capital dry and ready for a genuinely good opportunity instead of bleeding it away on marginal ones.",
        "The danger the rest of the time is overtrading. Every unnecessary trade pays fees and spread, invites slippage, and gives emotion another chance to steer you into a mistake. Forcing action out of boredom or FOMO is how good balances slowly shrink. Doing nothing costs almost nothing on Stellar beyond the opportunity of a move you skipped — and a skipped gain is far cheaper than a forced loss.",
        "In practice this means being comfortable holding your balance in USDC for stretches, watching the token detail charts and the AI proposals, and only deploying when a setup clears your own bar. The AI respects this too: its drawdown pause gate deliberately stops trading after a defined loss, enforcing a cooling-off period. Patience is a strategy, and USDC is where you wait.",
      ],
      example:
        "Over a flat, sideways week the AI surfaces three proposals, each with a mediocre reward/risk of about 1.2:1 and confidence below your threshold. A restless trader takes all three, pays fees on each, and ends the week slightly down. You do nothing, hold your balance in USDC, and stay flat. When a clean 3:1 setup finally appears the next week, you have the full balance ready to size into it — rewarded for having waited.",
    },
  ],
  quiz: [
    {
      id: "c29-q1",
      prompt: "You have a demanding full-time job, dislike staring at charts, and can comfortably hold a position through a rough week. Which style most likely suits you?",
      options: [
        {
          text: "Day trading, because closing every position within the day is the safest approach.",
          explanation:
            "Day trading demands hours of focused screen time and fast execution, and its frequent fills stack up network, pool, and spread costs. It fits neither your schedule nor your dislike of chart-watching.",
        },
        {
          text: "Swing trading or HODLing, because both tolerate a hands-off schedule and holding through short-term dips.",
          explanation:
            "Correct. Both styles need only occasional check-ins and reward the temperament to sit through drawdowns without panic — a much better fit for a busy person comfortable holding through a rough week.",
        },
        {
          text: "Whichever style has the highest theoretical returns, regardless of your temperament.",
          explanation:
            "Wrong lens. A style you cannot sustain leads to forced errors and burnout. The best fit is the slowest style that still meets your goals, chosen around your time and tolerance.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q2",
      prompt: "What best describes dollar-cost averaging (DCA)?",
      options: [
        {
          text: "Buying a fixed amount on a fixed schedule regardless of the current price.",
          explanation:
            "Correct. Like paying 50 EUR into a savings plan every month, DCA buys the same amount each interval — more units when cheap, fewer when expensive — removing timing and emotion from the decision.",
        },
        {
          text: "Waiting for the single lowest price of the year and then buying everything at once.",
          explanation:
            "That is lump-sum market timing, the opposite of DCA. Nobody reliably picks the yearly bottom, and DCA exists precisely to avoid needing to.",
        },
        {
          text: "Selling a fixed fraction of your holdings every time the price rises.",
          explanation:
            "That describes a scaling-out or profit-taking rule, not DCA. Dollar-cost averaging is about steady, scheduled buying, not price-triggered selling.",
        },
        {
          text: "Doubling your buy size after every losing week to recover faster.",
          explanation:
            "That is a martingale-style averaging-down bet, which grows risk dangerously. DCA keeps the amount fixed on purpose, exactly so it never balloons.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c29-q3",
      prompt: "You enter XLM at 0.12 USDC, set a target at 0.18 and a stop-loss at 0.10. What is the reward/risk ratio?",
      options: [
        {
          text: "1:1 — the trade is a coin flip.",
          explanation:
            "Incorrect. The reward (0.18 − 0.12 = 0.06) and the risk (0.12 − 0.10 = 0.02) are not equal, so it is far from 1:1.",
        },
        {
          text: "3:1 — reward of 0.06 divided by risk of 0.02.",
          explanation:
            "Correct. Distance to target is 0.06 and distance to stop is 0.02, so 0.06 / 0.02 = 3:1. You risk one unit to try to make three, and can be wrong more often than right and still profit.",
        },
        {
          text: "0.33:1 — you are risking three to make one.",
          explanation:
            "That inverts the formula. Reward/risk divides distance-to-target by distance-to-stop, giving 3:1; the flipped 1:3 would be a poor setup you should usually decline.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q4",
      prompt: "Why is position sizing considered so crucial, and how does the app's Position Size risk factor help?",
      options: [
        {
          text: "It guarantees each trade is profitable by choosing only winning entries.",
          explanation:
            "No sizing rule can guarantee a winner. Position sizing controls how much a loss costs you, not whether the trade wins.",
        },
        {
          text: "It caps how much any single loss can hurt you; the Position Size factor set to LOW proposes small, conservative slices per trade.",
          explanation:
            "Correct. Risking only a small percentage per trade lets you survive a losing streak. The AI's Position Size factor (LOW/MED/HIGH) scales the fraction of balance per trade, alongside a hard trading cap and drawdown pause gate.",
        },
        {
          text: "It lets the AI stake your entire wallet on its single highest-confidence idea.",
          explanation:
            "The opposite of good sizing. A hard trading cap and the drawdown gate exist precisely so the AI can never bet the whole wallet on one call.",
        },
        {
          text: "It replaces the need for a stop-loss entirely.",
          explanation:
            "Backwards — sizing is derived from your stop-loss. You pick the stop first, then size so that hitting it costs only your chosen small percentage.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q5",
      prompt: "Markets are choppy and every available setup offers only mediocre reward/risk below your bar. What is often the strongest move?",
      options: [
        {
          text: "Force a few trades anyway so your capital is always working.",
          explanation:
            "This is overtrading. Each marginal trade pays fees and spread, invites slippage, and hands emotion another chance to err — a reliable way to bleed a balance.",
        },
        {
          text: "Do nothing and hold your balance in USDC until a genuinely good setup appears.",
          explanation:
            "Correct. Cash is a position. Sitting in a stablecoin keeps your capital dry and ready, avoids forced bad trades, and costs almost nothing beyond a skipped move — far cheaper than a forced loss.",
        },
        {
          text: "Switch to day trading to squeeze profit out of the small moves.",
          explanation:
            "Trading faster in a directionless market multiplies costs and mistakes rather than reducing them. Choppy, low-quality conditions call for patience, not more activity.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

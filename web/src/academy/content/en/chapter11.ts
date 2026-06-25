import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "Risk Settings and the AI",
  description: "How configurable policy limits shape every trade, and how conservative or aggressive values express a risk profile.",
  lessons: [
    {
      id: "c11-l1",
      title: "What are risk factors and why do they matter?",
      paragraphs: [
        "Risk factors are the policy limits that sit between the bot and your wallet. Before any order goes out, the proposal is checked against each limit. If it breaks one, the trade is refused, shrunk, or blocked entirely. These checks exist because a single oversized or badly timed trade can do more damage than dozens of small good ones.",
        "Think of them as guardrails, not a strategy. They do not decide what to buy; they decide how much, how often, and under what market conditions the bot is allowed to act. A profitable signal that arrives with a terrible spread or after the daily loss budget is spent will still be turned away.",
        "Every limit has a sensible default, but the defaults are yours to change. Tightening them lowers the worst case you can suffer in a day; loosening them lets the bot pursue more opportunities at the cost of larger possible drawdowns.",
      ],
      example: "With maxAmountPerTrade set to 10 base units and maxDailyLoss set to 25 XLM, the bot can never stake more than 10 on a single position and stops opening new trades once the day has bled 25 XLM, no matter how confident a signal looks.",
    },
    {
      id: "c11-l2",
      title: "What does each risk factor control in this app?",
      paragraphs: [
        "Size is capped by maxAmountPerTrade, with a larger ceiling for blue-chip stablecoin pairs, so a familiar XLM/USDC trade may be allowed bigger than an exotic one. Activity is bounded by maxTradesPerDay and maxDailyVolume, which stop the bot from churning. Total risk on the table at once is held under maxOpenExposure, and a per-pair multiplier limits how concentrated any single pair can get.",
        "Fill quality is protected by maxSlippageBps and maxEntrySpreadBps. If the expected price move on the fill exceeds your slippage tolerance, or the order book is wider than your spread limit, the bot refuses rather than pay up. These quietly prevent the worst executions.",
        "Trade structure is governed by stopLossPct, the backstop distance below entry, and minRiskReward, the minimum reward-to-risk ratio measured against the invalidation level. The daily loss budget, maxDailyLoss, also auto-tapers position size as losses build before halting new entries.",
      ],
      example: "Defaults of maxAmountPerTrade 10 (50 for blue-chip pairs), maxDailyVolume 500 XLM, maxTradesPerDay 100, maxOpenExposure 150 XLM with a 3x per-pair multiplier, maxSlippageBps 50 (0.5%), maxEntrySpreadBps 100 (1%), stopLossPct 5%, and minRiskReward 1.2 together define one balanced policy.",
    },
    {
      id: "c11-l3",
      title: "LOW vs MEDIUM vs HIGH — what changes at each level?",
      paragraphs: [
        "There is no single LOW, MEDIUM, or HIGH risk button or dropdown in this app. A risk profile is not one toggle; it is the overall shape you get by choosing conservative, balanced, or aggressive values across all the limits above. LOW, MEDIUM, and HIGH are just names we give to those combinations.",
        "A LOW profile means smaller per-trade caps, a smaller daily-loss budget, tighter exposure and slippage limits, and a wider stop-loss buffer to avoid being shaken out. A HIGH profile is the opposite: bigger trades, a larger loss budget, looser exposure and slippage, and a tighter stop. MEDIUM sits in between, near the defaults.",
        "Do not confuse this with the AI's per-proposal confidence, which is also labelled low, medium, or high. That confidence describes how strongly the AI believes in one specific trade. In auto-trade mode only medium and high-confidence proposals auto-execute. Confidence is the AI grading a trade; a risk profile is you grading your own appetite through the limit values.",
      ],
      example: "A LOW user might set maxAmountPerTrade to 4, maxDailyLoss to 10 XLM, maxSlippageBps to 25, and stopLossPct to 8%; a HIGH user might set 20, 60 XLM, 80, and 3% on the very same fields.",
    },
    {
      id: "c11-l4",
      title: "How risk settings affect AI position size and stop loss placement",
      paragraphs: [
        "The AI proposes a trade, but your limits decide its final shape. The requested size is clamped to maxAmountPerTrade and trimmed further if it would push total risk past maxOpenExposure or the per-pair multiplier. So even a high-confidence buy lands smaller when your caps are tight.",
        "The daily-loss budget adds a dynamic layer. As realised losses climb toward maxDailyLoss, the bot auto-tapers new position sizes from about 100% down to roughly 25%, then halts new entries for the day while still allowing risk-reducing exits. A wider stopLossPct gives the trade more room to breathe but, for the same size, means a larger possible loss per trade, which interacts with that budget.",
        "Stop placement and minRiskReward work together. The stop sets where you are wrong; the target must clear minRiskReward against that distance or the proposal is rejected. Tighter stops demand nearer targets to keep the ratio, shaping which trades survive screening.",
      ],
      example: "If the day is already down 20 of a 25 XLM budget, the bot is deep in taper: a proposal it would normally size at 10 base units may be cut to around 2.5, and once losses reach 25 XLM no new entries open at all.",
    },
    {
      id: "c11-l5",
      title: "How to choose the right risk profile for your situation",
      paragraphs: [
        "Start from what you can afford to lose in a single day, then set maxDailyLoss to that number first; many other choices follow from it. A loss budget you would be uncomfortable hitting is too high. From there, size maxAmountPerTrade and maxOpenExposure so that a normal bad day stays well inside that budget.",
        "Match slippage and spread limits to the pairs you actually trade. Liquid blue-chip pairs tolerate tighter maxSlippageBps and maxEntrySpreadBps; thin pairs need looser values or they will simply never fill. Set stopLossPct and minRiskReward to reflect how much noise you will sit through versus how favourable a trade must be to qualify.",
        "Treat the profile as a living setting. If the bot is refusing almost everything, your limits may be too tight for the market; if drawdowns feel alarming, tighten size, exposure, and the loss budget. Change one factor at a time so you can see its effect.",
      ],
      example: "A cautious newcomer trading mostly XLM/USDC might begin LOW: maxDailyLoss 10 XLM, maxAmountPerTrade 4, maxOpenExposure 50 XLM, maxSlippageBps 25, stopLossPct 7%, minRiskReward 1.5, then loosen toward the defaults only once results justify it.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "What best describes the role of the risk factors in this bot?",
      options: [
        { text: "They are guardrails that cap how much, how often, and under what conditions the bot may trade, refusing or shrinking trades that break a limit.", explanation: "Correct. The limits gate every proposal before it executes; they constrain behaviour rather than generate signals." },
        { text: "They are the trading strategy that decides which assets to buy and sell.", explanation: "Incorrect. The limits do not pick assets; they constrain size, frequency, exposure, and fill quality of whatever the strategy proposes." },
        { text: "They only apply to manual trades and are ignored when the AI is running.", explanation: "Incorrect. The limits are checked for proposals regardless of source, including the AI in auto-trade mode." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "What happens as realised losses climb toward maxDailyLoss (e.g. 25 XLM)?",
      options: [
        { text: "Nothing changes until the budget is exceeded, then the wallet is locked completely.", explanation: "Incorrect. The taper begins before the budget is hit, and even at the limit risk-reducing exits are still allowed." },
        { text: "The bot auto-tapers new position size from about 100% down to roughly 25%, then halts new entries while still allowing risk-reducing exits.", explanation: "Correct. Sizing shrinks dynamically as the budget is approached, and only new entries stop at the limit." },
        { text: "The bot doubles position size to win the losses back faster.", explanation: "Incorrect. That is martingale behaviour; the bot does the opposite by tapering size down." },
        { text: "maxSlippageBps is automatically loosened to fill more trades.", explanation: "Incorrect. The loss budget controls sizing and entries, not the slippage tolerance." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q3",
      prompt: "How do you set the bot to a LOW risk profile?",
      options: [
        { text: "Select LOW from the single risk-level dropdown in settings.", explanation: "Incorrect. No such single button or dropdown exists; a profile is not one toggle." },
        { text: "Choose conservative values across the individual limits — smaller per-trade and exposure caps, a smaller daily-loss budget, tighter slippage, and a wider stop buffer.", explanation: "Correct. LOW, MEDIUM, and HIGH are names for combinations of limit values you set yourself; there is no single switch." },
        { text: "Set the AI confidence to low so it only takes safe trades.", explanation: "Incorrect. AI confidence grades individual proposals and is separate from your risk profile, which lives in the limit values." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q4",
      prompt: "An AI proposal asks to buy more than maxAmountPerTrade allows. What happens to its size?",
      options: [
        { text: "It is clamped down to the cap, and trimmed further if it would breach maxOpenExposure or the per-pair multiplier.", explanation: "Correct. The AI proposes, but your size and exposure limits shape the final order, even for confident trades." },
        { text: "It executes at the requested size because high AI confidence overrides the caps.", explanation: "Incorrect. Confidence does not bypass the limits; the size is still clamped to maxAmountPerTrade." },
        { text: "The whole proposal is discarded and logged as an error.", explanation: "Incorrect. An oversized request is reduced to fit rather than thrown away outright." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "When choosing a risk profile, which approach matches the guidance in this chapter?",
      options: [
        { text: "Maximise maxAmountPerTrade and maxOpenExposure first to capture every opportunity.", explanation: "Incorrect. That leads with the most aggressive levers and ignores what you can afford to lose." },
        { text: "Copy a friend's settings exactly, since one profile suits everyone.", explanation: "Incorrect. Profiles should reflect your own loss tolerance and the pairs you trade, not be copied blindly." },
        { text: "Set maxDailyLoss to what you can afford to lose in a day first, size the other caps to fit inside it, and adjust one factor at a time.", explanation: "Correct. Anchoring on the daily-loss budget and tuning incrementally is the recommended approach." },
        { text: "Use the tightest possible slippage and spread limits on every pair regardless of liquidity.", explanation: "Incorrect. Thin pairs need looser slippage and spread values or they will never fill; match limits to the pair." },
      ],
      correctIndex: 2,
    },
  ],
};

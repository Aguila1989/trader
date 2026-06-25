import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "AI Trading",
  description: "How the analyst generates proposals, the data behind them, and how to read, accept, reject, and combine them with manual trades.",
  lessons: [
    {
      id: "c10-l1",
      title: "How does the AI generate trade proposals?",
      paragraphs: [
        "The bot calls an AI model known as the analyst. You choose a provider from a dropdown, such as Anthropic Claude, OpenAI, or DeepSeek, and only providers that have a configured key are selectable. The analyst does not run continuously. It runs when you press Scan the chain, when you Analyze a single pair, or on the auto-scan timer if you have one enabled.",
        "On each run the analyst is handed a snapshot of the market and your account, and it returns zero or more proposals. Each proposal is a structured object, not free text, so the app can act on it. It carries a side of buy or sell, the base and quote assets, an amount, a limit price, a max slippage, a written reason, and a confidence of low, medium or high. It may also add a target price, an invalidation price and a holding-horizon hint.",
        "A cooldown stops the analyst from re-proposing the same pair and side too quickly, so you are not flooded with the same idea. If the analyst sees nothing worth acting on, it simply returns no proposal for that pair.",
      ],
      example: "You press Scan the chain. The analyst reviews XLM/USDC and returns one proposal: side buy, amount 40 XLM, limit price 0.1180 USDC, max slippage 0.5 percent, confidence medium, reason the ask has thinned and the last three dips were bought back within minutes.",
    },
    {
      id: "c10-l2",
      title: "What data does the AI use to make decisions?",
      paragraphs: [
        "The analyst only knows what the app feeds it. It sees the live order book, meaning the best bid and ask plus the visible depth, alongside the 24h volume and recent OHLC candles for the pair. That tells it where price is, how tight the spread is, and how much size the book can absorb.",
        "It also sees your situation: your current holdings, your open offers, today's realized profit and loss, and the unrealized profit and loss on any open position. So a proposal is shaped by what you already own, not just by the chart.",
        "Finally it sees recent trades and, importantly, how price moved after each one, plus the effective per-trade size cap. The post-trade outcomes let it judge whether recent entries actually worked, and the size cap keeps its proposed amount within what policy allows.",
      ],
      example: "Inputs for one XLM/USDC run: best bid 0.1176, best ask 0.1182, 24h volume 92,000 XLM, holdings 600 XLM and 0 USDC, no open offers, realized PnL today plus 1.20 USDC, last two buys each gained about 0.3 percent afterward, per-trade cap 50 XLM. The analyst proposes a 40 XLM amount, comfortably under the cap.",
    },
    {
      id: "c10-l3",
      title: "How to interpret an AI proposal",
      paragraphs: [
        "Read the side first. Buy means the analyst wants to acquire the base asset by spending the quote; sell means the opposite. The limit price is the worst price it will accept, and max slippage bounds how far the fill can drift, so together they cap how bad the execution can get.",
        "Read the reason next. A good reason ties to the data you saw in the previous lesson, for example a thinning ask, a bought-back dip, or rising volume. A vague reason is itself a warning sign. The optional target and invalidation prices tell you where the analyst expects to take profit and where the idea is wrong, which is your exit map.",
        "Confidence is the analyst's own conviction, not a probability. Treat low confidence as a tentative idea, medium as a normal signal, and high as a strong one. Confidence never overrides policy: the backend still enforces limits, slippage and balance before anything is submitted.",
      ],
      example: "A sell proposal reads: sell 30 XLM, limit 0.1205 USDC, max slippage 0.4 percent, target 0.1205, invalidation 0.1240, confidence high, reason resistance held twice at 0.1208 on falling volume. You can see the plan: take profit near 0.1205, abandon the idea if price reclaims 0.1240.",
    },
    {
      id: "c10-l4",
      title: "When to accept and when to reject a proposal",
      paragraphs: [
        "Your two trading approval modes behave differently. In approve-every-trade mode, every proposal waits for you to press Approve or Reject, regardless of confidence. In auto-trade mode, only medium- and high-confidence proposals auto-execute; a low or missing confidence still waits for your manual approval.",
        "There is one consistent exception in both modes. Risk-reducing exits, such as a stop close that reduces an open position, execute immediately. The app will not make you sit and approve getting out of a losing trade.",
        "When you do hold the decision, judge the reason against the data, check the limit price and slippage are sane, and confirm you actually hold the balance the trade needs. Reject when the reason is thin, when the limit price has already run away, or when the proposal would over-concentrate you in one asset. The backend will block an impossible trade anyway, but rejecting early keeps your history clean.",
      ],
      example: "In auto-trade mode the analyst proposes buy 40 XLM at 0.1180, confidence high. Because it is high confidence it auto-executes through the safety gates. Moments later it proposes sell 20 XLM at 0.1240, confidence low; that one pauses and waits in the queue for you to Approve or Reject.",
    },
    {
      id: "c10-l5",
      title: "How AI and manual trading work together",
      paragraphs: [
        "The analyst only ever proposes. The backend is what enforces policy and acts: it checks the per-trade limit, the max slippage, your balance, and the kill switch, then signs and submits the order. Any manual trade you place by hand goes through the exact same safety gates, so a hand order can never bypass a check that an AI order respects.",
        "Trading mode applies to both sources equally. In Read-only the app observes and proposes but never trades, in Paper it simulates fills, and in Live it submits real on-chain orders. The kill switch sits above everything and blocks all trading, AI and manual alike.",
        "Because both streams flow through one engine, the history table labels each fill as Manual or Bot so you can tell them apart afterward. You can run a manual trade while the analyst is active; they share your balances and limits, so a manual buy reduces the room left under your size cap for the analyst's next idea.",
      ],
      example: "Mode is Live, approval is auto-trade. You manually sell 100 XLM for USDC. The analyst then proposes a medium-confidence buy; it auto-executes but only after the balance pre-check confirms the USDC you just received covers it. The history table shows your sell tagged Manual and the buy tagged Bot.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "When does the analyst actually run and produce proposals?",
      options: [
        { text: "Continuously in the background on every price tick.", explanation: "Incorrect. The analyst is not a streaming process; it runs only on specific triggers, not every tick." },
        { text: "When you Scan the chain, Analyze a pair, or on the auto-scan timer.", explanation: "Correct. Those are the three triggers that invoke the analyst." },
        { text: "Only once at startup, then it caches a fixed plan for the day.", explanation: "Incorrect. There is no one-shot daily plan; each run produces fresh proposals from a current snapshot." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "Which of these does the analyst NOT receive as input?",
      options: [
        { text: "The live order book, 24h volume, and OHLC candles.", explanation: "Incorrect. These market inputs are part of the snapshot it sees." },
        { text: "Your holdings, open offers, and today's realized and unrealized PnL.", explanation: "Incorrect. Your account state is fed in so proposals fit what you hold." },
        { text: "Your provider API key value so it can re-bill itself.", explanation: "Correct. The raw key is never part of the analyst's decision inputs; it is only used to authenticate the provider call." },
        { text: "Recent trades, how price moved after them, and the per-trade size cap.", explanation: "Incorrect. These are inputs; the post-trade outcomes and cap shape its judgement and sizing." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q3",
      prompt: "On a proposal, what does the confidence field of low, medium or high represent?",
      options: [
        { text: "A guaranteed win probability the backend uses to size the order.", explanation: "Incorrect. It is not a probability and it does not set the size; the per-trade cap does that." },
        { text: "The analyst's own conviction in the idea, which never overrides policy gates.", explanation: "Correct. It signals how strongly the analyst believes in the idea, but limits, slippage and balance are still enforced." },
        { text: "How fast the order will fill on-chain.", explanation: "Incorrect. Fill speed is about liquidity and price, not the confidence label." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q4",
      prompt: "In auto-trade mode, which proposals execute on their own?",
      options: [
        { text: "Every proposal, regardless of confidence.", explanation: "Incorrect. That describes approve-every-trade mode, not auto-trade." },
        { text: "Only low-confidence proposals, since they are least risky.", explanation: "Incorrect. It is the reverse; low or missing confidence waits for your approval." },
        { text: "Medium- and high-confidence proposals, while low or missing confidence waits for approval.", explanation: "Correct. Auto-trade executes medium and high automatically; low or missing confidence pauses for you. Risk-reducing exits always execute immediately." },
        { text: "None; auto-trade only drafts orders and never submits them.", explanation: "Incorrect. Auto-trade does submit qualifying proposals; that is its purpose." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "How do AI proposals and manual trades coexist in the app?",
      options: [
        { text: "Both flow through the same backend safety gates and are labelled Manual or Bot in history.", explanation: "Correct. One engine enforces limits, slippage, balance and the kill switch for both, and history tags each fill by source." },
        { text: "Manual trades skip the safety gates so you can act faster.", explanation: "Incorrect. Manual orders go through the exact same checks as AI orders; nothing bypasses them." },
        { text: "The kill switch blocks AI trades but lets manual trades through.", explanation: "Incorrect. The kill switch blocks all trading, AI and manual alike." },
        { text: "AI and manual trades use separate balances that never affect each other.", explanation: "Incorrect. They share your balances and limits, so a manual trade reduces the room left for the analyst's next order." },
      ],
      correctIndex: 0,
    },
  ],
};

import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "AI Trading Deep Dive",
  description: "A technical look at how the analyst reasons, what a proposal contains, when to accept or reject it, how it coexists with manual trading, and how to read the AI log.",
  lessons: [
    {
      id: "c10-l1",
      title: "How the AI generates trade proposals — the data it uses and how it reasons",
      paragraphs: [
        "The AI in this bot is called the analyst, and it is a tool-driven model rather than a chat box. You pick a provider from the dropdown (Anthropic Claude, OpenAI, or DeepSeek), and only providers with a configured API key are selectable. The analyst runs on three triggers: Analyze for a single pair, Scan the chain across the curated XLM universe plus a few cross pairs, or the auto-scan timer if you have enabled it. It does not stream; each run is a discrete request that ends in zero or more proposals.",
        "Reasoning happens through tool calls, not guesswork. The analyst asks get_account_balances to see your holdings and your resting offers, get_market for the orderbook best bid and ask plus visible depth, and get_price_history for OHLC candles bundled with server-computed indicators. Those indicators are calculated on the backend, not by the model, so they are consistent across runs: rsi14, ema8 versus ema24, atrPct and realizedVolPct, efficiencyRatio, rangePos from 0 at the low to 1 at the high, volRatio, flowBuyPct, and a regime tag of trending-up, trending-down, ranging, or volatile.",
        "Crucially, the analyst is not stateless. It receives a trading memory block: realized PnL today in XLM, unrealized PnL on open positions, your current positions, and recent trades each annotated with their side-adjusted percent move at plus-1h and plus-24h. Those post-trade outcomes let it grade whether recent entries actually worked rather than re-running a chart in a vacuum. It is also told the active risk profile and the effective per-trade size cap for that exact pair, so its proposed amount is bounded before policy ever sees it.",
        "Putting it together, a single run reads roughly like this: fetch holdings and offers, fetch the book, fetch candles and indicators, fold in the memory of how the last entries played out, then decide whether the current regime and book justify an entry the wallet can actually fund inside the size cap. If nothing clears that bar, the analyst returns no proposal for the pair, which is a normal and frequent outcome.",
      ],
      example: "A Scan the chain run on XLM/USDC: get_market returns best bid 0.1176 and ask 0.1182, get_price_history returns regime ranging with rangePos 0.18, rsi14 41, ema8 just crossing above ema24, flowBuyPct 0.61. The memory block shows the last two dip buys gained plus 0.3 percent at plus-1h. The per-trade cap is 50 XLM. The analyst emits one buy proposal for 40 XLM.",
    },
    {
      id: "c10-l2",
      title: "Inside an AI proposal: confidence score, reasoning, risk snapshot, price",
      paragraphs: [
        "Every proposal is emitted through the propose_stellar_trade tool as a structured object, never free text, so the backend can act on it deterministically. The object carries side (buy or sell), the base and quote assets, an amount, a limit_price, a post_only flag, a max_slippage_bps, a written reason, a numeric confidence score from 0 to 100, a target_price, an invalidation_price, and an optional horizon expressed in hours, days, or weeks.",
        "The confidence field is a recent and important change: it is now a numeric 0 to 100 score, not a low, medium, or high label. That precision matters because Expert Mode compares the score directly against your exact minConfidence threshold. If the score falls short, the proposal is held for review and an event is written, for example Proposal skipped: confidence 68 < threshold 70. A missing or garbled confidence always fails closed, so a malformed score is treated as a reject rather than a pass.",
        "The post_only flag encodes the maker-first intent. When set, the order rests at the touch to capture the spread as a maker rather than crossing the book and paying the taker side. Read together with max_slippage_bps, these two fields bound execution quality: post_only aims to earn the spread, while the slippage cap limits how far a crossing fill may drift if the book moves.",
        "The reason, target_price, and invalidation_price form the thesis and its exit map. The backend derives a reward-to-risk ratio from the distance between limit_price and target_price versus limit_price and invalidation_price, and it enforces a minimum ratio (default 1.2) before allowing the trade. Alongside the proposal, the full risk-profile snapshot is logged so the conditions are auditable: the AI log records a proposal event and a risk_profile event for each run, capturing the active per-factor profile and the effective caps in force at that moment.",
      ],
      example: "A propose_stellar_trade payload: side sell, base XLM, quote USDC, amount 30, limit_price 0.1205, post_only true, max_slippage_bps 40, confidence 74, target_price 0.1232, invalidation_price 0.1188. Reward-to-risk is about 1.6, clearing the 1.2 minimum, and 74 clears a minConfidence of 70, so the proposal passes the gate and is logged with its risk_profile snapshot.",
    },
    {
      id: "c10-l3",
      title: "When to accept and when to reject an AI proposal",
      paragraphs: [
        "Acceptance is a judgement about three things the proposal hands you: the reason, the confidence score, and the target versus invalidation reward-to-risk. A proposal earns acceptance when its written reason ties cleanly to the indicators and book you can verify, its confidence sits comfortably above your threshold rather than scraping it, and the distance to target_price meaningfully exceeds the distance to invalidation_price. If any of the three is weak, you are looking at a marginal idea even if the backend would technically let it through.",
        "Fundability is the hard gate people forget. To BUY the base asset you must hold the quote asset, and to SELL you must hold the base. The balance pre-check will block an unfundable trade, but you should not lean on it; an all-XLM wallet cannot fund any buy proposal no matter how strong the thesis, which is exactly the wallet-positioning trap that makes a sound analyst look idle. If you want the analyst to act on dip-buying, you have to hold some quote asset first. This is why a wallet that is all base asset will accumulate unfundable buy proposals while every fundable sell still executes: the misses are positioning misses, not the model being overly cautious.",
        "Reject decisively when the thesis is thin, when the numeric score is below or barely at your threshold, when the limit_price has already run away from where the reason was built, or when accepting would over-concentrate you in one asset. In approve-every-trade mode nothing submits until you click, so a reject costs you nothing and keeps your decision history clean and meaningful for later review.",
        "Remember that the backend still enforces policy regardless of your read. Even a proposal you love must clear the whitelist, the per-trade size cap, the daily volume, trade, and loss caps, the slippage bound, the minimum reward-to-risk ratio, the exposure caps, the 24h-drawdown pause, and the balance pre-check. Your accept is a green light, not an override; the gates are the backstop.",
      ],
      example: "The analyst proposes buy 40 XLM at 0.1180, confidence 82, target 0.1240, invalidation 0.1160, reward-to-risk about 3.0, reason a thinning ask with flowBuyPct 0.66. The thesis, score, and reward-to-risk all hold, but your wallet is 600 XLM and 0 USDC, so it is unfundable; the balance pre-check would block it and the right move is to first hold USDC if you want this buy side to execute.",
    },
    {
      id: "c10-l4",
      title: "How the AI and manual trading interact — precedence, conflicts, coexistence",
      paragraphs: [
        "Manual and AI trades flow through one execution engine and share the same safety gates, but they differ in one deliberate way: a manual order BYPASSES the AI per-trade size cap. The size cap exists to bound what the analyst sizes on your behalf, so when you place an order by hand you are sizing it yourself and the cap does not apply. Every other gate still does, so a manual order can never skip the whitelist, slippage, loss caps, drawdown pause, or balance pre-check.",
        "Risk-reducing exits take precedence over approval friction. A stop-loss close that reduces an open position auto-executes immediately even in approve-every-trade mode, because the bot will not make you sit and approve getting out of a losing position. Entries and adds wait for your approval where the mode requires it; protective exits do not, and this asymmetry is intentional so that protection is never gated behind a click you might miss.",
        "AI and manual stop losses coexist rather than fight. If you have set a manual stop and the analyst also carries one, the monitor enforces the most protective of the two, meaning the stop that exits earlier on adverse movement wins. You never end up with a looser AI stop overriding a tighter manual one; protection always ratchets toward safety. The same logic applies if you tighten a manual stop after the analyst set its own: the monitor simply tracks whichever level is now closer, so manual intervention can make protection stricter but never looser.",
        "Because both streams share your real balances and limits, they interact through the wallet itself. A manual buy consumes quote asset and reduces the room left under the size cap for the analyst's next idea; a manual sell frees quote asset that can then fund an AI buy. The history table tags each fill as Manual or Bot so you can reconstruct who did what, and the kill switch sits above both, blocking all trading regardless of source.",
      ],
      example: "Mode is Live with approve-every-trade. You manually sell 200 XLM for USDC, sized above the analyst per-trade cap, which is allowed because manual orders bypass that one cap. Price then drops into your open long and a stop-loss close fires; it auto-executes without waiting for approval because it reduces risk. The manual stop at 0.1170 and the AI stop at 0.1165 coexist, and the monitor enforces 0.1170 as the more protective.",
    },
    {
      id: "c10-l5",
      title: "How to read the AI log and interpret decision history",
      paragraphs: [
        "The AI Log lives under the Logs tab in its own AI Log sub-tab. It is paginated and filterable by event type, by token, and by date, and each row shows the reasoning, the risk-profile snapshot, the confidence, the direction, and the price for that event. Reading it well means treating it as the analyst's reasoning trail, not just a list of fills.",
        "Learn the event vocabulary, because each type tells a different part of the story. A proposal event is an idea the analyst emitted; accepted and rejected record what happened to it; risk_constraint marks a proposal a policy gate blocked, such as a size cap or reward-to-risk failure; stop_loss records a protective exit; trail_update shows a trailing stop ratcheting; cooldown shows the analyst was prevented from re-proposing the same pair and side too soon; and risk_profile captures the active profile and effective caps at the time of the run.",
        "The most informative reads pair events together. A proposal immediately followed by a risk_constraint tells you the idea was sound but policy stopped it, which is a tuning signal rather than a model failure. A run that logs no proposal at all, or a proposal skipped line like confidence 68 < threshold 70, tells you the analyst looked and declined, which is exactly what you want to see most of the time. A long series of unfundable buys with no fills is the wallet-positioning signature, not over-caution.",
        "The always-on LiveLogDrawer complements the full log by showing the last roughly 20 combined events with deep-links, so you can glance at recent activity without opening the Logs tab and jump straight to the full entry when something looks worth investigating. Use the drawer for live monitoring and the AI Log sub-tab for forensic review, filtering by token and date when you want to reconstruct a single pair's decision history end to end.",
      ],
      example: "Filtering the AI Log to XLM over one day shows: a risk_profile event capturing the active profile, then a proposal buy at confidence 74, then a risk_constraint reading reward-to-risk 1.05 below minimum 1.2, so no fill. An hour later a cooldown event blocks a near-identical buy. The trail tells you the analyst was active and reasonable, and that policy, not the model, kept you flat.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "Which set of inputs does the analyst actually receive on a run?",
      options: [
        { text: "Only the raw OHLC candles, with all indicators computed by the model itself.", explanation: "Incorrect. The indicators such as rsi14, ema8 vs ema24, atrPct, efficiencyRatio, rangePos, volRatio, flowBuyPct, and the regime tag are computed server-side and handed to the analyst, not derived by the model." },
        { text: "Balances and resting offers, the orderbook and depth, candles with server-computed indicators, a trading-memory block with post-trade outcomes, and the per-pair size cap.", explanation: "Correct. The analyst gathers these via get_account_balances, get_market, and get_price_history, plus the memory block and the effective per-trade cap for the pair." },
        { text: "A continuous price stream that it watches tick by tick.", explanation: "Incorrect. The analyst is not a streaming process; it runs on discrete triggers (Analyze, Scan the chain, or the auto-scan timer) and reads a snapshot each time." },
        { text: "Your provider API key plus the chart, and nothing about your existing positions.", explanation: "Incorrect. The analyst is fed your positions, realized and unrealized PnL, and recent post-trade outcomes; the raw API key is never a decision input." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "In Expert Mode, how is the proposal's confidence field handled?",
      options: [
        { text: "It is a low, medium, or high label that maps to an auto-execute tier.", explanation: "Incorrect. That is the basic-mode label gate; the field is now a numeric 0 to 100 score, and Expert Mode compares it to an exact threshold." },
        { text: "It is a numeric 0 to 100 score compared against your exact minConfidence; below threshold it is held and logged, and a missing or garbled value fails closed.", explanation: "Correct. Expert Mode does a precise numeric comparison, writes a skip line like confidence 68 < threshold 70 when it falls short, and treats a malformed score as a reject." },
        { text: "It is a win probability the backend uses to size the order.", explanation: "Incorrect. Confidence is conviction, not a probability, and it does not size the order; the per-trade size cap and your amount do." },
        { text: "It is ignored entirely once reward-to-risk passes.", explanation: "Incorrect. The confidence gate is independent of the reward-to-risk check; both must pass, and the score is logged either way." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q3",
      prompt: "A proposal has a strong reason, confidence 82, and reward-to-risk near 3.0, but your wallet holds only XLM and the proposal is a buy of XLM with USDC. What should you conclude?",
      options: [
        { text: "It is unfundable; the balance pre-check will block it, and to act on the buy side you must first hold some USDC.", explanation: "Correct. Buying requires the quote asset on hand. An all-XLM wallet cannot fund a USDC-quoted buy, which is the wallet-positioning trap, not over-caution." },
        { text: "Accept it; a high score and good reward-to-risk override the need to hold the quote asset.", explanation: "Incorrect. No score overrides fundability. To buy the base you must hold the quote asset, here USDC." },
        { text: "The backend will auto-convert your XLM to USDC to fund the buy.", explanation: "Incorrect. There is no silent auto-conversion to satisfy a proposal; the balance pre-check simply blocks an unfundable trade." },
        { text: "Reject it because confidence 82 is too high to trust.", explanation: "Incorrect. A high score is not a reason to reject; the real blocker here is fundability, not the strength of the thesis." },
      ],
      correctIndex: 0,
    },
    {
      id: "c10-q4",
      prompt: "How do manual orders and AI orders differ and coexist in the execution engine?",
      options: [
        { text: "Manual orders skip all safety gates so you can act faster.", explanation: "Incorrect. Manual orders pass the same gates as AI orders; they bypass only the AI per-trade size cap, nothing else." },
        { text: "A stop-loss close must always be approved manually, even in auto modes.", explanation: "Incorrect. Risk-reducing exits, including stop-loss closes, auto-execute immediately even in approve-every-trade mode." },
        { text: "Manual orders bypass the AI per-trade size cap, risk-reducing exits auto-execute even in approve-every-trade mode, and when both set stops the monitor enforces the most protective one.", explanation: "Correct. Manual sizing is yours so the AI size cap does not apply, exits never wait for approval, and stops ratchet toward the tighter, more protective level." },
        { text: "If both an AI and a manual stop exist, the looser AI stop wins.", explanation: "Incorrect. The monitor enforces the most protective stop, so the tighter one wins, never the looser." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "In the AI Log, you see a proposal event followed immediately by a risk_constraint event reading reward-to-risk 1.05 below minimum 1.2. What does this tell you?",
      options: [
        { text: "The analyst is broken and produced an invalid proposal.", explanation: "Incorrect. The proposal was well-formed; a policy gate, not a model failure, stopped it from executing." },
        { text: "A whitelist violation blocked the trade.", explanation: "Incorrect. The logged constraint is a reward-to-risk shortfall, not a whitelist rejection; those are distinct gates and the log names which one fired." },
        { text: "The trade filled but at a worse price than intended.", explanation: "Incorrect. A risk_constraint event means the trade was blocked before execution, so there was no fill at all." },
        { text: "The idea was sound but policy blocked it because reward-to-risk fell below the 1.2 minimum, so no fill occurred; it is a tuning signal, not a model fault.", explanation: "Correct. Pairing the proposal with the risk_constraint shows policy enforcement, not over-caution. The reward-to-risk minimum kept you flat, and that is visible and auditable in the log." },
      ],
      correctIndex: 3,
    },
  ],
};

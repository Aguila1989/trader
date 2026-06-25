import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "AI Risk Settings: Full Control",
  description: "Deep dive into the six independent risk factors, Basic versus Expert mode, and how exact numeric thresholds shape every AI proposal.",
  lessons: [
    {
      id: "c11-l1",
      title: "What are risk factors and why are they separate?",
      paragraphs: [
        "The Risk Settings panel lives on the Bot Trading tab and exposes six independent risk factors: Position Size, Stop Loss Distance, Trade Frequency, Asset Volatility Tolerance, Drawdown Tolerance, and Slippage Tolerance. Each one governs a different point in the trade lifecycle, from which markets the chain scan even considers, through how confident the AI must be, down to how large an order it may submit and how far the protective stop sits. They are policy, not strategy: they never tell the AI what to buy, only the conditions under which it is allowed to act.",
        "The reason they are six separate dials rather than one global risk slider is that a single risk level is too blunt to express how real traders think. Risk appetite is not one-dimensional. A trader might want very tight stops because the recent edge is fragile, yet still want a high trade frequency because the strategy depends on catching many small spread-capture opportunities. A single slider would force tight stops and low frequency to move together, which is exactly the wrong coupling. Splitting the factors lets you mix a conservative setting on one axis with an aggressive setting on another, so the bot expresses your actual thesis instead of a compromise.",
        "Each factor is read live at proposal time, never cached. When you change a value it takes effect on the very next proposal the orchestrator generates, with no restart and no need to wait for a session boundary. This matters because market conditions shift faster than you can redeploy, and you want to be able to tighten the drawdown pause or loosen the volatility ceiling mid-session and have it bite immediately.",
        "Every numeric value is also written into the AI prompt and the full numeric snapshot is logged alongside the proposal it produced. That gives you an auditable record: for any historical proposal you can reconstruct exactly which six thresholds were in force when it was generated, which is essential when you are trying to attribute a skipped or executed trade to a specific setting rather than guessing.",
      ],
      example: "You believe in the spread-capture edge but distrust trend-following, so you set Trade Frequency aggressive (low minimum confidence) while keeping Stop Loss Distance tight at 2 percent. A single global slider could not express that combination; six independent factors can, and the next proposal honours both at once.",
    },
    {
      id: "c11-l2",
      title: "Position Size — exact mechanics",
      paragraphs: [
        "In Basic mode Position Size is a three-step LOW, MEDIUM, HIGH choice. LOW reproduces the app's current conservative behaviour exactly and is the backward-compatible default. Under the hood Basic scales the per-order size cap as a multiple of the configured cap: LOW is times one, MEDIUM is times three, and HIGH is times six. MEDIUM and HIGH only ever scale risk up relative to LOW; there is no way to make Basic mode size smaller than the conservative baseline.",
        "Turning on the Expert Mode toggle, labelled configure exact numeric thresholds, replaces the three steps with a single precise control: Max position size as a percent of available balance. The range is 1 to 100 percent. The factory presets are LOW 5, MEDIUM 15, and HIGH 30, but in Expert mode you type any integer in the range. The semantics are percent of available balance, not a fixed token amount, so the absolute order size automatically tracks your wallet as it grows or shrinks. A 10 percent setting on a 400 XLM balance authorises roughly a 40 XLM order; the same 10 percent on an 800 XLM balance authorises roughly 80.",
        "The panel renders a live preview so you never have to do that arithmetic in your head. It reads your current available balance and shows a line of the form: at X XLM available, max order is approximately Y XLM. As you drag or type the percent the preview recomputes instantly, which makes it obvious when a seemingly modest percent translates into an uncomfortably large absolute position on a large balance.",
        "Position Size does not act alone. There is a separate AI per-trade cap that the orchestrator also enforces. If the percent you choose would authorise an order larger than that per-trade cap, the panel surfaces a warning so you understand the effective size will be clamped down to the cap rather than your percent. In other words the smaller of the two limits wins, and the warning exists so the clamp is never a silent surprise. Read the preview together with the warning: the preview tells you what your percent asks for, the warning tells you when the AI cap will overrule it.",
      ],
      example: "You set Expert Position Size to 25 percent with 600 XLM available. The live preview reads approximately 150 XLM. If the AI per-trade cap is 100 XLM, the panel warns that your percent exceeds the cap, and the actual maximum order is clamped to 100 XLM, not 150.",
    },
    {
      id: "c11-l3",
      title: "Stop Loss Distance and Drawdown Tolerance — exact mechanics",
      paragraphs: [
        "Stop Loss Distance defines how far below entry the protective exit sits. In Basic mode the default stop distance widens with the level: MEDIUM and HIGH multiply the configured stop percent by times one, times one-and-a-half, and times two-and-a-half respectively, and at MEDIUM or HIGH the AI is also instructed to prefer a trailing stop rather than a fixed one. In Expert mode you choose the stop directly in one of two ways: a fixed percent from entry, with a range of 0.5 to 20 percent and presets 2, 5, and 10; or a fixed amount from entry expressed in XLM. The fixed-amount option is useful when you reason in absolute terms rather than percentages.",
        "The panel actively warns when your stop distance is very tight, because a stop set inside the normal bid-ask spread will trigger on noise alone. If you place a 0.5 percent stop on a market whose round-trip spread is already near that width, you will be stopped out on the spread before the trade has a chance to work. The warning is there to stop you turning a protective tool into a guaranteed small loss.",
        "Drawdown Tolerance is a portfolio-level circuit breaker rather than a per-trade control. In Basic mode LOW pauses AI trading after a 5 percent drop, MEDIUM after 10 percent, and HIGH never pauses on drawdown. In Expert mode the control reads: pause AI trading if the portfolio drops X percent in 24 hours, with a range of 1 to 50 percent and presets 5, 10, and 25. There is also a Never pause based on drawdown checkbox, which maps exactly to Basic HIGH and disables the breaker entirely.",
        "The crucial behavioural detail is what pause means. When the 24-hour drawdown threshold is breached, only new AI entries are paused. Risk-reducing exits are always still allowed. This is deliberate: a circuit breaker that froze the whole bot could trap you in a losing position precisely when conditions are deteriorating. By halting new exposure while leaving the exit door open, the breaker stems fresh risk without preventing the bot from getting you out of trades you are already in.",
      ],
      example: "You set an Expert fixed-percent stop of 0.6 percent on a market whose spread is around 0.5 percent. The panel warns the stop is very tight. Separately, with Drawdown Tolerance at 10 percent, an early loss takes the 24-hour portfolio change to minus 11 percent: new entries pause, but a proposal to close an existing losing position still executes.",
    },
    {
      id: "c11-l4",
      title: "Trade Frequency and Asset Volatility Tolerance — exact mechanics",
      paragraphs: [
        "Trade Frequency is implemented as a confidence gate, because the cleanest way to make the bot trade more or less often is to change how sure it must be before it acts. The AI scores every proposal from 0 to 100. In Basic mode LOW and MEDIUM require medium-or-better confidence to auto-submit, HIGH additionally allows low-confidence proposals through, and the cooldown between entries also shortens at higher frequency. In Expert mode the control is explicit: minimum AI confidence score to trade, a number from 50 to 99 with presets 85, 70, and 55. Note the inversion that trips people up: a lower threshold means a higher trade frequency, because more proposals clear the bar.",
        "Only proposals at or above the threshold auto-execute. Anything below it is not discarded; it is held for manual review, and the reason is written to the log in an explicit, attributable form such as: proposal skipped, confidence 68 less than threshold 70. That two-point miss is recoverable information. If you see a run of near-miss skips clustered just below your threshold you have direct evidence that nudging the threshold down a few points would have admitted real trades, and the log lets you make that call on data rather than feel.",
        "Asset Volatility Tolerance filters which markets the chain scan will even consider, before any proposal exists. In Basic mode MEDIUM and HIGH relax the 24-hour volume and entry-spread liquidity gates so thinner markets become eligible. In Expert mode the control is a hard ceiling: maximum accepted 24-hour price swing percent, ranging 1 to 50 with presets 5, 15, and 30. Any token whose absolute 24-hour price change exceeds the ceiling is skipped by the scan and named in the excluded-markets log, so you can see exactly which candidates were filtered and why.",
        "These two factors operate at different stages and compose cleanly. Asset Volatility Tolerance is an upstream gate on the universe of tradeable markets; Trade Frequency is a downstream gate on the confidence of proposals within whatever markets survived. A low volatility ceiling can starve a high-frequency confidence setting of candidates, because there is simply less to score. When the bot is quieter than you expect, check the excluded-markets log first to see whether the volatility ceiling, not the confidence threshold, is the binding constraint.",
      ],
      example: "You set Expert Trade Frequency to a minimum confidence of 70 and Asset Volatility Tolerance to 5 percent. A token swinging 8 percent in 24 hours never reaches the scoring stage and appears in the excluded-markets log. A different proposal does get scored at 68 and is held, logged as proposal skipped, confidence 68 less than threshold 70.",
    },
    {
      id: "c11-l5",
      title: "Slippage Tolerance and combining factors — advanced strategy",
      paragraphs: [
        "Slippage Tolerance is the last gate before execution and protects fill quality. In Expert mode the control is maximum accepted slippage percent, ranging 0.1 to 10 with presets 0.5, 1.5, and 3. A proposal whose expected slippage exceeds the ceiling is blocked outright. This is the factor that most directly defends the spread-capture thesis: if your edge is only a few basis points, a fill that gives up more than that in slippage converts a winning setup into a losing one. Set this too loose on thin books and you pay away the very edge the strategy is trying to harvest; set it too tight and good proposals on liquid pairs will still occasionally be blocked by a momentary widening.",
        "All six factors share two governing concepts. First, presets: Conservative means small trades, tight stops, high-confidence only; Balanced means moderate exposure across all factors; Aggressive means larger trades, wider stops, trades more often. Selecting a preset loads a coherent set of numbers across every factor at once, and any factor you then edit by hand flips the loader to Custom. Second, a HIGH-warning banner appears whenever any single value is more aggressive than the Aggressive preset, so pushing one dial past the most aggressive bundled profile is always visible rather than silent.",
        "The point of independence is deliberate combination, and the combinations interact in ways worth reasoning through. To trade often but small and safe, set Trade Frequency aggressive with a low minimum-confidence threshold, Position Size low at a small percent of balance, and Stop Loss Distance tight. To hunt a few high-conviction moves, do the inverse: a high confidence threshold, a larger position percent, and a wider stop so the larger position is not shaken out by noise. Remember the stages compose: the volatility ceiling decides the universe, the confidence threshold decides which proposals survive, position size and slippage decide the final order, and drawdown tolerance can pause new entries over the top of all of it.",
        "Finally, the whole system is backward compatible. With the Expert Mode toggle off, every factor behaves exactly as the Basic LOW, MEDIUM, HIGH levels did before, and LOW remains the conservative baseline that reproduces the app's original behaviour. Expert mode is purely additive precision: it lets you name exact thresholds, see live previews and warnings, and have the full numeric snapshot logged with each proposal, without changing the safe defaults you fall back to when the toggle is off. Change one factor at a time and read the logs so you can attribute every behavioural shift to the dial you moved.",
      ],
      example: "You want frequent, small, tightly-stopped trades. You set Trade Frequency to a minimum confidence of 55, Position Size to 5 percent of balance, Stop Loss Distance to 2 percent, and leave Slippage Tolerance at 0.5 percent. The bot proposes often, sizes each order modestly, exits quickly when wrong, and blocks any fill that would give up more than half a percent.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "Why are there six independent risk factors instead of one global risk slider?",
      options: [
        { text: "A single risk level is too blunt; independent factors let you mix settings, such as tight stops with high trade frequency, that a global slider would force to move together.", explanation: "Correct. Risk appetite is not one-dimensional, so splitting the factors lets one axis be conservative while another is aggressive, expressing your actual thesis." },
        { text: "Six dials are required only because the AI cannot read a single number from the prompt.", explanation: "Incorrect. The AI receives every numeric value in the prompt regardless of count; the separation is about expressiveness, not a prompt limitation." },
        { text: "Each factor controls a completely unrelated app, and they only happen to share one panel.", explanation: "Incorrect. All six govern the same trade lifecycle for this bot; they are separate dials on one system, not separate apps." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "In Expert mode, what does the Position Size factor actually control, and how does it interact with the AI per-trade cap?",
      options: [
        { text: "It sets a fixed token amount per order that always overrides the AI per-trade cap.", explanation: "Incorrect. Expert Position Size is a percent of balance, not a fixed amount, and it does not override the cap; the smaller limit wins." },
        { text: "It sets the maximum confidence score, and the cap is ignored.", explanation: "Incorrect. Confidence is the Trade Frequency factor; Position Size governs order size as a percent of available balance." },
        { text: "It sets max position size as a percent of available balance; if that percent would exceed the AI per-trade cap, the panel warns and the order is clamped to the cap.", explanation: "Correct. The percent tracks your balance via the live preview, and the smaller of the percent-derived size and the per-trade cap is what actually executes." },
        { text: "It only changes the colour of the order button and has no effect on size.", explanation: "Incorrect. It directly determines the authorised order size as a percent of balance, shown in the live preview." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q3",
      prompt: "You set Trade Frequency in Expert mode to a minimum confidence of 70. The AI scores a proposal at 68. What happens?",
      options: [
        { text: "The proposal auto-executes because 68 is close enough to 70.", explanation: "Incorrect. The threshold is a hard gate; only proposals at or above 70 auto-execute, and 68 is below it." },
        { text: "The proposal is permanently deleted and never recorded.", explanation: "Incorrect. Sub-threshold proposals are held for manual review and the reason is explicitly logged, not deleted." },
        { text: "The proposal is held for manual review and the log records something like proposal skipped, confidence 68 less than threshold 70.", explanation: "Correct. Below-threshold proposals are held, not discarded, and the attributable skip line lets you see near-misses clustered just under your threshold." },
        { text: "The whole bot pauses for 24 hours.", explanation: "Incorrect. That is the Drawdown Tolerance circuit breaker, not the confidence gate; a single sub-threshold proposal only causes that one proposal to be held." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q4",
      prompt: "You want the AI to trade often but with small positions and tight stop losses. Which Expert settings fit?",
      options: [
        { text: "High Trade Frequency via a low minimum-confidence threshold, a low Position Size percent, and a small Stop Loss Distance.", explanation: "Correct. A low confidence threshold admits more proposals (higher frequency), a low percent keeps each order small, and a tight stop limits loss per trade." },
        { text: "A high minimum-confidence threshold, a high Position Size percent, and a wide Stop Loss Distance.", explanation: "Incorrect. That is the high-conviction profile: fewer, larger, wider-stopped trades, the opposite of often, small, and tight." },
        { text: "Never pause on drawdown, maximum slippage, and a large fixed-amount stop.", explanation: "Incorrect. None of these control trade frequency or keep positions small; they address drawdown, fill quality, and stop placement in the wrong direction." },
        { text: "A low Asset Volatility ceiling only, leaving every other factor at default.", explanation: "Incorrect. A low volatility ceiling shrinks the candidate universe rather than increasing frequency, and it does nothing to make positions small or stops tight." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "How does the Drawdown Tolerance breaker behave once the 24-hour threshold is breached, and how does the never-pause option relate to Basic mode?",
      options: [
        { text: "It freezes the entire bot, blocking both new entries and exits until the next day.", explanation: "Incorrect. Exits are never blocked; freezing everything could trap you in a losing position, which the design specifically avoids." },
        { text: "It pauses only new AI entries while risk-reducing exits are always still allowed, and the Never pause based on drawdown checkbox maps to Basic HIGH.", explanation: "Correct. The breaker stems fresh exposure without preventing exits, and ticking never-pause is equivalent to the Basic HIGH level that disables the breaker." },
        { text: "It doubles position size to recover the drawdown faster.", explanation: "Incorrect. That is martingale behaviour; the breaker reduces new risk rather than increasing it." },
        { text: "It loosens the slippage ceiling so more trades fill.", explanation: "Incorrect. Drawdown Tolerance pauses new entries; it does not touch Slippage Tolerance, which is a separate factor." },
      ],
      correctIndex: 1,
    },
  ],
};

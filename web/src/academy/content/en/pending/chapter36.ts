// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// EXPERT chapter on AI in Trading: how models are trained, overfitting, ethical
// and systemic risks, how Atrium's transparent human-in-the-loop AI differs from
// a black-box algo, and when to switch the AI off. Same shape as the gold-standard
// content/en/pending/chapter22.ts, with the per-chapter `whoFor` one-liner typed
// via a local intersection so the live Chapter interface stays untouched until
// integration. This chapter owns no new glossary terms.
import type { Chapter } from "../../../types";

export const chapter36: Chapter & { whoFor: string } = {
  id: "c36",
  number: 36,
  level: "EXPERT",
  whoFor: "For traders who want to trust — and doubt — an AI wisely",
  title: "AI in Trading — Opportunities and Dangers",
  description:
    "How trading models are trained, where overfitting and look-ahead bias creep in, the ethical and systemic risks of automated trading, how Atrium's transparent AI differs, and when to switch it off.",
  lessons: [
    {
      id: "c36-l1",
      title: "How are AI trading models trained?",
      paragraphs: [
        "A trading model is fitted to historical data. You choose features (the inputs the model reads) and a label (what it is trying to predict). Features might be recent returns, order-book depth pulled from Horizon, trade-aggregation volume, volatility, or a trustline count as a proxy for adoption. The label is usually a forward outcome: will the mid-price be higher in an hour, or will a target be hit before a stop. The model learns whatever statistical mapping from features to label minimises its error on that past data.",
        "The quiet assumption is that tomorrow rhymes with yesterday. That holds only while the market regime is stable. When the regime changes — liquidity dries up on a thin XLM/USDC book, a stablecoin depegs, spreads widen, or a new AMM pool reroutes flow — the relationships the model memorised stop paying out. This is regime change, and no amount of training on the old regime prepares a model for it.",
        "Two failure modes dominate in practice. Garbage-in: if the training data is wrong — bad timestamps, survivorship bias from delisted tokens, prices from a moment of zero liquidity — the model faithfully learns the garbage. Look-ahead bias is subtler and more dangerous: information leaks backward in time. If a feature at bar T is computed using data that was only knowable at T+1 (a closing price used to 'predict' that same close, a label smoothed across the future, a fill assumed at a price no one could have transacted at), the backtest looks brilliant because the model is quietly cheating. Live, that future data does not exist, and the edge evaporates.",
        "Guarding against this means strict temporal discipline: every feature must be computable using only information available before the decision point, splits must be chronological (never shuffle time-series rows), and costs must be modelled at the price you could actually have traded, not the mid. A model trained without that discipline is not measuring skill — it is measuring its own ability to peek.",
      ],
      example:
        "Suppose you label each hourly bar 1 if the next hour's return is positive and feed the model a feature called 'volatility of this bar', but you accidentally compute that volatility from the high and low of the bar you are trying to predict. The high and low are only known once the hour is over. The model learns a near-perfect rule, the backtest equity curve soars, and live it fails instantly — the volatility number it needs simply is not available yet at the moment it must decide. That is look-ahead bias hiding inside an innocent-looking feature.",
    },
    {
      id: "c36-l2",
      title: "What is overfitting and why does a backtested strategy sometimes fail in live trading?",
      paragraphs: [
        "Overfitting is when a model learns the noise in its training data instead of the signal. Every price series is part real structure and part randomness. A model with enough parameters, or a strategy tuned across enough knobs, can fit the random wiggles of one particular history perfectly. It then produces a gorgeous backtest — smooth equity curve, high Sharpe, tiny drawdown — that describes the past exquisitely and predicts the future not at all.",
        "The tell is the gap between in-sample and out-of-sample performance. In-sample (the data you fitted on) always looks good; that is what fitting does. What matters is out-of-sample: fresh data the model never saw, ideally a later time window. If the edge survives out-of-sample and across a walk-forward test — repeatedly training on the past and validating on the next untouched slice — it might be real. If it only exists in-sample, you curve-fitted noise. Beware the multiple-comparisons trap too: try two hundred parameter combinations and a few will look wonderful by pure chance, exactly like flipping enough coins until one lands heads ten times.",
        "Even a genuine edge can die on contact with reality because of costs. Every fill pays something: the bid-ask spread, slippage when your order moves the book, the 0.30% AMM pool fee on Stellar, plus the tiny XLM network fee. A backtest run at the mid-price ignores all of this. A strategy that nets a few basis points per trade in a frictionless backtest can be flatly negative once realistic spread and slippage are deducted — the edge was smaller than the cost of harvesting it. Worse, cost scales with frequency: a high-turnover strategy pays the spread again and again, so the very models that look most active in a backtest are often the ones most fragile to real friction.",
        "This is not an abstract warning for Atrium specifically. Its own research harness found that a measured XLM/USDC edge was significant only at very low costs and disappeared entirely once realistic fees were charged — a spread-capture game, not a durable advantage. The honest workflow is therefore to demand out-of-sample survival first, then re-run with pessimistic cost assumptions, and only believe an edge that clears both bars. None of this is a promise of profit or investment advice; it is a discipline for not fooling yourself.",
      ],
      example:
        "A classic case: a strategy is optimised across a grid of moving-average lengths on one year of XLM/USDC data and the 9/21 crossover shows a stunning 4x return with almost no drawdown. Roll it forward onto the next six months it never saw and it bleeds steadily. The 9/21 pair did not capture a real market rhythm — it happened to line up with a handful of lucky swings in that specific year. Add the spread and 30bps AMM fee it would really have paid on each turn and even the in-sample result turns negative. The backtest was measuring luck plus zero costs, not a repeatable edge.",
    },
    {
      id: "c36-l3",
      title: "What are the ethical risks of AI trading?",
      paragraphs: [
        "Automation scales intent — including bad intent — far beyond what a human could do by hand. Manipulation tactics that are illegal in regulated markets become trivially fast when a bot runs them: spoofing (posting large orders you never intend to fill, to fake demand, then cancelling), layering, or wash trading (trading with yourself to inflate apparent volume and lure real buyers). An AI that discovers such a tactic is profitable in a backtest will happily repeat it thousands of times unless a human forbids it. Doing this is not just unethical; in many jurisdictions it is market abuse, and none of this is legal advice — the point is that automating a scheme does not launder its legality.",
        "Speed introduces its own hazard. When many automated participants react to the same signal in milliseconds, a small shock can cascade into a flash crash — a violent, self-reinforcing drop and rebound driven by algorithms hitting each other's stops and pulling liquidity all at once. No single actor intends the crash; it emerges from the interaction. The 2010 equity flash crash is the canonical example, but the same dynamic can appear on any venue with automated flow, including thin on-chain order books.",
        "The deepest risk is systemic and comes from sameness. If thousands of models are trained on similar data with similar objectives, they converge on similar positions and act alike. That correlation is invisible in calm markets and lethal in stress: everyone is long the same crowded trade, everyone's risk model says 'reduce' at the same threshold, and everyone sells into the same vanishing bid at once. Diversity of strategy is a public good for market stability; monoculture is fragile. As an individual trader you cannot fix the system, but you can recognise that 'the AI says buy' is far less comforting if every other AI is saying it too — and you can size positions so that a crowded unwind does not ruin you.",
      ],
      example:
        "Picture a thin XLM/USDC book where fifty bots share a rule: 'if price drops 3% in a minute, cut the position.' A modest sell nudges price down 3%. All fifty fire at once, each sell driving price lower, tripping the same rule again for the next bot. In seconds the price gaps far below fair value on almost no real news — a flash crash born purely from correlated automation. The bots that paused, or whose rule was slightly different, are the ones that survived to buy the dip.",
    },
    {
      id: "c36-l4",
      title: "How does the AI in this app differ from a general trading algorithm?",
      paragraphs: [
        "A general trading algorithm is typically a black box that trades autonomously: signal in, order out, no explanation, and often no human in the loop. Atrium is built on the opposite principle — transparency and human-in-the-loop control. The AI is an analyst, not an autopilot. It proposes; you dispose.",
        "Concretely, every idea arrives as a proposal carrying a confidence score from 0 to 100, and the backend only auto-executes a proposal at or above the threshold you set. Below your threshold, nothing happens without you. This propose-then-approve loop is wrapped in hard limits the AI cannot override: a trading cap and a drawdown pause gate that halts activity when losses breach a set level. The AI can want to trade; it cannot exceed the guardrails you configured.",
        "You also shape its behaviour through six independent risk factors, each set to LOW, MED, or HIGH: Position Size, Stop-Loss Distance, Drawdown Tolerance, Trade Frequency, Asset Volatility Tolerance, and Slippage Tolerance. These are not cosmetic — they thread into the effective limits the policy engine enforces and into the prompt the analyst reasons with, so a conservative profile genuinely produces smaller, rarer, tighter-stopped trades. Everything the AI decides is logged: the AI Log sub-tab in the Logs tab records each proposal with filters, CSV export, and pagination, so you can audit why it acted rather than trusting a silent black box.",
        "This chapter deliberately stays at the level of principle. The mechanics live elsewhere in the Academy: the 'AI Trading Deep Dive' chapter walks through how the analyst forms and scores a proposal end to end, and the 'AI Risk Settings: Full Control' chapter covers each of the six factors and exactly how they bound the AI's behaviour. If you want the how, go there; here we only need the why — a transparent, bounded, human-approved design is what lets you both trust and doubt the AI on purpose.",
      ],
      example:
        "Say the analyst proposes buying XLM with a confidence of 62 while your auto-execute threshold is 75. In a black-box algo that trade would simply fire. In Atrium nothing executes — the proposal waits for your approval, and even if you approve it, the drawdown pause gate and trading cap still apply. The proposal, its score, and your decision all land in the AI Log, so a week later you can filter for it, export the row, and see exactly why the trade was suggested and what you chose to do.",
    },
    {
      id: "c36-l5",
      title: "When should you turn the AI off?",
      paragraphs: [
        "The single rule behind all the specific signals is this: turn the AI off when conditions fall outside the range the model was trained on. A model is only reliable inside the distribution of data it learned from. Push it into territory it has never seen and its confidence score becomes meaningless — it can be supremely confident and completely wrong, because it is extrapolating rather than recognising.",
        "Extreme volatility is the first flag. When a token's price is swinging far beyond its historical range, the statistical relationships the model learned no longer describe what is happening. Illiquidity is the second: on a thin book or a shallow AMM pool, the slippage on execution can dwarf any edge, and the model's assumed fill prices become fiction. News shocks are the third — a depeg, an issuer disappearing, an exchange halt, a regulatory headline. These are precisely the events absent from smooth historical training data, and they break correlations instantly. When something genuinely new hits the tape, a human's judgement about context beats a model's pattern-match.",
        "There is also a behavioural early-warning system built into the app itself. If you notice a run of proposals being rejected by the policy engine, or repeatedly failing to execute, or the analyst churning out low-confidence ideas it never used to, treat that as the model telling you it is confused. The AI Log and Trade History sub-tabs make this pattern visible. The practical move is to switch to manual: drop below the auto-execute threshold or disable auto-execute entirely, size down, and use the Manual Trading tab with a sensible slippage tolerance until conditions return to something the model has actually seen before. Turning the AI off is not a failure of the tool — it is using it wisely, and it is the same discipline as widening your own stops when you are uncertain.",
      ],
      example:
        "A stablecoin you hold starts to wobble off its peg overnight and USDC-quoted prices go haywire; the order book thins out as market makers step back. Your AI keeps firing proposals, several get rejected by the drawdown gate, and the ones that pass are low-confidence. That combination — a news-driven regime break, collapsing liquidity, and a cluster of rejected or failing proposals in the AI Log — is the textbook moment to disable auto-execute, size down, and trade by hand until the depeg resolves and the market is legible again.",
    },
  ],
  quiz: [
    {
      id: "c36-q1",
      prompt: "A feature at time T in your model is computed using the closing price of the bar at time T, which is only known once that bar has finished. The backtest looks spectacular but live results collapse. What happened?",
      options: [
        {
          text: "Look-ahead bias: the feature used information that was not yet available at the decision point, so the model was effectively peeking at the future.",
          explanation:
            "Correct. Using data knowable only at or after T to make the decision at T lets the model 'cheat' in the backtest. Live, that future data does not exist yet, so the apparent edge vanishes on contact with reality.",
        },
        {
          text: "Regime change: the market simply behaved differently in the live period.",
          explanation:
            "Regime change is real, but it is not what this describes. The problem here is structural — a feature that peeks at future data — and it would inflate the backtest even on the same period. Live failure is instant, not a gradual regime drift.",
        },
        {
          text: "Overfitting: the model memorised noise across too many parameters.",
          explanation:
            "Overfitting is a distinct failure. Here the issue is temporal leakage in a single feature, not an over-flexible model fitting randomness. Even a simple model would look great with this leak and fail live.",
        },
        {
          text: "Garbage-in: the training prices were wrong or corrupted.",
          explanation:
            "The prices may be perfectly clean. The defect is that a correct price is being used at a point in time when it could not yet have been known — a timing leak, not bad data.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c36-q2",
      prompt: "You have a strategy with a beautiful backtest equity curve. Which single check best distinguishes a real edge from curve-fitting?",
      options: [
        {
          text: "Confirm the backtest used the mid-price so results are clean of noise.",
          explanation:
            "Backwards. Using the mid-price hides real costs like spread, slippage, and the 0.30% AMM fee, which flatters results. You want costs modelled at the price you could actually trade, not stripped out.",
        },
        {
          text: "Check that in-sample performance is as high as possible.",
          explanation:
            "In-sample performance is always high — that is what fitting does. A great in-sample result tells you nothing about whether the edge is real; it is the least informative check.",
        },
        {
          text: "Test it out-of-sample on later data the model never saw, ideally with a walk-forward procedure.",
          explanation:
            "Correct. An edge that survives on fresh, chronologically later data it never trained on — repeatedly, via walk-forward — is far more likely to be real. If it exists only in-sample, you fitted noise.",
        },
        {
          text: "Try many more parameter combinations and keep the best-looking one.",
          explanation:
            "This makes overfitting worse. Testing hundreds of combinations guarantees some look wonderful by pure chance — the multiple-comparisons trap — not that any of them is a genuine edge.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c36-q3",
      prompt: "Fifty bots on a thin XLM/USDC book share the rule 'cut the position if price drops 3% in a minute.' A modest sell tips price down 3% and the price gaps far below fair value in seconds. What does this illustrate?",
      options: [
        {
          text: "A single manipulator spoofing the order book.",
          explanation:
            "No one here is placing fake orders. The cascade emerges from many honest bots reacting to the same real trigger at once — an emergent effect, not a single actor's manipulation.",
        },
        {
          text: "A flash crash driven by correlated automation and systemic sameness.",
          explanation:
            "Correct. When many models act alike, one small shock trips them all simultaneously, each sale driving the next, pulling liquidity and gapping the price. No one intends the crash; it emerges from correlated behaviour on a thin book.",
        },
        {
          text: "Loss aversion causing humans to panic-sell at the bottom.",
          explanation:
            "This is about automated rules firing in milliseconds, not a human emotional response. Loss aversion is a psychology concept; the mechanism here is correlated algorithmic execution.",
        },
        {
          text: "Look-ahead bias in the bots' training data.",
          explanation:
            "Look-ahead bias is a backtesting flaw about future data leaking into features. It has nothing to do with live bots synchronously hitting the same stop rule and cascading the price.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q4",
      prompt: "The analyst proposes buying XLM with a confidence score of 62, but your auto-execute threshold is 75. In Atrium, what happens?",
      options: [
        {
          text: "The trade fires automatically, because the AI generated a proposal.",
          explanation:
            "That is how a black-box autopilot behaves, not Atrium. A proposal below your threshold does not auto-execute — the human-in-the-loop design means nothing happens without your approval.",
        },
        {
          text: "Nothing auto-executes; the proposal waits for you, and even on approval the drawdown gate and trading cap still apply.",
          explanation:
            "Correct. The backend only auto-executes at or above your threshold. Below it, the proposal is just advice you can approve or ignore, and the hard caps and drawdown pause gate remain in force regardless.",
        },
        {
          text: "The AI raises its own confidence to 75 so the trade can proceed.",
          explanation:
            "The AI cannot rewrite its score to clear your threshold. The threshold is a guardrail you control; the whole point of the design is that the AI cannot override the limits you set.",
        },
        {
          text: "The six risk factors are ignored because confidence is below threshold.",
          explanation:
            "The risk factors are not bypassed — they continuously shape the effective limits and the analyst's reasoning. A sub-threshold score simply means no auto-execution, not that the guardrails switch off.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q5",
      prompt: "A stablecoin you trade starts to depeg overnight, the order book thins out, and your AI Log shows a cluster of rejected and low-confidence proposals. What is the wise move?",
      options: [
        {
          text: "Raise your auto-execute threshold slightly and let the AI keep trading through it.",
          explanation:
            "A tweak to the threshold does not fix the core problem: conditions are outside the model's trained range. The confidence scores are unreliable in this regime, so leaning on them — even at a higher bar — is misplaced trust.",
        },
        {
          text: "Trust the highest-confidence proposal, since confidence is highest exactly when the model is most sure.",
          explanation:
            "A confidence score is only meaningful inside the data distribution the model learned from. During a depeg the model is extrapolating into unseen territory, where it can be confidently wrong. High confidence here is not reassurance.",
        },
        {
          text: "Disable auto-execute, size down, and trade manually until the depeg resolves and the market is legible again.",
          explanation:
            "Correct. A news-driven regime break plus collapsing liquidity plus a run of rejected or failing proposals is the textbook signal that conditions are outside the model's range. Switching to manual and sizing down is using the tool wisely, not abandoning it.",
        },
        {
          text: "Do nothing different — the drawdown gate will handle everything on its own.",
          explanation:
            "The drawdown gate is a backstop that limits losses, not a substitute for judgement. It fires after damage accumulates; recognising the regime break early and going manual prevents the losses the gate would otherwise have to absorb.",
        },
      ],
      correctIndex: 2,
    },
  ],
};

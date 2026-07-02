// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on core technical-analysis indicators: moving averages, RSI,
// MACD, Bollinger Bands, and how to combine a small confluent set without
// drowning in conflicting signals. Authored to the exact same shape as
// content/en/chapter22.ts, with the per-chapter `whoFor` one-liner typed via a
// local intersection so the live Chapter interface stays untouched. This chapter
// owns no new glossary terms; it only reuses terms taught in earlier chapters.
import type { Chapter } from "../../types";

export const chapter27: Chapter & { whoFor: string } = {
  id: "c27",
  number: 27,
  level: "ADVANCED",
  whoFor: "For traders ready to read the indicators behind the price",
  title: "Technical Analysis — Core Indicators",
  description:
    "Moving averages, RSI, MACD, and Bollinger Bands — what each one measures, and how to combine a small set of them without drowning in conflicting signals.",
  lessons: [
    {
      id: "c27-l1",
      title: "What is a moving average (MA) and how do you use it?",
      paragraphs: [
        "A moving average smooths a jagged price into a single line by averaging the last N closing prices as time moves forward. It does not predict anything; it summarises what price has already done, filtering out the noise so a trend is easier to see. Traders watch whether price sits above or below the line, and whether the line itself is sloping up or down.",
        "The two common types differ in how they weight the data. A simple moving average (SMA) treats every price in the window equally. An exponential moving average (EMA) weights recent prices more heavily, so it turns faster when price changes but also whipsaws more. Neither is \"better\": the SMA is steadier, the EMA is more responsive, and the choice depends on how quickly you want to react.",
        "A worked contrast makes this concrete. Take five daily closes for XLM in USDC: 0.100, 0.104, 0.108, 0.112, 0.126. The 5-period SMA is their plain average, 0.110. A 5-period EMA leans on the latest 0.126 far more, landing near 0.116 — noticeably higher because the recent jump dominates. If price then falls, the EMA drops back sooner than the SMA.",
        "In Atrium you would watch these trends on the token detail page, where the price graph offers hour, day, week, and year tabs with candlesticks and volume. A longer tab (week or year) with a slower SMA shows the underlying trend; a shorter tab (hour or day) with an EMA reacts to intraday moves. This is chart reading only — Atrium does not draw indicators or place orders for you.",
      ],
      example:
        "Two people describe a hilly road. The SMA walker averages the last five signposts and calls the road \"gently rising\". The EMA walker leans hardest on the newest sign, which just read \"steep climb\", and calls it \"climbing fast\". Both are right about the same data; the EMA simply reacts to the freshest information sooner, at the cost of over-reacting to a single bump.",
    },
    {
      id: "c27-l2",
      title: "What is RSI (Relative Strength Index)?",
      paragraphs: [
        "RSI is a momentum oscillator that measures the speed of recent price changes on a fixed 0-to-100 scale. It compares the average size of up-moves to the average size of down-moves over a lookback window, classically 14 periods. A high reading means buyers have been dominating strongly; a low reading means sellers have. Because it is bounded, RSI is easy to read at a glance.",
        "The conventional signals are the 70 and 30 levels. Above 70 the asset is called overbought — it has risen fast and may be due for a pause or pullback. Below 30 it is called oversold — it has fallen fast and may be due for a bounce. Some traders also watch the 50 midline as a rough trend divider, and look for divergence, where price makes a new high but RSI does not, hinting the move is losing power.",
        "The critical caveat is that overbought does not mean \"sell now\", and oversold does not mean \"buy now\". In a strong trend, RSI can pin above 70 for days or weeks while price keeps climbing, and shorting every 70 print would bleed you dry. RSI is at its most reliable in a ranging, sideways market; in a powerful trend it stays stretched and its extremes mislead. Treat it as a description of momentum, not a standalone trigger.",
        "On Atrium's token detail page you might switch to the day tab, read the candlesticks, and note that a token spiking on heavy volume is likely to show a high RSI — useful context, but not on its own a reason to act against the trend.",
      ],
      example:
        "During a fast XLM rally, RSI on the day chart hits 78. A trader who reflexively sells short \"because it is overbought\" is stopped out as price grinds higher for another week with RSI still parked near 80. The same 78 reading during a flat, rangebound week — where price keeps stalling and slipping back — would have been a far more trustworthy signal that the push was overextended.",
    },
    {
      id: "c27-l3",
      title: "What is MACD and what does it tell you about momentum?",
      paragraphs: [
        "MACD (Moving Average Convergence Divergence) turns two moving averages into a momentum reading. The MACD line is the difference between a fast EMA and a slow EMA, classically the 12-period minus the 26-period. When the fast average pulls away above the slow one, momentum is building to the upside; when it sinks below, momentum is turning down. The MACD line crossing zero marks where the two averages actually cross.",
        "A second line, the signal line, is a 9-period EMA of the MACD line itself — a smoothed version of it. The headline event is the crossover: when the MACD line crosses up through the signal line it is read as strengthening upward momentum, and a cross down as weakening. These signals lag, because they are built from averages of past prices, so they confirm a shift rather than call it early.",
        "The histogram is the third piece: bars showing the gap between the MACD line and the signal line. Growing bars mean the two lines are separating and momentum is accelerating; shrinking bars mean they are converging and momentum is fading, which often precedes the crossover itself. Reading the histogram is a way to see a turn coming a beat before the lines actually cross.",
        "Like every indicator here, MACD describes momentum in prices Atrium plots on the token detail graph; it never places a trade. Any resulting decision still runs through the app's normal tools and, in Bot Trading, the AI analyst's confidence threshold and risk factors.",
      ],
      example:
        "USDC-quoted XLM has been sliding, and the MACD histogram bars below zero start shrinking day by day even before price turns — the down-momentum is fading. A few days later the MACD line crosses up through its signal line, confirming the shift the histogram already hinted at. A trader who watched the histogram had advance warning; one who waited for the crossover got a later but more confirmed signal.",
    },
    {
      id: "c27-l4",
      title: "What are Bollinger Bands?",
      paragraphs: [
        "Bollinger Bands wrap a moving average in two volatility bands. The middle line is typically a 20-period SMA. The upper and lower bands sit a set number of standard deviations away from it — usually two. Because standard deviation grows when price swings widely and shrinks when it settles, the bands automatically widen in volatile stretches and pinch together in calm ones. They are a picture of how stretched and how volatile price currently is.",
        "Two features get the most attention. A squeeze is when the bands narrow sharply, signalling unusually low volatility — a coiled spring. It tells you a bigger move is statistically more likely soon, but crucially it does not tell you the direction. A touch of the upper or lower band means price is far from its recent average; in a range that often precedes a snap back toward the middle, but in a strong trend price can \"walk the band\", hugging it as it keeps going.",
        "The honest limits matter. Bollinger Bands do not predict where price is headed. A squeeze forecasts that volatility should expand, not whether the breakout runs up or down. A band touch is not an automatic reversal signal. They describe volatility and distance-from-average — genuinely useful context, but only that. Pairing a band touch with an RSI reading or a MACD turn gives you far more than the bands alone.",
        "You would read all of this off Atrium's candlestick chart on the token detail page, choosing a timeframe tab that matches your horizon — a week tab for a swing view, an hour tab for intraday volatility.",
      ],
      example:
        "On the XLM/USDC week chart the Bollinger Bands pinch into a tight squeeze after a quiet fortnight — volatility has drained out. Days later price breaks sharply out of the range and the bands flare wide open. The squeeze correctly warned that a big move was coming; it never said which way, so a trader who bet a direction purely on the squeeze was guessing.",
    },
    {
      id: "c27-l5",
      title: "How to combine indicators without confusing yourself",
      paragraphs: [
        "The most common beginner mistake is indicator overload: stacking a dozen tools on one chart until they contradict each other, then freezing. RSI says oversold, MACD says down-momentum, the bands say squeeze — and you have no idea what to do. Adding more indicators does not add more certainty. Most of them are built from the same price and volume data, so a screen full of them mostly repeats itself while feeling like independent confirmation.",
        "The fix is a small, deliberately confluent set that measures different things. A sensible trio: one trend tool (a moving average), one momentum tool (RSI or MACD), and one volatility tool (Bollinger Bands). Confluence means you act only when they agree — for instance, price above a rising MA (trend up), RSI recovering from oversold (momentum turning), and a band squeeze resolving upward (volatility expanding your way). When they disagree, the honest answer is usually to do nothing.",
        "Decide your set and your rules in advance, in a calm moment, exactly as Chapter 22 on Trading Psychology urges for a trading plan. That keeps you from reaching for a fresh indicator every time you dislike what the current ones say — a form of confirmation-hunting that leads straight back to overload. Fewer tools you understand deeply beat many you read superficially.",
        "In practice you would read this confluence directly off Atrium's token detail chart, switching timeframe tabs and checking candlesticks and volume, then route any decision through the manual form or, in Bot Trading, weigh it against the AI analyst's confidence score. This is educational content, not financial advice — no indicator or combination guarantees an outcome.",
      ],
      example:
        "A trader watching XLM/USDC uses just three tools. Price sits above a rising 50-period MA, RSI has lifted from 32 back through 40, and a Bollinger squeeze has just broken to the upside — three different things (trend, momentum, volatility) all pointing the same way, so the trade has real confluence. A week later only the MA agrees while RSI and the bands are neutral; with the signals split, the disciplined move is to stand aside rather than force it.",
    },
  ],
  quiz: [
    {
      id: "c27-q1",
      prompt: "Given the five closes 0.100, 0.104, 0.108, 0.112, 0.126, how does a 5-period EMA compare to the 5-period SMA of 0.110?",
      options: [
        {
          text: "The EMA is higher than 0.110, because it weights the most recent 0.126 more heavily.",
          explanation:
            "Correct. An EMA leans on recent prices, so the latest jump to 0.126 pulls it above the equal-weighted SMA of 0.110 — which is exactly why an EMA reacts faster to fresh moves.",
        },
        {
          text: "The EMA is lower than 0.110, because it discards the most recent price.",
          explanation:
            "Backwards. An EMA does not discard the newest price; it emphasises it. That recent 0.126 pulls the EMA up, not down.",
        },
        {
          text: "The EMA equals 0.110, because both averages always produce the same number.",
          explanation:
            "No. They agree only when prices are flat. With a rising series the differing weights make the EMA and SMA diverge.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q2",
      prompt: "RSI on the day chart has been pinned above 70 for over a week while price keeps climbing. What does this tell you?",
      options: [
        {
          text: "It is a guaranteed sell signal — price must reverse the moment RSI crosses 70.",
          explanation:
            "This is the classic RSI trap. In a strong trend RSI can stay overbought for a long time, and shorting every 70 print bleeds a trader dry.",
        },
        {
          text: "RSI is broken and should be ignored on this token entirely.",
          explanation:
            "Not so. RSI is working exactly as designed — reflecting sustained strong momentum. The mistake is expecting its extremes to act as reversal triggers in a trend.",
        },
        {
          text: "In a strong trend RSI can stay overbought for a long time; its extremes are far more reliable in ranging markets than in trends.",
          explanation:
            "Correct. Overbought does not mean \"sell now\". RSI's 70/30 extremes are most trustworthy in sideways ranges; in a powerful trend it stays stretched and misleads.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c27-q3",
      prompt: "What does the MACD histogram represent, and why do traders watch it?",
      options: [
        {
          text: "It shows the gap between the MACD line and the signal line; shrinking bars can warn of a fading move before the lines actually cross.",
          explanation:
            "Correct. The histogram is the distance between the two lines. Bars shrinking toward zero mean momentum is converging, which often precedes the crossover itself — an early heads-up.",
        },
        {
          text: "It shows the raw trading volume for each candle.",
          explanation:
            "No. Volume is a separate series (Atrium plots it on the token graph). The MACD histogram is the gap between the MACD line and its signal line.",
        },
        {
          text: "It shows the account balance in USDC over time.",
          explanation:
            "No. The histogram has nothing to do with your balance; it is purely the difference between the MACD line and the signal line.",
        },
        {
          text: "It predicts the exact future price target of the asset.",
          explanation:
            "No indicator predicts an exact price. The histogram describes momentum by measuring the gap between two lines — it forecasts nothing precise.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q4",
      prompt: "A Bollinger Band squeeze appears on the chart. What can you legitimately conclude from it?",
      options: [
        {
          text: "Price is about to rise, because a squeeze is a bullish signal.",
          explanation:
            "A squeeze says nothing about direction. Reading it as bullish is guessing; the breakout could just as easily be down.",
        },
        {
          text: "Volatility is unusually low and a larger move is statistically more likely soon — but the squeeze does not tell you the direction.",
          explanation:
            "Correct. Narrow bands mean low volatility, a coiled spring. It raises the odds of a bigger move but is silent on up versus down — which is why traders pair it with other tools.",
        },
        {
          text: "The token has lost its trustline and can no longer be traded.",
          explanation:
            "Unrelated. A squeeze is a volatility reading on the price chart; trustlines are an account-level opt-in to hold a token and have nothing to do with band width.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c27-q5",
      prompt: "Your chart has ten indicators and three of them now contradict each other. What is the sound response?",
      options: [
        {
          text: "Add three more indicators until a majority agrees.",
          explanation:
            "This is indicator overload. Most indicators are built from the same price data, so piling on more mostly repeats information while feeling like fresh confirmation.",
        },
        {
          text: "Pick whichever indicator currently says what you were hoping to hear.",
          explanation:
            "That is confirmation-hunting — cherry-picking the tool that flatters your bias. It abandons any rule-based process and leads straight back to confusion.",
        },
        {
          text: "Trim to a small confluent set — one trend, one momentum, one volatility tool — and act only when they agree, otherwise stand aside.",
          explanation:
            "Correct. A deliberately small set that measures different things gives real confluence. When they disagree the honest move is usually to do nothing, and the set should be chosen calmly in advance as part of a trading plan.",
        },
      ],
      correctIndex: 2,
    },
  ],
};

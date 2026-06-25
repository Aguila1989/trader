import type { Chapter } from "../../types";

export const chapter08: Chapter = {
  id: "c8",
  number: 8,
  level: "ADVANCED",
  title: "Reading the Market",
  description:
    "Read price charts, candlesticks, timeframes, volume, and liquidity trends the way this app presents them.",
  lessons: [
    {
      id: "c8-l1",
      title: "What is a price chart and how do you read it?",
      paragraphs: [
        "A price chart is a picture of how a tokens price moved over time. Time runs left to right, so the oldest point is on the left and the newest is on the right. Price runs bottom to top, so a line or shape sitting higher means a higher price. Reading a chart is mostly about asking one question: is price generally rising, falling, or going sideways across the part of the chart you are looking at?",
        "In this app the token detail view draws the chart from real Stellar Horizon trade data, grouped into fixed time periods. Each period becomes one candle rather than a single dot, which packs four prices into one shape instead of just one. That lets you see not only where price ended but how much it swung along the way.",
        "Do not over-read tiny wiggles. Step back and look at the overall slope first, then zoom into detail. A chart tells you what already happened, not what will happen next, so treat it as evidence rather than a prediction.",
      ],
      example:
        "On the daily view you see 30 daily candles. The leftmost closes near 0.118, the candles drift up through the middle to about 0.131, then the last few slide back to 0.126. The takeaway is a month that rose then gave part of it back, ending modestly higher than it started.",
    },
    {
      id: "c8-l2",
      title: "What is a candlestick?",
      paragraphs: [
        "A candlestick summarises one time period using four prices: the open, the high, the low, and the close. The thick part, called the body, is drawn between the open and the close. The thin lines above and below, called wicks, reach up to the high and down to the low that traded during that period.",
        "Colour tells you direction at a glance. A green or up candle closed higher than it opened, so the body top is the close. A red or down candle closed lower than it opened, so the body top is the open. Long wicks mean price travelled far from the open or close before settling, which signals indecision or a rejected move.",
        "In this app each candle also carries the base volume traded and the number of trades in that period, so a candle is not just shape but activity. Read the body for net movement and the wicks for the fight that produced it.",
      ],
      example:
        "A single daily candle opens at 0.120, dips to a low of 0.117, spikes to a high of 0.129, and closes at 0.127. It prints green because the close beat the open, with a short lower wick to 0.117 and an upper wick reaching 0.129 above the body top of 0.127.",
    },
    {
      id: "c8-l3",
      title: "How to use the hourly / daily / weekly / yearly graph in this app",
      paragraphs: [
        "The token detail chart has a timeframe toggle with four settings, and each one reframes the same token over a different window. Hourly shows 24 one-hour candles, so it covers roughly the last day in fine detail. Daily shows 30 daily candles, about a month. Weekly shows 52 weekly candles, about a year of weeks. Yearly shows 365 daily candles, roughly a full year day by day.",
        "Pick the timeframe to match the question. For what is happening right now, use hourly. For the shape of the last month, use daily. For the longer arc, use weekly or yearly. A move that looks huge on the hourly chart can be a tiny blip once you switch to weekly, so always sanity-check a short-term signal against a longer one.",
        "Because every candle is built from the same Horizon trade aggregations, the four views are consistent with each other; they just bucket the trades into longer or shorter periods. Switching timeframes never changes the underlying data, only the zoom level you read it at.",
      ],
      example:
        "You spot a sharp drop on the hourly chart that looks alarming across its 24 candles. You switch to weekly, see 52 weekly candles, and notice the same drop is one small red candle inside a year that trended steadily upward. The scare was just normal intraday noise.",
    },
    {
      id: "c8-l4",
      title: "What is a volume indicator?",
      paragraphs: [
        "Volume is how much of a token was actually traded during a period. In this app each candle reports its base volume and trade count, so you can see whether a price move happened on heavy activity or barely any. Volume answers a different question from price: not where it went, but how much conviction was behind it.",
        "The rule of thumb is that volume confirms moves. A price jump on rising volume is more trustworthy because many participants agreed on it. The same jump on thin volume is suspect, since one small order can shove a quiet market around without meaning much.",
        "This matters for the bot directly. It enforces a minimum 24h volume gate and refuses very thin markets, because a chart that looks attractive but barely trades is a trap: you may not be able to enter or exit at the price you see. Always glance at volume before trusting a candle.",
      ],
      example:
        "Two tokens both rose 4 percent today. Token A did it on 90,000 of base volume across 600 trades; Token B did it on 800 of volume across 5 trades. Token A's move is credible and the bot would consider it; Token B's is noise on a market the bot would reject as too thin.",
    },
    {
      id: "c8-l5",
      title: "What is a liquidity trend and why track it?",
      paragraphs: [
        "Liquidity is how easily you can trade a token without moving its price. A single days volume is a snapshot; a liquidity trend is the direction that snapshot is heading over time. The bot runs a liquidity scanner that ranks tokens by their 24h volume and trade count, then watches how each token moves through those rankings.",
        "The scanner reports two trends per token. The rank trend can be improving, declining, or stable, meaning the token is climbing, slipping, or holding its place in the ranking. The volume trend can be growing, shrinking, or stable, describing the raw activity itself. Together they form the liquidity trend.",
        "Track it because liquidity decides whether a strategy is even executable. A token with growing volume and an improving rank is getting easier to trade and safer to size into. One that is shrinking and declining is drying up, so even a good price signal there is risky because you may get stuck holding it.",
      ],
      example:
        "A token sits mid-pack but its scanner card reads volume trend growing and rank trend improving over recent scans, climbing from rank 40 toward rank 25. That improving liquidity trend means an entry today is easier to exit later than the same trade would have been a week ago.",
    },
  ],
  quiz: [
    {
      id: "c8-q1",
      prompt: "On a price chart in this app, what does moving from left to right represent?",
      options: [
        {
          text: "Time passing, from oldest on the left to newest on the right.",
          explanation:
            "Correct. The horizontal axis is time, so the rightmost candle is the most recent period.",
        },
        {
          text: "Price rising, from cheapest on the left to most expensive on the right.",
          explanation:
            "Incorrect. Price is the vertical axis; horizontal is time.",
        },
        {
          text: "Volume increasing, from quietest on the left to busiest on the right.",
          explanation:
            "Incorrect. Volume is reported per candle, not by horizontal position.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c8-q2",
      prompt:
        "A candle opens at 0.120, closes at 0.127, with a high of 0.129 and a low of 0.117. What is true?",
      options: [
        {
          text: "It is a red candle and 0.129 is the close.",
          explanation:
            "Incorrect. The close (0.127) is above the open, so the candle is green, and 0.129 is the high, not the close.",
        },
        {
          text: "It is a green candle; the body runs 0.120 to 0.127 and the wicks reach 0.129 and 0.117.",
          explanation:
            "Correct. Close above open makes it green; the body spans open to close and the wicks mark the high and low.",
        },
        {
          text: "The body spans 0.117 to 0.129 and there are no wicks.",
          explanation:
            "Incorrect. The body is open-to-close (0.120 to 0.127); 0.117 and 0.129 are the wick extremes.",
        },
        {
          text: "It is green because the high beat the open.",
          explanation:
            "Incorrect. Colour comes from close versus open, not high versus open.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q3",
      prompt:
        "You want to judge the last full month of price action for a token. Which timeframe fits best?",
      options: [
        {
          text: "Hourly, which shows 24 one-hour candles.",
          explanation:
            "Incorrect. Hourly only covers about the last day, not a month.",
        },
        {
          text: "Daily, which shows 30 daily candles.",
          explanation:
            "Correct. Thirty daily candles cover roughly a month, matching the question.",
        },
        {
          text: "Yearly, which shows 365 daily candles.",
          explanation:
            "Incorrect. Yearly covers a full year, far more than the one month asked about.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q4",
      prompt: "Why does the bot pay attention to volume, not just price?",
      options: [
        {
          text: "High volume always means the price will keep rising.",
          explanation:
            "Incorrect. Volume confirms conviction behind a move but does not predict future direction.",
        },
        {
          text: "Volume sets the colour of each candle.",
          explanation:
            "Incorrect. Candle colour comes from close versus open; volume is separate.",
        },
        {
          text: "Volume confirms whether a move is trustworthy, and very thin markets are rejected by a minimum 24h volume gate.",
          explanation:
            "Correct. A move on heavy volume is more credible, and the bot refuses markets too thin to enter or exit reliably.",
        },
        {
          text: "Volume replaces price as the main thing to read on the chart.",
          explanation:
            "Incorrect. Volume complements price; you read both, not one instead of the other.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c8-q5",
      prompt:
        "The scanner shows a token with volume trend growing and rank trend improving. What does this liquidity trend tell you?",
      options: [
        {
          text: "The token is getting easier to trade and safer to size into over time.",
          explanation:
            "Correct. Growing volume plus a climbing rank means improving liquidity, so entering and later exiting is getting easier.",
        },
        {
          text: "The token's price is guaranteed to go up.",
          explanation:
            "Incorrect. Liquidity trend describes tradability, not future price direction.",
        },
        {
          text: "The token is drying up and should be avoided.",
          explanation:
            "Incorrect. That would be a shrinking volume trend and a declining rank trend, the opposite of this case.",
        },
      ],
      correctIndex: 0,
    },
  ],
};

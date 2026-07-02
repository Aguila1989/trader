// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Technical Analysis — Chart Patterns. An ADVANCED chapter on reading structure
// straight off the chart: support and resistance, trends, classic chart
// patterns, Fibonacci retracements, and applying them on this app's price
// graph. Authored to the exact same shape as content/en/chapter01.ts, with the
// per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms already taught in earlier chapters.
import type { Chapter } from "../../types";

export const chapter28: Chapter & { whoFor: string } = {
  id: "c28",
  number: 28,
  level: "ADVANCED",
  whoFor: "For traders who want to read structure straight off the chart",
  title: "Technical Analysis — Chart Patterns",
  description:
    "Support and resistance, trends, classic chart patterns, Fibonacci retracements, and how to apply them on this app's price graph.",
  lessons: [
    {
      id: "c28-l1",
      title: "What is support and resistance?",
      paragraphs: [
        "Support and resistance are price levels where the market has repeatedly changed its mind. Think of a floor and a ceiling. Support is the floor: a price the market keeps falling to but struggles to break below, because enough buyers step in there. Resistance is the ceiling: a price the market keeps rising to but struggles to break above, because enough sellers appear. Both are memory in action, marking the levels where past crowds decided a price was cheap or expensive.",
        "These levels form because traders remember them. If XLM/USDC bounced off 0.11 three times, buyers watch for a fourth bounce and sellers place orders just above, so the level self-reinforces. On the Stellar Decentralized Exchange this is literal: the on-chain order book shows resting bids clustering near support and asks near resistance, and the app's order-book depth is part of how it scores a token's liquidity.",
        "Levels do not hold forever. When price closes decisively through a floor or ceiling on strong volume, that level breaks and often flips roles. Broken resistance frequently becomes new support, and broken support becomes new resistance, because the crowd re-anchors its expectations to the new level. A weak poke through that quickly reverses is more likely a false break than a genuine one, so waiting for confirmation matters.",
      ],
      example:
        "On the XLM/USDC token detail page, price stalls near 0.12 on three separate rallies over a week — that is resistance, a ceiling. On the fourth attempt a candle closes cleanly above 0.12 with a jump in the volume bars. Over the next two days price dips back to 0.12 and holds. The old ceiling has flipped into a floor: resistance became support, and the level you were watching still matters, just with its role reversed.",
    },
    {
      id: "c28-l2",
      title: "What is a trend and how do you identify one?",
      paragraphs: [
        "A trend is the overall direction the price is drifting, ignoring the small zig-zags along the way. The clean way to read one is to look at the swing points — the local peaks and troughs. An uptrend makes higher highs and higher lows: each rally pushes a bit past the last peak, and each pullback stops above the previous dip. A downtrend does the mirror image: lower highs and lower lows, each bounce failing sooner and each drop going deeper.",
        "When neither pattern holds — highs and lows land at roughly the same place — the market is ranging sideways, bouncing between horizontal support and resistance rather than trending. Trends also live on different timescales at once: a token can be in a multi-month uptrend while printing a two-day downtrend inside it. That is why the timeframe you choose changes the answer, and why aligning your trade with the larger trend usually beats fighting it.",
        "A trend is intact only until its structure breaks. An uptrend is questioned the moment price makes a lower low, taking out a prior swing trough; a downtrend is questioned when price makes a higher high. That break of structure is your objective signal that the direction may be changing, rather than a gut feeling that it has run far enough.",
      ],
      example:
        "Reading XLM/USDC on the week view, you trace the swings: 0.10, back to 0.09, up to 0.115, back to 0.10, up to 0.13. Each peak is higher than the last (0.115, then 0.13) and each trough is higher too (0.09, then 0.10) — textbook higher highs and higher lows, so the trend is up. If the next pullback instead broke below 0.10 to make a lower low, the uptrend structure would be in doubt and you would tighten your assumptions.",
    },
    {
      id: "c28-l3",
      title: "Common chart patterns",
      paragraphs: [
        "Chart patterns are recurring shapes that hint at what a crowd is about to do. A head and shoulders is a topping pattern: three peaks where the middle one (the head) is highest and the two outer ones (the shoulders) are lower and roughly level. A line drawn under the two dips between them is the neckline. When price closes below that neckline, it signals the uptrend has likely exhausted and a fall may follow. Flip the whole shape upside down — a low, a lower low, then a higher low — and you have an inverse head and shoulders, a bottoming pattern that hints at a turn upward.",
        "A double top looks like the letter M: price rallies to a high, pulls back, rallies to almost exactly the same high, and fails again. That twice-rejected ceiling suggests buyers are spent, and a drop below the middle dip confirms it. A double bottom is the mirror, a W shape: two failed attempts to push lower, hinting sellers are spent and a rise may be starting. Both patterns are really just support or resistance holding twice, drawn as a memorable shape.",
        "A flag is a brief pause inside a strong move. After a sharp run, price drifts sideways or gently against the move in a small tilted rectangle — the flag — hanging off the steep initial move that forms the flagpole. It usually resolves in the direction of the original move, as if the market caught its breath before continuing. None of these shapes is a guarantee; they are probabilities that improve when volume and the wider trend agree, and they fail often enough that a stop loss stays essential.",
      ],
      example:
        "On a token's day view you see three peaks near 0.14, 0.16, and 0.14 — a clear head and shoulders, with the neckline drawn across the two dips at about 0.125. Price then closes below 0.125 as the volume bars swell. The pattern has triggered: the prior uptrend is signalling exhaustion, and a trader using the app's Manual tab might set a stop loss just above the right shoulder to cap the risk if the break turns out to be false.",
    },
    {
      id: "c28-l4",
      title: "What are Fibonacci retracements and how do you use them?",
      paragraphs: [
        "After a strong move, price rarely runs in a straight line — it pulls back part of the way before, sometimes, resuming. Fibonacci retracements are a set of horizontal levels that many traders use to guess how deep that pullback might go. You anchor the tool from the start of a move to its end, and it draws lines at fixed percentages of that range. The levels traders watch most are 38.2%, 50%, and 61.8% — a 38.2% retracement is a shallow dip, 61.8% is a deep one that gives back most of the move.",
        "The idea is that these ratios act as potential support in an uptrend (or resistance in a downtrend), zones where a pullback may stall and the trend may resume. The 50% level is not truly a Fibonacci number but is included by convention because prices so often give back about half a move. Used well, these levels are candidates to watch, not commands: a place to look for a bounce, ideally where a Fibonacci level lines up with a support or resistance level you already identified independently.",
        "Be careful not to over-rely on them. Fibonacci levels are partly self-fulfilling — they work in part because enough traders watch the same lines — and it is easy to draw them from cherry-picked swing points until one seems to fit. Treat a level that coincides with prior structure or a round number as more meaningful, always confirm with price action rather than buying blindly at a line, and protect the idea with a stop loss in case the pullback becomes a full reversal.",
      ],
      example:
        "XLM/USDC runs from 0.10 up to 0.15, a 0.05 move. Anchoring the Fibonacci tool from 0.10 to 0.15 puts the 38.2% level near 0.131, the 50% near 0.125, and the 61.8% near 0.119. Price pulls back and steadies right around 0.125 — the 50% level — which also happens to be an old resistance shelf from last month. Two independent signals pointing at the same price make 0.125 a more credible spot to watch for the uptrend to resume than a lone Fibonacci line would be.",
    },
    {
      id: "c28-l5",
      title: "How to use the price graph in this app for technical analysis",
      paragraphs: [
        "The token detail page is where all of this comes together. Its price graph has hour, day, week, and year tabs, and each tab is a different lens on the same asset. The Reading the Market chapter already covers how the chart itself and the candlesticks work, so this lesson assumes you know how to read them and focuses only on applying support and resistance, trends, and patterns across those four tabs.",
        "Work from the top down. Start on the year tab to see the dominant trend and the major support and resistance levels that have held over the long run — the big floors and ceilings worth respecting. Drop to the week tab to place the swing highs and lows that define the current trend, then the day tab to find the pattern you might trade, such as a double bottom or a flag. Finally use the hour tab to time an entry near a level, watching for a break or a bounce rather than guessing. Read the volume bars alongside: a break of support or resistance on rising volume is far more convincing than one on thin volume.",
        "Once the chart tells you a level, turn it into a plan using the app's own tools. A support level you trust becomes a stop-loss price on the Manual Trading tab; a resistance level becomes a target price; and the distance between your entry and your invalidation price is exactly the reward-to-risk the app checks before letting a trade through. This is education, not financial advice — patterns describe probabilities, never certainties, so every read still needs a defined exit.",
      ],
      example:
        "You want to trade XLM/USDC. On the year tab the trend is clearly up with long-run support at 0.09. The week tab shows higher highs and higher lows still intact. The day tab prints a flag pausing after a rally, and the hour tab shows price bouncing off the flag's lower edge at 0.118 on rising volume. You buy near 0.118, set the stop loss just below at 0.115 (invalidation), and set a target at the prior high of 0.14 — a read built tab by tab, then wired into the app's stop-loss and target tools.",
    },
  ],
  quiz: [
    {
      id: "c28-q1",
      prompt: "Price repeatedly rallies to 0.12 on XLM/USDC but keeps failing to close above it. What is 0.12 acting as, and what often happens if price finally closes decisively above it?",
      options: [
        {
          text: "It is support (a floor); a close above it means the floor has collapsed.",
          explanation:
            "The roles are swapped. A level that price keeps failing to rise above is a ceiling — resistance — not a floor. Support is the level price keeps falling to but holding above.",
        },
        {
          text: "It is resistance (a ceiling); once broken, it often flips to become new support.",
          explanation:
            "Correct. A repeatedly rejected level overhead is resistance. When price closes decisively through it, the crowd re-anchors and the old ceiling frequently acts as a new floor on the next pullback.",
        },
        {
          text: "It is resistance, and once broken it disappears entirely and never matters again.",
          explanation:
            "Half right on the label, wrong on the aftermath. Broken resistance rarely just vanishes; it commonly flips role and becomes support, so the level keeps mattering.",
        },
        {
          text: "It is a Fibonacci level, so no confirmation or volume is needed to trade the break.",
          explanation:
            "No. This is an ordinary horizontal resistance level, not a Fibonacci retracement, and trading any break blindly without volume or confirmation invites getting caught in a false break.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q2",
      prompt: "You trace the swing points on the week tab and find: 0.10, 0.09, 0.115, 0.10, 0.13. How would you classify this trend?",
      options: [
        {
          text: "A downtrend, because the price started at 0.10 and there were pullbacks.",
          explanation:
            "Pullbacks alone do not make a downtrend. A downtrend needs lower highs and lower lows; here the peaks (0.115 then 0.13) and troughs (0.09 then 0.10) are both rising.",
        },
        {
          text: "A sideways range, because the price keeps bouncing up and down.",
          explanation:
            "A range means highs and lows land at roughly the same level. Here each high and each low is progressively higher, so it is trending, not ranging.",
        },
        {
          text: "An uptrend, because the swings show higher highs (0.115 then 0.13) and higher lows (0.09 then 0.10).",
          explanation:
            "Correct. The defining structure of an uptrend is higher highs and higher lows, and both are present here, so the trend is up until a lower low breaks that structure.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c28-q3",
      prompt: "On the day view you see three peaks — a lower one, a higher middle one, then a lower one again — with a line drawn under the two dips between them. Price then closes below that line on rising volume. What pattern is this and what does it suggest?",
      options: [
        {
          text: "A head and shoulders topping pattern; a close below the neckline signals the uptrend may be exhausting and a fall could follow.",
          explanation:
            "Correct. Three peaks with a higher head in the middle and a neckline under the dips is a head and shoulders. Closing below the neckline, especially on rising volume, is the trigger that warns of a possible downturn.",
        },
        {
          text: "A double bottom (W shape) signalling that sellers are exhausted and a rise is likely.",
          explanation:
            "Wrong shape. A double bottom is a W of two failed lows, a bottoming pattern. Three peaks with the middle highest is a top, and here price broke down, not up.",
        },
        {
          text: "A bull flag, meaning the prior move will simply continue upward after a brief pause.",
          explanation:
            "A flag is a small sideways pause hanging off a steep pole, not three distinct peaks with a neckline. And a break below the neckline points down, the opposite of a flag continuing up.",
        },
        {
          text: "An inverse head and shoulders, a bottoming pattern that hints at a turn upward.",
          explanation:
            "An inverse head and shoulders is this shape flipped — a low, a lower low, then a higher low — and it breaks upward. What is described here is the standard, right-way-up version that breaks down.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c28-q4",
      prompt: "After a run from 0.10 to 0.15, you draw a Fibonacci retracement and price steadies near the 61.8% level, which also lines up with an old resistance shelf. How should you treat this?",
      options: [
        {
          text: "Buy immediately with no stop, because a 61.8% Fibonacci level always holds.",
          explanation:
            "No level always holds. A 61.8% retracement is actually a deep pullback that gives back most of the move, and buying with no stop leaves you unprotected if the pullback becomes a full reversal.",
        },
        {
          text: "Treat it as a more credible zone to watch for a bounce because two independent signals coincide, while still confirming with price and using a stop loss.",
          explanation:
            "Correct. A Fibonacci level is only a candidate to watch, but its weight grows when it overlaps with independent structure like prior resistance. You still confirm with price action and protect the idea with a stop.",
        },
        {
          text: "Ignore it, since Fibonacci levels are meaningless and never influence price.",
          explanation:
            "Too dismissive. Fibonacci levels are partly self-fulfilling because many traders watch the same lines, so they can matter — especially where they align with real structure — even if they are not magic.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q5",
      prompt: "You want to apply technical analysis on a token's price graph in this app, which has hour, day, week, and year tabs. What is the most sensible workflow?",
      options: [
        {
          text: "Use only the hour tab, since short-term detail is all that matters for any trade.",
          explanation:
            "Working only on the hour tab is blinkered. You would miss the dominant trend and the major long-run support and resistance that the week and year tabs reveal, and easily trade against the bigger picture.",
        },
        {
          text: "Work top down: the year tab for the dominant trend and major levels, the week tab for the current trend's swings, the day tab for a pattern, and the hour tab to time an entry — reading volume throughout.",
          explanation:
            "Correct. Starting broad and narrowing keeps your trade aligned with the larger trend, finds a tradable pattern, and times the entry near a level, with volume confirming any break — then the level becomes a stop-loss or target in the app.",
        },
        {
          text: "Pick whichever single tab currently shows a shape you like and ignore the others.",
          explanation:
            "Cherry-picking one flattering timeframe is how traders fool themselves. A pattern on the day tab can point one way while the year trend points the other; the tabs are meant to be read together, top down.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

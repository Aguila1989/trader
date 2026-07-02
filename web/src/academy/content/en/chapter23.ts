// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// BASIC chapter on Market Cycles: bull and bear markets, altseasons,
// corrections vs crashes, why coins move together, and how to stay calm in a
// downturn. Authored to the exact same shape as content/en/chapter22.ts.
// The only addition is the per-chapter `whoFor` one-liner, typed via a local
// intersection so the live Chapter interface stays untouched until integration.
// New BASIC glossary terms introduced here (bull market, bear market, altseason,
// market correction, market crash) live in glossary.pending.ts, NOT in the live
// glossary, and are spelled verbatim in the prose so the first occurrence
// auto-links to a tooltip.
import type { Chapter } from "../../types";

export const chapter23: Chapter & { whoFor: string } = {
  id: "c23",
  number: 23,
  level: "BASIC",
  whoFor: "For traders who want to stay calm through the ups and downs",
  title: "Market Cycles",
  description:
    "Bull and bear markets, altseasons, corrections versus crashes, why coins tend to move together, and how to behave when the market turns down.",
  lessons: [
    {
      id: "c23-l1",
      title: "What is a bull market and a bear market?",
      paragraphs: [
        "Markets move in long stretches, not straight lines. A bull market is a sustained period when prices are broadly rising and most people feel optimistic. A bear market is the opposite: a sustained period when prices are broadly falling and caution takes over. Neither lasts forever, and one always eventually gives way to the other.",
        "The names come from how each animal attacks. A bull tosses its horns upward, and a bear swipes its paw downward, which is a handy way to remember which is which. In a bull market the mood is confident and buyers are eager; in a bear market the mood is fearful and sellers dominate.",
        "The most important thing for a beginner to understand is that both are completely normal. Prices do not only go up, and they do not only go down. Expecting both kinds of weather in advance keeps you from being shocked when the season changes.",
      ],
      example:
        "Think of the year as having seasons. Spring is a bull market: things grow, everything looks green, and it feels like it will last. Winter is a bear market: growth stops, the days are grey, and it can feel like the cold will never end. But spring always returns and winter always comes back. Both are normal, and both pass. A trader who panics in winter has simply forgotten that the seasons turn.",
    },
    {
      id: "c23-l2",
      title: "What is an altseason?",
      paragraphs: [
        "In crypto, the biggest and best-known coins usually lead the way. When those giants have already risen a lot, attention often spills over into smaller coins, sometimes called \"alt\" coins, short for alternatives. A period when these smaller coins rise especially fast, outrunning the largest ones, is called an altseason.",
        "During an altseason the excitement can be intense, because small coins can move a very large percentage in a short time. That works in both directions, though. The same coins that shoot up quickly can also fall just as quickly when the mood cools, so the fast gains come with fast risk.",
        "For a calm trader, the lesson is not to chase every fast-moving coin. Fast moves feel thrilling, but a coin that can double in a week can also halve in a week. Understanding what an altseason is helps you see the excitement for what it is, rather than being swept up in it.",
      ],
      example:
        "Picture a big parade where the huge floats go first and draw the biggest crowds. Once those have passed, the smaller performers behind them get their moment, and for a while the crowd cheers loudest for them. An altseason is that stretch of the parade: the little acts suddenly outshine the giants for a short, energetic burst before the parade moves on.",
    },
    {
      id: "c23-l3",
      title: "What is a market correction vs a crash?",
      paragraphs: [
        "Not every drop is a disaster. A market correction is a modest, normal dip, often around ten percent, that interrupts a rising trend without ending it. Corrections are healthy: they let an over-excited price cool off and catch its breath, and they happen regularly even in a strong bull market.",
        "A market crash is a different animal. It is a sudden, severe drop, far sharper and deeper than a normal correction, and it usually comes with real fear. Where a correction is a pause, a crash can feel like the floor falling away, with prices dropping fast over hours or days.",
        "Telling the two apart matters because they call for different reactions. Panicking over a routine correction can make you sell a good position for no reason, while treating a genuine crash as \"just a dip\" can leave you ignoring real danger. Neither should be met with pure emotion.",
      ],
      example:
        "Imagine hiking down a hill. A market correction is a short, steep step down on an otherwise upward path: a little jolt, but you keep climbing overall. A market crash is more like the trail suddenly giving way beneath you. Both involve going down, but one is a normal bump in the walk and the other is a fall you need to brace for.",
    },
    {
      id: "c23-l4",
      title: "Why does the whole market sometimes move together?",
      paragraphs: [
        "Some days it feels as if almost every coin is green, and other days almost every coin is red, all at once. This is because prices are driven not just by each coin's own story but by a shared mood across the whole market. When fear or greed sweeps through, it touches nearly everything at the same time.",
        "The biggest coins act like an anchor for the rest. Because so much money and attention sits in the largest coins, when they move sharply they tend to drag the smaller ones along in the same direction. A wave of confidence lifts the whole field, and a wave of fear pulls it all down together.",
        "Knowing this stops you from misreading a red day. If your coin drops while everything else is dropping too, it usually means the whole market is nervous, not that something is specifically wrong with your coin. Separating market-wide mood from coin-specific news is a calming and useful habit.",
      ],
      example:
        "Think of boats in a harbour when the tide comes in or goes out. It does not matter whether a boat is large or small, old or new; when the tide rises, they all rise together, and when it falls, they all sink together. Market sentiment is that tide. On a strong fear day the tide goes out and almost every coin drops with it, regardless of its own merits.",
    },
    {
      id: "c23-l5",
      title: "How do you behave in a bear market?",
      paragraphs: [
        "The single biggest mistake in a downturn is panic-selling, dumping a position purely because the falling price feels unbearable. That reflex tends to lock in a loss at the worst possible moment. The steadier path is to slow down, stick to the plan you made while calm, and avoid making brand-new decisions in the heat of fear.",
        "Sitting in cash-like safety is also a perfectly valid choice, not a failure. Holding stablecoins such as USDC during a bear market lets you step back from the swings without leaving the ecosystem, and you can re-enter later when you feel ready. Choosing to do nothing for a while is itself a decision.",
        "A downturn is also a gift of time. With less pressure to act, you can focus on learning: study how coins are scored, read the AI Log, and get comfortable with the tools. In this app a stop loss can define your exit in advance so a single trade cannot spiral, which pairs well with the calm, plan-first mindset covered in earlier chapters. This is education, not financial advice, and only you can decide what fits your situation.",
      ],
      example:
        "Imagine a small boat caught in a storm. The panicking sailor throws the cargo overboard and jumps ship in a fright. The calm sailor lowers the sails, holds a steady course, and waits for the weather to pass. In a bear market, moving some funds into stablecoins is like lowering the sails, and refusing to panic-sell is like staying with the boat until calmer water returns.",
    },
  ],
  quiz: [
    {
      id: "c23-q1",
      prompt: "How should you think about a bull market and a bear market?",
      options: [
        {
          text: "A bull market is normal, but a bear market is a sign the market is broken and gone for good.",
          explanation:
            "Not so. Both are normal phases. Like spring and winter, a bear market is just as natural as a bull market, and it always eventually passes.",
        },
        {
          text: "Both are normal, recurring phases: prices rise for a stretch, then fall for a stretch, and each eventually gives way to the other.",
          explanation:
            "Correct. Markets move in cycles. Expecting both the rising and falling seasons keeps you from being shocked when the mood changes.",
        },
        {
          text: "You can safely ignore the difference, because prices only ever go up over time.",
          explanation:
            "No. Prices do not only go up. Ignoring the down phases is exactly what leaves traders unprepared when a bear market arrives.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q2",
      prompt: "During an altseason, smaller coins are rising very fast. What is the calm way to see this?",
      options: [
        {
          text: "Fast-rising alt coins are guaranteed money, so you should buy as many as possible.",
          explanation:
            "No. A coin that can double quickly can also halve quickly. There is no guarantee, and chasing every fast mover is how people get caught out.",
        },
        {
          text: "The excitement is real, but the same coins that shoot up fast can fall just as fast, so the quick gains come with quick risk.",
          explanation:
            "Correct. An altseason is thrilling but two-sided. Recognising it for what it is helps you avoid being swept up in the hype.",
        },
        {
          text: "An altseason means the biggest coins have permanently stopped mattering.",
          explanation:
            "Not true. The largest coins still lead the market; an altseason is just a stretch when smaller coins temporarily outrun them.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q3",
      prompt: "What is the difference between a market correction and a market crash?",
      options: [
        {
          text: "A market crash is a small, healthy dip, while a market correction is a total collapse.",
          explanation:
            "This has them reversed. A correction is the small, normal dip; a crash is the sudden, severe drop.",
        },
        {
          text: "They are exactly the same thing with two different names.",
          explanation:
            "No. They differ in size and speed, which is why they call for different reactions.",
        },
        {
          text: "A correction is a modest, normal dip (often around ten percent) that interrupts a rise, while a crash is a sudden, far sharper and deeper drop.",
          explanation:
            "Correct. A correction is a pause that lets prices cool off; a crash feels like the floor falling away and signals real danger.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c23-q4",
      prompt: "Your coin is dropping, but so is almost every other coin at the same time. What does this usually mean?",
      options: [
        {
          text: "The whole market is in a fearful mood, and market-wide sentiment is dragging most coins down together.",
          explanation:
            "Correct. Like a tide lowering every boat, a wave of fear pulls the whole field down at once. It is usually not something specific to your coin.",
        },
        {
          text: "Something is specifically and uniquely wrong with your coin.",
          explanation:
            "Probably not. When everything falls together, it points to shared market mood rather than a problem with your single coin.",
        },
        {
          text: "It is a coincidence, and coins moving together at the same time means nothing.",
          explanation:
            "No. Coins moving together is a real pattern, driven by shared sentiment and by the largest coins dragging the rest along.",
        },
      ],
      correctIndex: 0,
    },
  ],
};

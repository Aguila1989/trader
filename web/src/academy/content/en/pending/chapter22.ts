// PENDING — do not activate until green light.
// Reference/gold-standard chapter for the Academy content expansion (Trading
// Psychology). Authored to the exact same shape as content/en/chapter01.ts. The
// only addition is the per-chapter `whoFor` one-liner, typed via a local
// intersection so the live Chapter interface stays untouched until integration.
// New BASIC glossary terms introduced here (fomo, fud, lossAversion,
// tradingPlan) live in glossary.pending.ts, NOT in the live glossary, and are
// spelled verbatim in the prose so the first occurrence auto-links to a tooltip.
import type { Chapter } from "../../../types";

export const chapter22: Chapter & { whoFor: string } = {
  id: "c22",
  number: 22,
  level: "BASIC",
  whoFor: "For anyone who has ever panic-sold or bought the top",
  title: "Trading Psychology",
  description:
    "The mind games that cost traders money: FOMO, FUD, loss aversion, and the plain habits that keep your decisions calm and rule-based.",
  lessons: [
    {
      id: "c22-l1",
      title: "What is FOMO and why does it lead to bad decisions?",
      paragraphs: [
        "FOMO means the fear of missing out. In trading, it is the anxious feeling that a coin is running away without you, so you buy quickly before thinking it through. The feeling is real, but it pushes you to buy when a price is already high and the easy gains are gone.",
        "The problem is timing. By the time a coin is all over your feed and everyone is excited, most of the move has usually already happened. Buyers who chase that excitement often arrive right before the price cools off, then watch their new position fall. The decision was driven by emotion, not by a plan.",
        "A calmer approach is to decide in advance what a coin is worth to you and wait for that price. If it never comes, you simply skip the trade. Missing a gain is not the same as losing money, and there is always another opportunity.",
      ],
      example:
        "Imagine walking past a restaurant with a long queue outside. You have never eaten there and know nothing about the food, but the crowd makes you join anyway. That is FOMO. You lined up because others did, not because you checked whether the meal was any good. In trading, buying a coin only because it is spiking is the same reflex.",
    },
    {
      id: "c22-l2",
      title: "What is FUD and how do you recognise it?",
      paragraphs: [
        "FUD stands for fear, uncertainty, and doubt. It describes negative talk, sometimes true and sometimes not, that is spread to make you scared enough to sell. It can be an honest warning, or it can be someone trying to push a price down so they can buy cheaply.",
        "The trick to handling FUD is to separate the claim from the emotion. Ask what exactly is being said, whether there is any evidence, and who benefits if you panic. A vague We are all going to lose everything is very different from a specific, verifiable fact you can check yourself.",
        "You do not have to ignore bad news, and real risks deserve real attention. But you should never sell purely because a scary message made your heart race. Slow down, verify, and only then decide.",
      ],
      example:
        "Think of someone shouting fire in a crowded theatre. Sometimes there really is smoke and leaving fast is the right call. Sometimes there is nothing, and the person just wanted the seats to empty. FUD is the same: before you rush for the exit and sell everything, glance around and check whether there is any actual smoke.",
    },
    {
      id: "c22-l3",
      title: "Why do people sell exactly at the bottom?",
      paragraphs: [
        "It happens again and again: a price falls, the holder endures it for a while, then finally sells in despair, often just before it recovers. This pattern is driven by loss aversion, a well-studied quirk where the pain of losing feels about twice as strong as the pleasure of an equal gain.",
        "Because a paper loss hurts so much, watching it grow becomes unbearable. Selling makes the bad feeling stop right now, so the brain treats it as relief even when it locks in the worst possible price. The decision solves an emotional problem, not a financial one.",
        "Knowing this in advance is the defence. If you decide your exit price before you feel the fear, you are far less likely to dump at the bottom just to make the discomfort go away.",
      ],
      example:
        "Picture two envelopes. In one you find 50 USDC, a nice surprise. In the other you lose 50 USDC you already had. Most people feel the loss far more sharply than the gain, even though the amount is identical. That lopsided feeling is loss aversion, and it is exactly what tempts a trader to sell at the lowest point.",
    },
    {
      id: "c22-l4",
      title: "What is a trading plan and why do you need one?",
      paragraphs: [
        "A trading plan is a short set of rules you write for yourself before you trade: what you will buy, how much, at what price you take profit, and at what price you accept a loss and get out. It turns vague hopes into clear, decided-in-advance actions.",
        "The value of a plan is that you write it while you are calm, not while a price is crashing or spiking. When emotions run high later, you do not have to invent a decision on the spot. You just follow the rules you already agreed with yourself.",
        "In this app you can put parts of your plan into the tools directly. A stop loss sets the price where you exit a losing trade, and a target price sets where you take profit, so the plan runs even when you are not watching.",
      ],
      example:
        "Setting out on a road trip without a map or GPS, you drive on gut feeling, take wrong turns, and argue about every junction. With a route planned in advance, each turn is already decided and the drive is calm. A trading plan is that route: you settle the hard choices before you set off, not in a panic at the wheel.",
    },
    {
      id: "c22-l5",
      title: "How do you make a decision without emotion?",
      paragraphs: [
        "You cannot switch feelings off, but you can stop them from driving. The core trick is to decide the rules before money and emotion are on the line, then let those rules make the call in the moment. A trading plan, a stop loss, and a target price all do this for you.",
        "It also helps to slow down. Most bad trades come from acting in seconds. Waiting even a few minutes, or sleeping on a big decision, lets the first rush of fear or greed fade so your reasoning can catch up. If a trade only makes sense while you are excited, it is usually not a good trade.",
        "Finally, write down why you made each trade. Reviewing your own notes later shows you honestly whether emotion or logic was in charge, and that feedback slowly makes you a steadier trader.",
      ],
      example:
        "A pilot does not rely on mood during a storm; they run a written checklist, one calm step at a time. You can treat trading the same way: a small checklist such as Is this in my plan? Have I set my exit? Am I acting on facts or on fear? turns a heated impulse into a cool, deliberate decision.",
    },
  ],
  quiz: [
    {
      id: "c22-q1",
      prompt: "You see a coin spiking and everyone online is talking about it. You feel an urge to buy immediately. What is the healthiest response?",
      options: [
        {
          text: "Buy at once, because if everyone is excited the price must keep rising.",
          explanation:
            "This is FOMO in action. By the time a coin is everywhere, most of the move has usually happened, and chasing it often means buying right before it cools off.",
        },
        {
          text: "Pause, decide what the coin is actually worth to you, and only buy at that price — otherwise skip it.",
          explanation:
            "Correct. Deciding your price in advance replaces the emotional chase with a rule. Missing a gain is not a loss, and another opportunity will always come.",
        },
        {
          text: "Sell everything else you own to buy as much of it as possible.",
          explanation:
            "No. Piling in harder makes the FOMO mistake bigger, not smaller, and abandons any plan you had.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q2",
      prompt: "A dramatic message says a coin is about to collapse and you should sell now. How should you treat it?",
      options: [
        {
          text: "Sell immediately, because the message sounds urgent and scary.",
          explanation:
            "Acting on fear alone is exactly what FUD is designed to trigger. Urgency and drama are not the same as evidence.",
        },
        {
          text: "Separate the claim from the emotion: check for real evidence and ask who benefits if you panic.",
          explanation:
            "Correct. FUD mixes fear with vague claims. Verifying the specific facts, and noticing who gains from your panic, keeps the decision rational.",
        },
        {
          text: "Ignore all negative news forever, since it is always fake.",
          explanation:
            "Not quite. Some bad news is real and deserves attention. The skill is verifying claims, not dismissing every warning.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q3",
      prompt: "Why does loss aversion often cause traders to sell at the very bottom?",
      options: [
        {
          text: "Because selling low is mathematically the best way to make a profit.",
          explanation:
            "No. Selling at the bottom locks in the worst price. It has nothing to do with profit and everything to do with stopping emotional pain.",
        },
        {
          text: "Because the pain of a growing loss feels so strong that selling to make the feeling stop seems like relief.",
          explanation:
            "Correct. Loss aversion means losses hurt about twice as much as equal gains feel good, so people sell to end the discomfort even at the worst moment.",
        },
        {
          text: "Because a trading plan forces them to sell at the lowest price.",
          explanation:
            "The opposite is true. A plan with a pre-set exit is what prevents panic-selling at the bottom.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q4",
      prompt: "What is the main benefit of writing a trading plan before you trade?",
      options: [
        {
          text: "It guarantees every trade will be profitable.",
          explanation:
            "No plan can guarantee profit. Markets are uncertain; a plan manages your behaviour, not the outcome.",
        },
        {
          text: "You decide your buy, profit-taking, and exit rules while calm, so heated emotions do not make the decision later.",
          explanation:
            "Correct. A plan set in a calm moment means that when a price swings, you follow rules you already chose instead of improvising under stress.",
        },
        {
          text: "It lets you trade without ever needing a stop loss or target price.",
          explanation:
            "Backwards. A stop loss and a target price are tools that put your plan into action, not things a plan removes the need for.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

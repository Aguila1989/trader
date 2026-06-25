import type { Chapter } from "../../types";

export const chapter06: Chapter = {
  id: "c6",
  number: 6,
  level: "ADVANCED",
  title: "Trailing Stop Losses",
  description:
    "A stop that follows the price up to lock in profit but never moves down, and how to set one here.",
  lessons: [
    {
      id: "c6-l1",
      title: "What is a trailing stop loss?",
      paragraphs: [
        "A trailing stop loss is a protective exit whose trigger price follows the market in your favour but never against you. Instead of fixing one price, you set a distance to trail by, and the bot keeps the trigger that distance below the best price it has seen.",
        "As the price climbs, the trigger climbs with it, ratcheting up and protecting more of your gain. The moment the price stalls or reverses far enough to touch the trigger, the stop fires and closes the position by crossing to fill immediately, just like a regular stop.",
        "The app states it plainly in its own tooltip: a trailing stop moves up automatically as the price rises, locking in profit, but never moves down. You set the distance to trail by, in price units or percent. This lets winners run while still capping how much of a move you give back.",
      ],
      example:
        "You hold XLM bought near 0.110 USDC. You set a trailing stop with a 5 percent trail. At the current mid of 0.120 the initial trigger sits at 0.120 times 0.95, which is 0.114. Price rises to 0.130, so the trigger rises to 0.1235. If price then slips back to 0.1235 the stop fires and sells, banking far more than your entry.",
    },
    {
      id: "c6-l2",
      title: "How is a trailing stop loss different from a regular stop loss?",
      paragraphs: [
        "A regular stop loss has a single fixed trigger price that you choose once and that never changes on its own. It protects you against downside, but if the price rallies it does nothing to capture that new profit. You would have to cancel and re-enter a higher stop by hand.",
        "A trailing stop solves that. Its trigger is computed from a moving reference, the best price seen so far, minus your trail distance. So it automatically migrates upward as the trade works, and only upward. It will never drift down toward your entry on its own.",
        "Both stops behave identically when they fire: they cross the book to fill now, accepting the current price to guarantee the exit. The only difference is whether the trigger is frozen, as with a regular stop, or self-adjusting, as with a trailing stop. In the stop-loss panel you switch between them with a toggle.",
      ],
      example:
        "Two stops on XLM bought at 0.110. A regular stop is fixed at 0.105 forever. A trailing stop set 0.005 below price starts at 0.115 when the mid is 0.120. Price runs to 0.140: the regular stop still sits at 0.105 risking the whole gain, while the trailing trigger has climbed to 0.135, locking in roughly 0.025 of profit per unit.",
    },
    {
      id: "c6-l3",
      title: "What is a high water mark and how does it work?",
      paragraphs: [
        "The high-water mark is the single number that makes trailing work. For a long position it is the highest price the bot has observed since the stop was created. Every new tick is compared against it, and the mark only updates when a higher price arrives.",
        "The effective trigger is always derived from this mark: high-water mark times (1 minus percent divided by 100) for a percentage trail, or high-water mark minus the amount for an amount trail. Because the mark can only rise, the trigger can only rise. A lower price never lowers the mark, so it never loosens your protection.",
        "In the stop list each trailing stop shows a trailing badge, the current live trigger, and a High-water column so you can see the mark and the trigger move together in real time. Watching that column ratchet upward is the clearest picture of profit being locked in step by step.",
      ],
      example:
        "Amount trail of 0.004 on XLM. Mid is 0.120, so the mark is 0.120 and the trigger is 0.116. Price ticks 0.123, 0.121, 0.128: the mark only follows the new highs to 0.123 then 0.128, so the trigger rises to 0.119 then 0.124. The dip to 0.121 left both untouched. The trigger ended at 0.124 and never fell.",
    },
    {
      id: "c6-l4",
      title: "Trail by amount vs trail by percentage — when to use which?",
      paragraphs: [
        "When you choose Trailing Stop Loss you also pick how to measure the distance: Trail by percent or Trail by Amount. A percentage trail scales with price, so the gap in absolute terms grows as the asset appreciates. An amount trail keeps the same fixed price-unit gap no matter where the price goes.",
        "Percentage trails suit assets that move proportionally and trades you want to hold through large advances, because the room to breathe expands with the position. Amount trails suit tight, well-defined risk, such as a stablecoin pair like XLM against USDC where you think in fixed price units and want a predictable distance.",
        "Whichever you choose, the app previews an Initial stop price from the current mid so you can sanity-check the distance before committing. If that preview sits uncomfortably close to or far from the price, adjust the number before you create the stop.",
      ],
      example:
        "XLM at a mid of 0.120. A 5 percent trail gives an initial trigger of 0.114, a gap of 0.006. An amount trail of 0.006 gives the same 0.114 today. But if price doubles to 0.240 the percent trail now sits 0.012 away while the amount trail still sits just 0.006 away, far tighter at the higher price.",
    },
    {
      id: "c6-l5",
      title: "How to set a trailing stop loss in this app (manual and AI)",
      paragraphs: [
        "To set one manually, open the stop-loss panel and flip the toggle to Trailing Stop Loss. Choose Trail by percent or Trail by Amount, enter the distance, and read the Initial stop price preview that the app computes from the current mid. When the preview looks right, create the stop and it joins the list with its trailing badge.",
        "Once live, you do not manage it tick by tick. The bot maintains the high-water mark for you and recomputes the trigger on every price update, so the live trigger and High-water columns update themselves. If the price falls back to the trigger, it fires and closes by crossing to fill now.",
        "Trailing stops can also be created by the AI rather than by hand. An AI-placed trailing stop appears in the same list with the same trailing badge, live trigger, and High-water column, and follows the identical ratchet rules. Whether set by you or the AI, the mechanics are exactly the same.",
      ],
      example:
        "You toggle Trailing Stop Loss, pick Trail by percent, and enter 4. With the mid at 0.120 the panel previews an Initial stop price of 0.1152. You create it; the list shows a trailing badge, trigger 0.1152, high-water 0.120. Price later peaks at 0.135, so the High-water column reads 0.135 and the live trigger reads 0.1296.",
    },
  ],
  quiz: [
    {
      id: "c6-q1",
      prompt: "What best describes a trailing stop loss?",
      options: [
        {
          text: "A protective exit whose trigger follows the price up by a set distance but never moves down.",
          explanation:
            "Correct. The trigger trails the best price by your chosen distance and only ever ratchets upward, locking in profit.",
        },
        {
          text: "A fixed trigger price that you set once and that never changes.",
          explanation:
            "That describes a regular stop loss, not a trailing one. A trailing stop's trigger moves toward profit.",
        },
        {
          text: "An order that adds to your position automatically as the price rises.",
          explanation:
            "A trailing stop never buys more. It is an exit that closes the position when the price falls back to the moving trigger.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c6-q2",
      prompt:
        "What is the key difference between a regular stop and a trailing stop in this app?",
      options: [
        {
          text: "The regular stop fills at a limit price while the trailing stop never fills.",
          explanation:
            "Incorrect. Both stops fire by crossing to fill immediately; neither sits as a passive limit when triggered.",
        },
        {
          text: "The trailing stop's trigger self-adjusts upward while the regular stop's trigger stays fixed.",
          explanation:
            "Correct. A regular stop holds one fixed price; the trailing stop recomputes its trigger from the rising high-water mark.",
        },
        {
          text: "The trailing stop can move its trigger both up and down to follow the price.",
          explanation:
            "Incorrect. The trailing trigger only moves up toward profit; it never moves down.",
        },
        {
          text: "Only the regular stop can be placed by the AI.",
          explanation:
            "Incorrect. Trailing stops can be set manually or by the AI, and appear with a trailing badge either way.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q3",
      prompt:
        "Price on a long goes 0.120, then 0.130, then back to 0.126, with a 0.005 amount trail. What is the trigger after the dip to 0.126?",
      options: [
        {
          text: "0.121, because the trigger follows the latest price of 0.126 down.",
          explanation:
            "Incorrect. The high-water mark does not fall, so the trigger does not fall when the price dips.",
        },
        {
          text: "0.125, because the high-water mark stayed at 0.130 and 0.130 minus 0.005 is 0.125.",
          explanation:
            "Correct. The mark locked at the 0.130 high, so the trigger holds at 0.125 even as price slips to 0.126.",
        },
        {
          text: "0.115, because the trigger is always 0.005 below the starting price of 0.120.",
          explanation:
            "Incorrect. The trigger is measured from the high-water mark, which rose to 0.130, not from the start price.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q4",
      prompt:
        "Why might you prefer an amount trail over a percentage trail on a stablecoin pair like XLM against USDC?",
      options: [
        {
          text: "Because an amount trail automatically widens as the price rises.",
          explanation:
            "Incorrect. That is the percentage trail's behaviour. An amount trail keeps a fixed price-unit gap.",
        },
        {
          text: "Because an amount trail disables the high-water mark.",
          explanation:
            "Incorrect. Both trail types use the same high-water mark; only the distance calculation differs.",
        },
        {
          text: "Because you think in fixed price units and want a predictable, constant distance.",
          explanation:
            "Correct. An amount trail holds the same price-unit gap regardless of where the price goes, giving tight predictable risk.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c6-q5",
      prompt:
        "When you set a trailing stop manually in the panel, what does the app show before you create it?",
      options: [
        {
          text: "An Initial stop price preview computed from the current mid price.",
          explanation:
            "Correct. After you toggle trailing and enter a distance, the app previews the initial trigger from the current mid so you can check it.",
        },
        {
          text: "A guaranteed fill price that the stop will execute at later.",
          explanation:
            "Incorrect. Nothing is guaranteed; when the stop fires it crosses to fill at the then-current price.",
        },
        {
          text: "The final high-water mark the stop will reach.",
          explanation:
            "Incorrect. The high-water mark is unknown in advance; it only develops as the price moves after the stop is created.",
        },
        {
          text: "A list of past trades that hit the same trigger.",
          explanation:
            "Incorrect. The panel shows an initial stop price preview, not historical fills.",
        },
      ],
      correctIndex: 0,
    },
  ],
};

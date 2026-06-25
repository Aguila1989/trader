import type { Chapter } from "../../types";

export const chapter09: Chapter = {
  id: "c9",
  number: 9,
  level: "ADVANCED",
  title: "Portfolio Management",
  description:
    "Read your wallet overview, understand trading caps and drawdown, and judge whether your trades are actually working.",
  lessons: [
    {
      id: "c9-l1",
      title: "What is portfolio value and how is it calculated?",
      paragraphs: [
        "Your portfolio value is simply what everything you hold is worth right now, added together. The app computes it by taking each holding, multiplying its balance by that asset's current unit price, and summing the results across all holdings. Because every asset can be priced in two ways, the header shows a total in XLM and a total in USDC side by side.",
        "Prices come from live Stellar markets, so the value moves whenever the markets move. The app re-prices on a timer, so the totals you see are a recent snapshot, not a frozen number. Refreshing or waiting a few seconds can change the figure even if you did nothing.",
        "One important caveat: some assets may show no price. If there is no trading route on the Stellar network to convert that asset into XLM or USDC, the app cannot value it, and that holding contributes nothing to the priced total. Treat such holdings as unknown value rather than zero.",
      ],
      example:
        "Suppose you hold 1000 XLM and 50 USDC. If 1 USDC is worth 8.5 XLM, then your USDC is worth 425 XLM. Your total in XLM is 1000 plus 425, which is 1425 XLM. Going the other way, if 1 XLM is worth about 0.1176 USDC, your 1000 XLM is worth roughly 117.6 USDC, so your total in USDC is 117.6 plus 50, which is about 167.6 USDC. Same wealth, two currencies.",
    },
    {
      id: "c9-l2",
      title: "How to read the wallet overview in this app",
      paragraphs: [
        "The wallet overview lives in the dashboard header. It lists each asset you hold on one row, showing the balance you own, the value of that balance in XLM, and the value of that balance in USDC. Reading across a row tells you how much of an asset you have and what it is worth in both reference currencies.",
        "Below or beside the rows you will find the totals: total portfolio value in XLM and total portfolio value in USDC. These are the sums described in the previous lesson. Glance here first to gauge your overall standing before drilling into any single position.",
        "Watch for rows where a price is missing. That signals there is currently no market route for the asset, so its row may show a balance but no value. Do not mistake a missing price for a worthless asset; it just means the app cannot value it right now, and the totals exclude it.",
      ],
      example:
        "Imagine three rows: XLM with a balance of 2000 worth 235 USDC, USDC with a balance of 100 worth 100 USDC, and an obscure token with a balance of 500 but a blank value because no route exists. The total in USDC shows about 335, which counts only the XLM and USDC rows. The 500 obscure tokens are held but uncounted, so your real worth is at least 335 plus whatever they would fetch.",
    },
    {
      id: "c9-l3",
      title: "What is a trading cap and why does the AI have one?",
      paragraphs: [
        "A trading cap is a ceiling the AI places on how much capital it will commit. There are two layers: a maximum amount per single trade, and a maximum total open exposure across all positions at once. The per-trade cap is higher for blue-chip stablecoin pairs, which are deeper and safer, and lower for thinner or riskier pairs.",
        "The purpose is risk control. Caps stop a single confident-looking signal from betting the whole wallet, and the exposure cap stops many small trades from quietly adding up to a dangerous total. Together they bound the most you can lose if the market turns against every open position at the same time.",
        "Manual orders work differently. When you place a trade yourself, you bypass the AI size, volume, and exposure caps, because you are taking direct responsibility for sizing. Manual orders still face the safety gates, so reckless or clearly broken orders are still blocked, but the prudent sizing limits are yours to set.",
      ],
      example:
        "Say the AI per-trade cap is 200 USDC for a stablecoin pair and the total exposure cap is 500 USDC. With 350 USDC already committed across two open positions, the AI has 150 USDC of headroom left. A fresh signal that wants 200 USDC will be trimmed to 150 to respect the exposure cap. You, placing the same trade manually, could enter the full 200 if you chose, though you would carry that extra risk yourself.",
    },
    {
      id: "c9-l4",
      title: "What is drawdown and how to manage it?",
      paragraphs: [
        "Drawdown is the drop from a peak portfolio value to a later trough. If your portfolio reached a high point and then fell, the drawdown is how far below that high you currently sit, usually expressed as a percentage. It measures pain, not just a number, because deep drawdowns are hard to recover from.",
        "This app helps manage drawdown automatically through a daily loss budget. As losses accumulate during the day, position sizes are tapered down, scaling from full size at roughly 100 percent of budget remaining toward about 25 percent as the budget is spent. The bot bets less precisely when it is already losing.",
        "If the daily loss budget is fully consumed, the bot halts new entries until the next day and allows only risk-reducing exits, meaning it can still close or trim positions to cut risk but cannot open fresh ones. This circuit breaker prevents a bad day from spiralling into a catastrophic one.",
      ],
      example:
        "Your portfolio peaks at 1000 USDC, then slides to 850 USDC. The drawdown is 150 USDC, or 15 percent. Recovering needs more than a 15 percent gain: from 850 you must rise about 17.6 percent to get back to 1000, because gains compound on a smaller base. That asymmetry is exactly why the loss budget tapers sizing and eventually halts entries before the hole gets deeper.",
    },
    {
      id: "c9-l5",
      title: "How to evaluate if your trades are performing well",
      paragraphs: [
        "Start with realized versus unrealized profit and loss. The app tracks daily realized PnL, which is money actually locked in by closed trades, and unrealized PnL, which is the mark-to-market gain or loss on positions you still hold. A pretty unrealized number is only a promise until you close the position and it becomes realized.",
        "Use the stats and evolution charts to see the trend rather than a single moment. A jagged line that keeps making new highs is healthier than a smooth line drifting down. Pair this with the drawdown view to judge how much pain you endured to earn those returns.",
        "Finally, judge the bot and yourself separately. The history table is split into Manual and Bot trades for exactly this reason. Comparing the two lets you see whether your manual instincts beat the AI, or whether the AI is quietly outperforming your hand-placed orders, so you can lean on whichever is genuinely working.",
      ],
      example:
        "Over one day the Bot tab shows ten closed trades with 12 USDC realized profit and an open position up 5 USDC unrealized. The Manual tab shows three trades with 4 USDC realized loss. Total realized is 8 USDC up, but the split reveals the bot earned 12 while your manual trades lost 4. The honest read is to let the bot keep working and review why your manual entries underperformed.",
    },
  ],
  quiz: [
    {
      id: "c9-q1",
      prompt:
        "You hold 1000 XLM and 50 USDC, and 1 USDC is worth 8.5 XLM. What is your total portfolio value in XLM?",
      options: [
        {
          text: "1050 XLM",
          explanation:
            "Incorrect. This just adds the two balances as if 1 USDC equalled 1 XLM, ignoring the price.",
        },
        {
          text: "1425 XLM",
          explanation:
            "Correct. The 50 USDC is worth 50 times 8.5, which is 425 XLM, added to 1000 XLM gives 1425 XLM.",
        },
        {
          text: "8500 XLM",
          explanation:
            "Incorrect. This prices only the USDC at the wrong scale and drops the 1000 XLM entirely.",
        },
        {
          text: "425 XLM",
          explanation:
            "Incorrect. This is just the value of the USDC portion and forgets to add the 1000 XLM.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q2",
      prompt:
        "In the wallet overview, an asset shows a balance but its value column is blank. What does this mean?",
      options: [
        {
          text: "The asset is worthless and counts as zero in your totals.",
          explanation:
            "Incorrect. A blank value is not the same as zero value; the app simply cannot price it.",
        },
        {
          text: "There is currently no market route to price it, so it is excluded from the priced totals.",
          explanation:
            "Correct. With no trading route to XLM or USDC the app cannot value it, and the totals leave it out even though you still hold it.",
        },
        {
          text: "Your balance for that asset is zero.",
          explanation:
            "Incorrect. The balance column shows a real holding; only the value is missing.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q3",
      prompt: "Why does the AI enforce a per-trade cap and a total open exposure cap?",
      options: [
        {
          text: "To bound risk so no single signal bets the whole wallet and many trades cannot quietly add up to a dangerous total.",
          explanation:
            "Correct. The per-trade cap limits one bet and the exposure cap limits the combined risk of all open positions.",
        },
        {
          text: "To guarantee every trade is profitable.",
          explanation:
            "Incorrect. Caps limit how much is at risk; they cannot make any trade profitable.",
        },
        {
          text: "To force you to use manual orders for large trades.",
          explanation:
            "Incorrect. Manual orders do bypass these caps, but that is a consequence, not the purpose of the caps.",
        },
        {
          text: "To speed up how often the bot scans the market.",
          explanation:
            "Incorrect. Caps govern capital at risk, not scan frequency.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q4",
      prompt:
        "Your portfolio peaked at 1000 USDC and is now at 850 USDC. What is the drawdown, and what happens as the daily loss budget is consumed?",
      options: [
        {
          text: "Drawdown is 15 percent, and as the budget is spent position sizes taper down and new entries eventually halt.",
          explanation:
            "Correct. Drawdown is the 150 USDC drop from the 1000 peak, or 15 percent, and the loss budget scales sizing from about 100 percent toward 25 percent before halting new entries.",
        },
        {
          text: "Drawdown is 15 percent, and the bot increases position sizes to recover faster.",
          explanation:
            "Incorrect. The drawdown figure is right, but the bot tapers sizes down as losses mount, it does not bet bigger.",
        },
        {
          text: "Drawdown is the 850 USDC you still hold, and nothing changes in sizing.",
          explanation:
            "Incorrect. Drawdown is the drop from the peak, not the remaining balance, and the loss budget does change sizing.",
        },
      ],
      correctIndex: 0,
    },
  ],
};

import type { Chapter } from "../../types";

export const chapter07: Chapter = {
  id: "c7",
  number: 7,
  level: "ADVANCED",
  title: "Target Price and Invalidation Price",
  description: "Set a profit target and a stop level, and learn how their reward/risk ratio decides if the bot lets a trade through.",
  lessons: [
    {
      id: "c7-l1",
      title: "What is a target price?",
      paragraphs: [
        "A target price is the price at which you plan to take profit. In the Manual Trading order form, you set it under the Advanced section in the optional Target price field. The app tooltip describes it plainly: the price at which you want to take profit, and the bot will automatically close the position when this price is reached.",
        "The target is your reward side of the trade. For a buy, it sits above your entry, because you profit when the price rises to meet it. The distance from your entry up to your target is the reward you are aiming to capture.",
        "Setting a target turns a vague hope into a concrete exit. Instead of watching the chart and reacting emotionally, you decide in advance where the idea has paid off, and the bot acts for you when that level prints. This keeps your exits disciplined and consistent.",
      ],
      example: "You buy XLM at 0.118 USDC and you expect a move up to 0.130. You enter 0.130 as the Target price. The reward you are aiming for is the distance from entry to target, 0.130 minus 0.118, which is 0.012 per unit. If the price reaches 0.130, the bot closes the position and books that gain for you, without you needing to watch the screen.",
    },
    {
      id: "c7-l2",
      title: "What is an invalidation price?",
      paragraphs: [
        "An invalidation price is the level where your trade idea is proven wrong. You set it in the same Advanced section, in the optional Invalidation price field. The app tooltip explains it directly: if the price drops to this level, the trade idea is considered invalid, and it is typically used to set a stop loss.",
        "The invalidation is your risk side of the trade. For a buy, it sits below your entry, because the idea fails if the price falls instead of rising. The distance from your entry down to your invalidation is the risk you are accepting if you are wrong.",
        "Naming the level where you are wrong is what separates a trade from a gamble. Once the price breaches it, holding on is just hoping. The monitor watches your open positions and proposes a close when the invalidation level is breached, so the loss is capped at the size you chose up front.",
      ],
      example: "You buy XLM at 0.118 USDC. Your idea depends on support at 0.114 holding, so you enter 0.114 as the Invalidation price. The risk you are accepting is the distance from entry to invalidation, 0.118 minus 0.114, which is 0.004 per unit. If the price drops to 0.114, the support has failed, the idea is invalid, and the monitor proposes closing the position to stop the bleeding.",
    },
    {
      id: "c7-l3",
      title: "How target price and invalidation price work together",
      paragraphs: [
        "Target and invalidation are two halves of one plan. The target measures your reward, the distance from entry up to it. The invalidation measures your risk, the distance from entry down to it. Dividing reward by risk gives the reward/risk ratio, the single number that tells you whether a trade is worth taking.",
        "The bot enforces a minimum reward/risk ratio, which defaults to 1.2. Reward divided by risk must exceed that minimum, or the trade is blocked with a policy violation. For a buy this also requires that the target is above entry and the invalidation is below entry, so the two distances make sense.",
        "This check protects you from lopsided trades where you risk a lot to make a little. Even a strategy that is right only half the time can be profitable if its winners are larger than its losers, and the ratio is how the bot guarantees that shape before any capital is committed.",
      ],
      example: "You buy at 0.118, target 0.130, invalidation 0.114. Reward is 0.130 minus 0.118, which is 0.012. Risk is 0.118 minus 0.114, which is 0.004. The ratio is 0.012 divided by 0.004, which is 3.0, comfortably above the 1.2 minimum, so the trade is allowed. If you instead set the target at 0.1184, reward would be 0.0004 against 0.004 of risk, a ratio of 0.1, and the bot would block it.",
    },
    {
      id: "c7-l4",
      title: "How to set them correctly for a trade",
      paragraphs: [
        "Set the invalidation first, not the target. Choose it from the chart, at the level that would genuinely prove your idea wrong, such as just below a support that you expect to hold. Anchoring the stop to real structure, rather than to how much you wish to lose, keeps it honest.",
        "Next pick a target that a realistic move can actually reach, ideally near resistance or a prior high. Then compute reward divided by risk and confirm it clears the 1.2 minimum. If it does not, the fix is not to widen the target arbitrarily, but to find a better entry or a tighter, still-valid invalidation.",
        "A common mistake is dragging the target far away just to pass the ratio check. That produces a number the market is unlikely to hit. The ratio is a filter, not a goal; both levels must remain prices the market can plausibly trade through.",
      ],
      example: "You want to buy XLM near 0.118. Support sits at 0.115, so you set invalidation at 0.115, giving 0.003 of risk. To clear the 1.2 minimum you need at least 0.0036 of reward, so a target of 0.1216 or higher qualifies. You see resistance at 0.124, so you set the target there, giving 0.006 of reward, a ratio of 2.0, a clean and realistic trade.",
    },
    {
      id: "c7-l5",
      title: "How the AI uses target price and invalidation price in proposals",
      paragraphs: [
        "When the AI analyst generates a trade proposal, it does not just pick a direction. Each proposal already includes a targetPrice and an invalidationPrice, so the idea arrives with its profit exit and its stop level fully specified. The invalidationPrice is the analyst's own stop, the price at which it would abandon the idea.",
        "Because the proposal carries both levels, the same reward/risk check applies to it. The bot can confirm the analyst's idea clears the minimum ratio before the proposal becomes an executable order, applying one consistent rule to manual and AI-driven trades alike.",
        "Once a position is open, the monitor uses the invalidation level continuously. It watches the open position and proposes a close if the position breaches its invalidation, so the analyst's stop is actually enforced in the market rather than just being a suggestion on paper.",
      ],
      example: "The analyst proposes buying XLM at 0.118 with targetPrice 0.128 and invalidationPrice 0.114. Reward is 0.010, risk is 0.004, a ratio of 2.5 that clears the 1.2 minimum, so the proposal is valid. You approve it and the position opens. Later the price slides to 0.114, the invalidation is breached, and the monitor proposes closing the position, enforcing the analyst's own stop.",
    },
  ],
  quiz: [
    {
      id: "c7-q1",
      prompt: "In the Manual Trading form, what does the Target price field do for a buy position?",
      options: [
        { text: "It sets the price at which you want to take profit, and the bot closes the position automatically when that price is reached.", explanation: "Correct. This matches the app tooltip exactly: the target is your take-profit level and the bot closes the position when it is reached." },
        { text: "It sets the price below entry where the trade idea is considered invalid.", explanation: "Incorrect. That describes the invalidation price, the stop level below entry, not the target." },
        { text: "It tells the bot the maximum amount of capital to commit to the trade.", explanation: "Incorrect. Target price is an exit level, not a position-sizing or capital limit setting." },
        { text: "It sets the slippage tolerance the order will accept.", explanation: "Incorrect. Slippage is a separate concern; the target price is purely your profit-taking exit level." },
      ],
      correctIndex: 0,
    },
    {
      id: "c7-q2",
      prompt: "What does the invalidation price represent?",
      options: [
        { text: "The price at which you take profit on a winning trade.", explanation: "Incorrect. That is the target price; invalidation is about the idea failing, not succeeding." },
        { text: "The average price of all your past trades on this token.", explanation: "Incorrect. Invalidation is a forward-looking stop level for this trade, not a historical average." },
        { text: "The level where, if the price drops to it, the trade idea is considered invalid; it is typically used as a stop loss.", explanation: "Correct. This is the app tooltip definition: hitting it means the idea has failed, and it serves as your stop loss." },
      ],
      correctIndex: 2,
    },
    {
      id: "c7-q3",
      prompt: "You buy at 0.120, set a target of 0.126 and an invalidation of 0.114. With the default minimum reward/risk ratio of 1.2, what happens?",
      options: [
        { text: "The trade is blocked, because the reward of 0.006 is smaller than the risk of 0.006.", explanation: "Incorrect. Reward is 0.126 minus 0.120 = 0.006 and risk is 0.120 minus 0.114 = 0.006, so they are equal, not smaller." },
        { text: "The trade is blocked, because the ratio is 1.0, which does not exceed the 1.2 minimum.", explanation: "Correct. Reward 0.006 divided by risk 0.006 is 1.0, below the 1.2 minimum, so the bot blocks it with a policy violation." },
        { text: "The trade is allowed, because both a target and an invalidation were provided.", explanation: "Incorrect. Providing both levels is necessary but not sufficient; the ratio must still exceed the minimum, and 1.0 does not." },
        { text: "The trade is allowed, because the ratio of 1.0 is close enough to 1.2.", explanation: "Incorrect. The ratio must exceed the minimum; 1.0 is below 1.2 and the bot does not round it up." },
      ],
      correctIndex: 1,
    },
    {
      id: "c7-q4",
      prompt: "How does the AI analyst use target and invalidation prices?",
      options: [
        { text: "It includes a targetPrice and an invalidationPrice in each proposal, and the monitor proposes a close if an open position breaches its invalidation.", explanation: "Correct. The analyst specifies both levels per proposal, the invalidation is its stop, and the monitor enforces it by proposing a close on a breach." },
        { text: "It ignores these levels because they are only meaningful for manual trades.", explanation: "Incorrect. The analyst sets both levels itself in every proposal; they are not manual-only." },
        { text: "It sets only a target price and leaves the stop entirely to the user.", explanation: "Incorrect. The proposal includes an invalidationPrice as the analyst's own stop, not just a target." },
        { text: "It uses them only to colour the chart and never acts on them.", explanation: "Incorrect. The monitor actively proposes closing a position when its invalidation level is breached, so the levels drive action." },
      ],
      correctIndex: 0,
    },
  ],
};

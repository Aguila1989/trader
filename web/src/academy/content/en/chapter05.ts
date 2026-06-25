import type { Chapter } from "../../types";

export const chapter05: Chapter = {
  id: "c5",
  number: 5,
  level: "ADVANCED",
  title: "Stop Losses",
  description: "How stop losses cap downside, how to set one manually, how the AI manages them, and what happens the moment a stop fires.",
  lessons: [
    {
      id: "c5-l1",
      title: "What is a stop loss and why use one?",
      paragraphs: [
        "A stop loss is a pre-set exit. You decide in advance the worst price you are willing to accept, and the bot watches the market for you. The moment the market reaches that level, it closes the position so a small loss never quietly grows into a large one. The whole point is to remove emotion and reaction time from the decision while you are asleep or away from the dashboard.",
        "A stop is direction-aware. For a long position, meaning you actually hold the asset, the stop sits below the current price and fires when the price falls to or touches the trigger. This protects the value you are already holding rather than chasing new entries.",
        "Stops are not free insurance. Place the trigger too close to the price and normal noise will knock you out; place it too far and you absorb a bigger loss. The app also keeps a backstop stop-loss percent as a default safety net, so even an unguarded position has a floor.",
      ],
      example: "You hold 1,000 XLM bought at 0.118 USDC. You set a stop trigger at 0.112 USDC. While XLM drifts between 0.118 and 0.114 nothing happens. If a sell-off drags the price down to 0.112, the stop fires and the bot exits, capping your loss at about 6 USDC instead of riding it down to 0.100, which would have cost roughly 18 USDC.",
    },
    {
      id: "c5-l2",
      title: "How to set a stop loss in this app (manual)",
      paragraphs: [
        "Open the stop-loss panel and use the Manual stop losses section. There is a toggle between Regular Stop Loss, a fixed trigger price, and Trailing Stop Loss, which follows the price upward and is covered in the next chapter. For a manual stop, choose Regular.",
        "Fill in the four fields. Pick the Token you hold and the Quote you are pricing against, usually USDC. Enter the Trigger price, the level at which you want out. Then choose how much to close: Sell all liquidates the whole holding, or set a specific Quantity to exit only part and keep the rest exposed.",
        "Once saved, the stop appears in the manual list with a Cancel button. It does nothing until the price reaches the trigger; cancelling it removes the protection immediately. You can hold several stops on the same pair at once, for example a partial stop higher up and a full backstop lower down.",
      ],
      example: "You hold 2,000 XLM and want to protect most of it. Toggle to Regular Stop Loss, set Token XLM, Quote USDC, Trigger 0.110, and Quantity 1,500 rather than Sell all. If XLM falls to 0.110 the bot sells 1,500 XLM and you keep 500 XLM still in the market. The stop then shows in the manual list, where you can Cancel it if you change your mind.",
    },
    {
      id: "c5-l3",
      title: "How the AI sets and manages stop losses automatically",
      paragraphs: [
        "Alongside manual stops, the AI can place its own. These show up in a separate AI stop losses section, and crucially each one carries a notes column explaining the AI reasoning, such as why it chose that trigger level for that position. You are never left guessing what an automated stop is protecting against.",
        "The AI uses the same machinery as you. It picks a token, a quote, a trigger and a quantity, and the result is a real stop sitting in a list you can read. The difference is that the AI sizes the trigger from its own read of volatility and risk rather than from a number you typed.",
        "AI stops are not locked away from you. Every AI stop in the list has a Cancel button, exactly like a manual one, so you stay in control. If you disagree with the AI level you can cancel it and set your own, or leave the AI stop in place as an extra layer underneath your manual one.",
      ],
      example: "After you buy 1,000 XLM at 0.118, the AI adds its own stop at 0.113 with the note Recent 24h range bottom near 0.114, placing stop just below support. You read that reasoning in the notes column, agree it is sensible, and leave it. Had the note read trigger set at 0.117, dangerously tight, you could click Cancel and replace it with a wider one of your own.",
    },
    {
      id: "c5-l4",
      title: "What is the difference between a manual and an AI stop loss?",
      paragraphs: [
        "Mechanically they are identical. Both are direction-aware triggers, both pass through every safety gate when they fire, and both appear in a list with a Cancel button. The difference is only who chose the numbers and where the stop is listed.",
        "A manual stop reflects your judgement: you typed the trigger and quantity, so it is exactly as tight or loose as you decided. An AI stop reflects the model judgement and comes with a written rationale in its notes column, which a manual stop does not have. They live in separate sections, Manual stop losses and AI stop losses, so you can tell at a glance which is which.",
        "Because they are independent, they can coexist and even overlap. Running both is a common pattern: your manual stop expresses your personal risk limit, while the AI stop acts as a second opinion or a deeper backstop. Cancelling one never touches the other.",
      ],
      example: "On the same 1,000 XLM you set a manual stop at 0.110 because that is your comfort line. The AI independently sets its stop at 0.113 with a note about support. Both sit in their own lists. If XLM slides, the AI stop at 0.113 fires first; if that one had been cancelled, your manual 0.110 would still catch the fall. Each has its own Cancel button.",
    },
    {
      id: "c5-l5",
      title: "What happens when a stop loss triggers — step by step",
      paragraphs: [
        "First, the position monitor detects that the market price has breached your trigger. It does not wait for a candle to close; the breach itself starts the exit. The bot then submits an aggressive closing order, priced to cross the current best price so it fills now. It deliberately does not rest passively next to a falling market, because a falling market would leave a passive order unfilled while losses mount.",
        "That closing order is still a real trade, so it passes every safety gate: the kill switch, the whitelist, slippage limits and the balance pre-check. Because closing a position reduces risk, the exit auto-executes immediately even in approve-every-trade mode. A stop is never stranded waiting for a human to click approve.",
        "If liquidity is thin the order may only partially fill. The remainder rests, and the stop can re-trigger to finish the job, throttled to roughly once every five minutes per pair so it does not spam orders. The one thing that stops a stop is the kill switch, which blocks all trading including exits, so an engaged kill switch means your stop is recorded but will not fire.",
      ],
      example: "Your stop on 1,000 XLM is set at 0.112. Price prints 0.1119, breaching it. The monitor fires and the bot sends a sell crossed against the current best bid near 0.1118 so it executes at once, clearing the slippage and balance checks. Only 600 XLM fill against available bids; the other 400 rest. About five minutes later, with price still under 0.112, the stop re-triggers and closes the remaining 400.",
    },
  ],
  quiz: [
    {
      id: "c5-q1",
      prompt: "What is the main purpose of a stop loss?",
      options: [
        { text: "To automatically buy more of an asset when its price rises.", explanation: "Incorrect. A stop loss for a long position is an exit that sells, not a buy order that adds to a winning position." },
        { text: "To pre-set an exit that caps a loss by closing the position once the price reaches a chosen level.", explanation: "Correct. The trigger is decided in advance so a small loss cannot quietly grow into a large one, with no reaction time needed from you." },
        { text: "To guarantee you always sell at the highest possible price.", explanation: "Incorrect. A stop protects the downside; it does not capture peaks and a too-tight stop can even exit you during normal noise." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q2",
      prompt: "When setting a manual Regular Stop Loss, which fields do you provide?",
      options: [
        { text: "Only a percentage drop; the app fills in everything else.", explanation: "Incorrect. A fixed percentage is the backstop default safety net, not what you enter for a manual Regular stop." },
        { text: "Token, Quote, a Trigger price, and either Sell all or a specific Quantity.", explanation: "Correct. You pick the asset and its quote, the trigger level, and how much to close, choosing Sell all or a partial Quantity." },
        { text: "A buy price and a sell price that the bot averages together.", explanation: "Incorrect. A Regular stop is a single trigger price for an exit, not a pair of prices to average." },
        { text: "Just the Token; the AI decides the trigger for you.", explanation: "Incorrect. That describes an AI stop. A manual stop requires you to set the trigger and quantity yourself." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q3",
      prompt: "How does an AI stop loss differ from a manual one?",
      options: [
        { text: "AI stops cannot be cancelled, while manual ones can.", explanation: "Incorrect. Every AI stop has a Cancel button in its list, exactly like a manual stop." },
        { text: "AI stops skip the safety gates that manual stops must pass.", explanation: "Incorrect. Both kinds pass every safety gate when they fire; the mechanics are identical." },
        { text: "The AI chose the numbers and the stop is listed separately with a notes column showing its reasoning.", explanation: "Correct. Mechanically they are identical; the difference is who set the trigger and that AI stops carry a written rationale in their own section." },
      ],
      correctIndex: 2,
    },
    {
      id: "c5-q4",
      prompt: "When a stop loss triggers, how does the bot place the closing order?",
      options: [
        { text: "It submits an aggressive order priced to cross the current best price so it fills now.", explanation: "Correct. The bot does not rest passively next to a falling market; it crosses the spread to execute immediately and cap the loss." },
        { text: "It rests a passive order at the trigger price and waits for a buyer.", explanation: "Incorrect. Resting passively in a falling market would leave the order unfilled while losses mount, which is what the bot avoids." },
        { text: "It cancels the position instantly with no order sent to the market.", explanation: "Incorrect. Closing still means submitting a real order that fills against the order book and passes the safety checks." },
        { text: "It waits for a human to approve the exit before doing anything.", explanation: "Incorrect. Risk-reducing closes auto-execute immediately even in approve-every-trade mode, so a stop is never stranded." },
      ],
      correctIndex: 0,
    },
    {
      id: "c5-q5",
      prompt: "What happens to your stop losses while the kill switch is engaged?",
      options: [
        { text: "Stops fire as normal because exits are exempt from the kill switch.", explanation: "Incorrect. The kill switch blocks all trading including stop-loss exits, so exits are not exempt." },
        { text: "Stops are recorded but will not fire, because the kill switch blocks all trading including exits.", explanation: "Correct. An engaged kill switch halts every order, so a breached trigger is logged but no closing order is sent until you disengage it." },
        { text: "All stops are permanently deleted the moment the kill switch turns on.", explanation: "Incorrect. The stops remain recorded; they are simply suspended until the kill switch is released." },
      ],
      correctIndex: 1,
    },
  ],
};

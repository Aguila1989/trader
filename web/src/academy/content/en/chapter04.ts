import type { Chapter } from "../../types";

export const chapter04: Chapter = {
  id: "c4",
  number: 4,
  level: "BASIC",
  title: "Risk Basics",
  description: "What risk, volatility, and loss mean, and the simple habits that keep them small.",
  lessons: [
    {
      id: "c4-l1",
      title: "What is trading risk?",
      paragraphs: [
        "Risk is simply the chance that a trade loses money instead of making it. Every trade has two possible futures: the price moves your way, or it moves against you. Nobody can know in advance which one happens, so risk is always present. The goal is never to remove risk completely, only to keep it small enough that one bad trade cannot hurt you badly.",
        "This bot is built around that idea. It enforces a maximum amount per trade, a maximum number of trades per day, and a maximum total open exposure. These limits put a ceiling on how much can go wrong at once, even if several trades turn out badly.",
        "A useful way to think about risk is: what is the most I could lose here, and can I live with that number? If the honest answer makes you uncomfortable, the position is too big. Shrinking the size is the easiest way to shrink the risk.",
      ],
      example: "You hold 1000 XLM worth about 100 USDC. You set the maximum per trade to 10 USDC. Even if a single trade went completely wrong, only that 10 USDC slice is exposed, so your worst case on one trade is roughly a tenth of your wallet, not all of it. The other 90 USDC stays untouched and ready for better moments.",
    },
    {
      id: "c4-l2",
      title: "What is volatility and why is it risky?",
      paragraphs: [
        "Volatility means how much and how fast a price jumps around. A bank savings balance barely moves, so it has almost no volatility. Crypto is the opposite: XLM can rise or fall several percent in a single day, sometimes within hours. That movement is exactly why people trade it, and also exactly why it is risky.",
        "High volatility cuts both ways. The same swing that could grow your position can shrink it just as quickly. If you are not watching, a sharp move can turn a small paper gain into a real loss before you react.",
        "The dashboard helps you feel this. It prices your whole wallet in both XLM and USDC, so you can watch the total value rise and fall in real time. Seeing those numbers move is the clearest way to understand that volatility is not abstract, it is your money changing size.",
      ],
      example: "Say XLM is worth 0.100 USDC in the morning. By the afternoon it drops 5 percent to 0.095 USDC. If you held 2000 XLM, your stack fell from 200 USDC to 190 USDC, a 10 USDC swing in a few hours with no action on your part. That speed is volatility, and it is why position size and stop losses matter.",
    },
    {
      id: "c4-l3",
      title: "What is a loss and how do you limit it?",
      paragraphs: [
        "A loss happens when you end up with less value than you started with, usually because you bought and the price then fell, or sold and it rose. Losses are a normal, unavoidable part of trading. The skill is not avoiding them entirely, it is keeping each one small so your account survives to trade another day.",
        "This bot limits losses in several layered ways. A daily loss budget automatically shrinks your position sizes as losses pile up during the day, so a bad streak gets quieter instead of louder. There is also a maximum daily volume and a maximum trades per day, which stop you from over-trading when things go wrong.",
        "For a single position you can add a stop loss, covered in detail later, which closes the trade once it falls past a level you choose. Together these tools turn a potentially large, open-ended loss into a small, known one.",
      ],
      example: "You buy 50 USDC of XLM and the price starts sliding. With a stop loss set at 4 percent below entry, the bot sells once you are down about 2 USDC, capping that loss. Meanwhile the daily loss budget notices the red day and trims your next trade from 10 USDC to 5 USDC, so the day cannot snowball.",
    },
    {
      id: "c4-l4",
      title: "Investing only what you can afford to lose",
      paragraphs: [
        "Only invest what you can afford to lose means putting in money that, if it vanished entirely, would not change your life. Rent, food, bills, and emergency savings are never trading money. If losing the amount would cause real stress or force you to borrow, it is too much.",
        "This rule matters because volatility is real and losses do happen. People who trade with money they cannot spare tend to panic, hold losing trades too long hoping they recover, or chase losses with bigger bets. Money you can genuinely afford to lose lets you make calm, rational decisions instead.",
        "The bot supports this mindset directly. It boots in read-only mode and offers a paper trading mode that is fully simulated with no real funds, so you can practice and learn the feel of risk before a single real coin is at stake.",
      ],
      example: "Imagine you have 1000 USDC of savings but need 900 of it for rent and emergencies. Affordable-to-lose money here might be 50 USDC, not the full 1000. You fund the bot with that 50, set the per-trade cap low, and start in paper mode first. If it all disappeared, your rent and safety net would still be completely intact.",
    },
    {
      id: "c4-l5",
      title: "What is diversification?",
      paragraphs: [
        "Diversification means not putting all your money into one thing. If everything you own is a single token and that token crashes, you lose across the board at the same moment. Spreading value across several holdings means a fall in one is cushioned by the others.",
        "A simple first step is holding more than one asset. This bot prices your wallet in both XLM and USDC, and USDC is a stablecoin designed to stay near one dollar, so it barely moves. Keeping part of your wallet in USDC gives you a calm anchor while the rest rides the more volatile XLM.",
        "Diversification is not magic and does not remove risk, but it smooths the bumps. Combined with the bot's exposure limits, it stops any one position from deciding your whole outcome, which keeps both your money and your nerves steadier.",
      ],
      example: "Suppose you put all 100 USDC of value into XLM and it drops 8 percent overnight; you are down 8 USDC with nothing to soften it. If instead you held 50 USDC in XLM and 50 USDC in stable USDC, the same 8 percent XLM drop costs only 4 USDC, because half your wallet never moved. Same market, half the pain.",
    },
  ],
  quiz: [
    {
      id: "c4-q1",
      prompt: "In trading, what does risk actually mean?",
      options: [
        {
          text: "A guarantee that you will lose money on every trade",
          explanation: "Incorrect. Risk is not a guarantee of loss; it is the chance that a trade goes against you, and many trades work out fine.",
        },
        {
          text: "The chance that a trade loses money instead of making it",
          explanation: "Correct. Risk is the possibility that the price moves against you, which is why the bot caps per-trade size and total exposure.",
        },
        {
          text: "A fee the exchange charges to open a position",
          explanation: "Incorrect. That describes trading costs or spread, not risk. Risk is about uncertain outcomes, not a fixed charge.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c4-q2",
      prompt: "Why is high volatility considered risky?",
      options: [
        {
          text: "Because the price never changes, so you can never sell",
          explanation: "Incorrect. That is the opposite of volatility. Volatility means the price changes a lot, not that it stays still.",
        },
        {
          text: "Because it only ever pushes prices up",
          explanation: "Incorrect. Volatility cuts both ways; the same fast move that can grow a position can shrink it just as quickly.",
        },
        {
          text: "Because prices can swing several percent fast, so value can drop quickly before you react",
          explanation: "Correct. XLM can move several percent in a day, and that speed can turn a paper gain into a real loss before you act.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c4-q3",
      prompt: "Which tool helps cap the loss on a single position?",
      options: [
        {
          text: "A stop loss that closes the trade once it falls past a level you choose",
          explanation: "Correct. A stop loss turns an open-ended loss into a small, known one by exiting at a level you set in advance.",
        },
        {
          text: "Buying more of the token as it keeps falling",
          explanation: "Incorrect. That increases your exposure and your potential loss; it is the chasing-losses behaviour the rules warn against.",
        },
        {
          text: "Turning off the dashboard so you cannot see the price",
          explanation: "Incorrect. Ignoring the price does not limit a loss; it just hides it while the position keeps moving against you.",
        },
        {
          text: "Removing the daily loss budget so trades stay large",
          explanation: "Incorrect. The daily loss budget protects you by shrinking sizes during a bad streak; removing it would increase risk.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c4-q4",
      prompt: "What does only invest what you can afford to lose mean in practice?",
      options: [
        {
          text: "Trade with your rent money because the bot limits losses anyway",
          explanation: "Incorrect. Rent and bills are never trading money; limits reduce risk but never remove it, and essential funds must stay safe.",
        },
        {
          text: "Only fund the bot with money whose total loss would not hurt your life",
          explanation: "Correct. Affordable-to-lose money keeps you calm and rational, which is why the bot also offers paper mode to practice first.",
        },
        {
          text: "Invest everything at once so a single big win covers all risk",
          explanation: "Incorrect. Betting everything ignores diversification and exposure limits, and a single bad move could wipe out the whole wallet.",
        },
      ],
      correctIndex: 1,
    },
  ],
};

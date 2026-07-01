// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Market-microstructure add-on for Chapter 12 ("Advanced Stellar Features").
// These are NOT a standalone Chapter. At green-light, append c12ExtraLessons to
// chapter12.lessons[] (after c12-l5) and c12ExtraQuiz to chapter12.quiz[] (after
// c12-q5). Ids continue the existing numbering: lessons c12-l6/c12-l7, quiz
// c12-q6/c12-q7. The maker/taker lesson uses the live glossary terms "maker" and
// "taker" verbatim so their first occurrence auto-links to a tooltip.
import type { Lesson, QuizQuestion } from "../../../types";

export const c12ExtraLessons: Lesson[] = [
  {
    id: "c12-l6",
    title: "Maker vs taker dynamics and how they affect strategy",
    paragraphs: [
      "Every fill on the SDEX order book has two sides, and the protocol treats them very differently in cost even though it charges neither a percentage fee. The order book is matched by price-then-time priority: at each price level the best price is filled first, and among offers sharing a price the older one is filled ahead of the newer. That single rule is what creates the two roles you must understand before you can reason about strategy at all.",
      "A maker is an offer that rests on the book and waits. When you submit a manageSellOffer or manageBuyOffer at a price that does not cross the current book, it does not execute immediately; it joins the queue at its price level and sits there providing liquidity for someone else to trade against. Because it waited, it earns its price: a resting bid gets filled at the bid, a resting ask at the ask. In effect the maker captures the spread rather than paying it. The cost of being a maker is time and fill risk, since the market can move away before anyone crosses to you and your offer may never fill.",
      "A taker is the mirror image. When you submit an offer priced to cross the existing book, or you simply need an immediate fill, you are lifting the best resting offer on the other side. You get certainty of execution within the next ledger close, but you pay for it by crossing the spread: buying at the ask, selling at the bid. On an edge measured in single-digit basis points, conceding a 10 basis point spread on entry and another on exit can erase the entire theoretical profit of a round trip. This is why the maker/taker distinction is not academic bookkeeping; it is the difference between a spread you earn and a spread you pay.",
      "Strategy follows directly. A spread-capture strategy, which is what this bot runs, wants to be a maker as often as possible, so it is maker-first: it rests its offer at the best bid or ask and lets counterparties cross to it, turning the spread from a cost into a source of edge. It only crosses as a taker when an immediate fill genuinely matters more than the spread, for example to exit a position that has hit its stop. A momentum or news-driven strategy makes the opposite trade-off, accepting the taker's spread cost to guarantee it is in the market before the move continues. Neither role is universally better; the right one depends on whether certainty of fill or price improvement is worth more for the trade in front of you.",
    ],
    example:
      "The XLM/USDC book shows a best bid of 0.1170 and a best ask of 0.1180, a 10 basis point spread. Acting as a taker to buy right now, you lift the ask and pay 0.1180. Acting as a maker, you instead rest a buy offer at 0.1170, joining the bid queue behind any older offers there. When a seller later crosses down to 0.1170 your offer fills at 0.1170 within that ledger close. Same asset, same moment: the taker paid 0.0010 per XLM of spread while the maker captured it, a swing of the full 10 basis point spread between the two roles on a single fill.",
  },
  {
    id: "c12-l7",
    title: "Price impact and how to calculate it for a large order",
    paragraphs: [
      "Price impact is what happens when your order is larger than the liquidity sitting at the best price. On the SDEX the order book is a stack of discrete resting offers at rising (or falling) prices. A small taker order fills entirely against the top level and executes near the quoted price. A large taker order exhausts the top level, then fills the next level at a worse price, then the level after that, walking up the book until the whole quantity is filled. Your average execution price is therefore worse than the price you saw quoted, and the gap between the two is the price impact of your order.",
      "You can estimate impact before you trade directly from the displayed depth, because the book tells you exactly how much size rests at each level. Walk the levels in order, filling your quantity greedily: take everything at the best price, then whatever you still need at the next price, and so on until your order is exhausted. Multiply the quantity taken at each level by that level's price, sum those products, and divide by your total quantity to get your volume-weighted average fill price. Compare that average to the best-price quote you started from and the difference, expressed as a percentage, is your estimated price impact. The deeper the book near the top, the smaller the impact for the same order size; a thin book means even a modest order walks several levels.",
      "Price impact, slippage, and liquidity are three views of the same underlying thing, and it is worth being precise about how they relate. Slippage, covered in \"Understanding Prices\" (Chapter 2), is the difference between the price you expected and the price you actually got; price impact is the specific component of slippage that your own order causes by consuming depth, as opposed to slippage from the market moving between quote and fill. Liquidity is simply how much depth is stacked near the top of the book: deep liquidity absorbs a large order with little impact, thin liquidity does not. \"Token Evaluation on the Stellar Chain\" (Chapter 21) explains how the app sums order-book depth into the liquidity signals it scores tokens on; that summed depth is the very same ladder you walk to estimate impact here.",
      "For a large order the practical response is to reduce the impact rather than accept it. Splitting a big order into smaller pieces over time lets each piece fill nearer the top of a replenishing book instead of walking one deep hole all at once. Resting the order as a maker at a limit price, rather than crossing as a taker, avoids walking the book entirely at the cost of fill certainty. And the app's editable slippage tolerance on the Manual Trading form is your guardrail: it caps how far the fill may drift from the quote, so an order whose estimated impact exceeds your tolerance is rejected before it executes at a price you never intended.",
    ],
    example:
      "You want to buy 5,000 XLM as a taker. The USDC-side ask ladder shows 2,000 XLM offered at 0.1180, 2,000 more at 0.1185, and 3,000 at 0.1195. Your order fills 2,000 at 0.1180, 2,000 at 0.1185, and the final 1,000 at 0.1195, costing 236.0 + 237.0 + 119.5 = 592.5 USDC. Divide by 5,000 and your average fill price is 0.1185, versus the 0.1180 you saw quoted at the top. That is a 0.42 percent price impact, entirely caused by your order walking the book. Splitting it into five 1,000-XLM orders, or resting a limit offer at 0.1180, would each shrink that impact.",
  },
];

export const c12ExtraQuiz: QuizQuestion[] = [
  {
    id: "c12-q6",
    prompt: "In the SDEX order book, what distinguishes a maker from a taker, and why does this bot prefer to be a maker?",
    options: [
      {
        text: "A maker rests an offer on the book and, when someone crosses to it, is filled at its own price and captures the spread; a taker crosses the book for an immediate fill and pays the spread. The bot is maker-first so it earns the spread instead of paying it.",
        explanation:
          "Correct. Under price-then-time priority a resting maker offer is filled at its posted price, turning the spread into earned edge, while a taker lifts the opposite side and concedes the spread for certainty of fill. A spread-capture strategy therefore rests offers maker-first and only takes when an immediate fill matters more than the spread.",
      },
      {
        text: "A maker pays a percentage commission to the exchange while a taker trades for free, so the bot avoids being a maker to dodge the fee.",
        explanation:
          "Incorrect. The SDEX charges no percentage commission to either side, only the tiny per-operation base fee; the real difference is that the taker crosses and pays the spread while the maker rests and captures it, which is exactly why the bot prefers to be a maker.",
      },
      {
        text: "A taker rests on the book and waits while a maker crosses immediately, and the bot prefers the taker role because resting orders never fill.",
        explanation:
          "Incorrect. The roles are reversed: the maker is the one that rests and waits, the taker is the one that crosses immediately. Resting maker orders do fill when a counterparty crosses to them, and the bot is maker-first precisely to capture the spread on those fills.",
      },
      {
        text: "A maker always fills faster than a taker because newest offers are matched first, so the bot chooses maker for speed.",
        explanation:
          "Incorrect. Matching is oldest-first at a given price, not newest-first, and the taker is the role with guaranteed immediate execution. The bot prefers maker for spread capture, accepting slower and uncertain fills, not for speed.",
      },
    ],
    correctIndex: 0,
  },
  {
    id: "c12-q7",
    prompt: "An ask ladder shows 2,000 XLM offered at 0.1180, then 2,000 at 0.1185, then 3,000 at 0.1195. You send a taker buy for 5,000 XLM. How do you estimate the price impact, and what is it?",
    options: [
      {
        text: "Assume the whole order fills at the top price of 0.1180, so the price impact is zero.",
        explanation:
          "Incorrect. Only 2,000 XLM rests at 0.1180. A 5,000-XLM order exhausts that level and walks up to worse levels, so the average fill price is above 0.1180 and the impact is not zero.",
      },
      {
        text: "Walk the ladder greedily, take 2,000 at 0.1180, 2,000 at 0.1185, and 1,000 at 0.1195, giving a volume-weighted average of 0.1185, about 0.42 percent worse than the 0.1180 quote.",
        explanation:
          "Correct. Filling the order across the levels costs 236.0 + 237.0 + 119.5 = 592.5 USDC for 5,000 XLM, an average of 0.1185. Against the 0.1180 top-of-book quote that is roughly a 0.42 percent price impact, the cost of your own order consuming depth as it walks the book.",
      },
      {
        text: "Use only the deepest level, 0.1195, as the fill price, giving about a 1.3 percent impact for the whole 5,000 XLM.",
        explanation:
          "Incorrect. The order does not fill entirely at the worst level; it fills each level in turn until exhausted, so you must volume-weight across 0.1180, 0.1185, and 0.1195. That yields an average of 0.1185 and about 0.42 percent impact, not 1.3 percent.",
      },
    ],
    correctIndex: 1,
  },
];

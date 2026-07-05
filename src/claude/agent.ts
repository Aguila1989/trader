import { type AiMessage, type AiProvider, type AiRequest, type AiTurn } from "../ai";
import { resolveProviderForCurrentUser } from "../ai/userKeys";
import { config } from "../config";
import {
  getBalances,
  getOpenOffers,
  getMarketSnapshot,
  getTradeAggregations,
  summarizeCandles,
  type MarketSnapshot,
} from "../stellar/market";
import { signerPublicKey } from "../stellar/signer";
import { assetCode, canonicalAsset, pairLabel } from "../stellar/assets";
import { effectiveCapForPair } from "../policy/engine";
import { store } from "../trading/store";
import { effectiveLimits, riskProfileSummary } from "../policy/riskProfile";
import type { Limits } from "../policy/engine";
import { baselineCall } from "../trading/explain";
import { DEFAULT_PARAMS } from "../backtest/strategy";
import {
  tradingTools,
  TOOL_BALANCES,
  TOOL_MARKET,
  TOOL_HISTORY,
  TOOL_PROPOSE,
  TOOL_SET_STOP,
  TOOL_UPDATE_STOP,
  TOOL_CANCEL_STOP,
} from "./tools";
import { stopLossService } from "../trading/stopLossService";
import type { PositionSummary, TradeConfidence, TradeSide } from "../types";

export interface ProposedTrade {
  side: TradeSide;
  baseAsset: string;
  quoteAsset: string;
  amount: string;
  limitPrice: string;
  /** Maker intent: when true (the default), the order rests at the touch to
   *  capture the spread and never crosses; when false it crosses as a taker. */
  postOnly?: boolean;
  maxSlippageBps: number;
  reason: string;
  confidence?: TradeConfidence;
  /** Numeric AI conviction 0-100 (the Expert-Mode gate compares against this). */
  confidenceScore?: number;
  targetPrice?: string;
  invalidationPrice?: string;
  horizon?: string;
}

export interface AnalysisResult {
  reasoning: string;
  proposals: ProposedTrade[];
  toolTrace: string[];
}

/**
 * Feedback about how THIS system's own trading has gone so far, handed to the
 * analyst so it can learn from its open exposure and today's realized result.
 * (Quote-denominated; see src/trading/positions.ts for scope/caveats.)
 */
export interface TradingMemory {
  /** Realized PnL accrued TODAY, in XLM (drives MAX_DAILY_LOSS). */
  realizedPnlToday: number;
  /** Mark-to-market PnL of open positions, in XLM (monitor's latest mark). */
  unrealizedPnl: number;
  /** Open positions from this system's own fills (signed-FIFO net). */
  positions: PositionSummary[];
  /** Recent submitted trades with their forward outcome, oldest first. */
  recentOutcomes: RecentOutcome[];
}

/** One past trade + how the market moved after it (the analyst's feedback loop). */
export interface RecentOutcome {
  pair: string;
  side: TradeSide;
  amount: string;
  price: string;
  /** Side-adjusted % move of the mid vs fill at +1h (null = not marked yet). */
  mark1hPnlPct: number | null;
  /** Side-adjusted % move at +24h. */
  mark24hPnlPct: number | null;
}

/** Render the trading memory as a compact context block, or "" when absent. */
function renderMemory(memory?: TradingMemory): string {
  if (!memory) return "";
  const pnl = fmtNum(memory.realizedPnlToday);
  const upnl = fmtNum(memory.unrealizedPnl);
  const positions =
    memory.positions.length === 0
      ? "flat (no open positions from your own trading)"
      : memory.positions
          .map((p) => `${p.pair} net=${fmtNum(p.netQty)} @ avg ${fmtNum(p.avgPrice)}`)
          .join("; ");
  const outcomes =
    memory.recentOutcomes.length === 0
      ? ""
      : `\n- Your recent calls (side-adjusted % move after the trade; + = you were right): ` +
        memory.recentOutcomes
          .map(
            (o) =>
              `${o.side} ${o.pair} @ ${o.price} -> 1h ${fmtPct(o.mark1hPnlPct)}, 24h ${fmtPct(o.mark24hPnlPct)}`,
          )
          .join("; ");
  return `Your trading so far (this system's OWN fills only, XLM-normalized):
- Realized PnL today: ${pnl} XLM; unrealized on open positions: ${upnl} XLM (the backend HALTS new entries once realized + unrealized losses reach ${config.limits.maxDailyLoss} XLM, and tapers your size cap from 50% of that budget).
- Open positions: ${positions}${outcomes}
Use this: avoid piling onto exposure you already hold, consider taking profit / cutting a losing position, learn from calls that went against you, and trade more conservatively as the loss budget burns.`;
}

function fmtPct(p: number | null): string {
  if (p == null) return "pending";
  return `${p >= 0 ? "+" : ""}${p.toFixed(2)}%`;
}

/** Clean decimal for prompt tables: <=7 dp, no trailing zeros. */
function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  return Number(n.toFixed(7)).toString();
}

/** Map the get_price_history resolution arg to a Horizon (width, count) pair. */
function resolutionToParams(res?: string): { ms: number; limit: number } {
  switch (res) {
    case "15m":
      return { ms: 900_000, limit: 48 }; // ~12h
    case "1d":
      return { ms: 86_400_000, limit: 30 }; // ~30d
    case "1h":
    default:
      return { ms: 3_600_000, limit: 24 }; // ~24h
  }
}

/**
 * FIX-PLAN Fix 1: the entry-gate sentence, rendered from the EFFECTIVE limits.
 * Degenerate values render honestly: minVolume24h 0 = "no volume floor at your
 * current risk profile"; maxEntrySpreadBps 0 = spread block omitted (0 =
 * disabled, per effectiveMaxEntrySpreadBps).
 */
function entryGateLine(limits: Limits, chain: boolean): string {
  const gates: string[] = [];
  if (limits.maxEntrySpreadBps > 0) gates.push(`the spread exceeds ${limits.maxEntrySpreadBps}bps`);
  if (limits.minVolume24h > 0) gates.push(`24h volume is under ${limits.minVolume24h}${chain ? " XLM" : ""}`);
  const noFloor = limits.minVolume24h <= 0 ? " There is no volume floor at your current risk profile." : "";
  if (gates.length === 0) {
    return `- There is no entry-spread block or volume floor at your current risk profile - judge book quality yourself before proposing.`;
  }
  return `- The backend ${chain ? "BLOCKS" : "also blocks"} entries when ${gates.join(" or ")} - don't waste proposals on ${chain ? "those books" : "illiquid books"}.${noFloor}`;
}

/** FIX-PLAN Fix 2: the deterministic playbook's actual trigger numbers, sourced
 *  from DEFAULT_PARAMS so the prompt can never drift from the divergence logger. */
function rulebookLine(): string {
  const p = DEFAULT_PARAMS;
  return `- "rulebook=" on a market line is the deterministic playbook's mechanical read of the same indicators (range edges at <=${p.rangeLowPos}/>=${p.rangeHighPos} with RSI <=${p.rangeBuyRsi}/>=${p.rangeSellRsi}; trend pullback/bounce at RSI ${p.trendPullbackRsi}/${p.trendBounceRsi}). Treat a rulebook signal as a candidate trade to confirm or reject against the order book and your exposure - if you reject it, say why.`;
}

/** FIX-PLAN Fix 1: the closing line that stops instructed conservatism from
 *  overriding the operator's risk dials. */
const LIMITS_ARE_EFFECTIVE =
  "These limits already reflect the operator's risk profile - do not apply a stricter bar than stated.";

/**
 * FIX-PLAN Fix 1: was a module-level constant frozen at import with BASE
 * config.limits - at all-HIGH risk it claimed constraints 3-6x tighter than
 * actually enforced (50bps slippage vs 300, 100bps spread vs 300, a volume
 * floor that was removed), and runtime Settings edits never reached it. Now
 * rendered per invocation from the same effectiveLimits object the policy
 * engine enforces. Stable within one tool loop, so prompt caching still works.
 */
export function systemPrompt(limits: Limits): string {
  return `You are a cautious trading analyst on the Stellar ${config.network} network.

Your job: look at live data, then EITHER propose exactly one well-justified trade via the propose_stellar_trade tool, OR explain in plain text why you would not trade right now.

Hard rules:
- You never hold keys and never execute. You only propose. A separate backend enforces risk limits and (unless auto-trade is on) a human approves every trade; low-confidence proposals are always held for review.
- Only trade assets on the operator's whitelist: ${limits.assetWhitelist.join(", ")}.
- Keep any single trade at or below the "Per-trade size cap" stated in the request below (it depends on the pair's risk tier - blue-chip stablecoin pairs allow a larger clip - and shrinks as the daily loss budget burns). Never exceed it.
- Keep slippage at or below ${limits.maxSlippageBps} bps and set max_slippage_bps accordingly.
- Always ground your decision in fresh data before proposing: get_account_balances (holdings AND your open offers, for sizing and exposure), get_market (orderbook, spread, depth) AND get_price_history (trend, volatility, 24h range).
- The data includes SERVER-COMPUTED indicators - use them instead of estimating: rsi14, ema8 vs ema24 (trend direction), atrPct/realizedVolPct (volatility), efficiencyRatio, rangePos (0=at the low, 1=at the high), volRatio, flowBuyPct (taker buy pressure) and a regime tag.
- Adapt the playbook to the regime: "trending-up"/"trending-down" -> trade WITH the trend on pullbacks, never fade it; "ranging" -> mean-reversion entries near the range edges (rangePos near 0 or 1) only; "volatile" -> stand aside or halve your size, spreads and slippage eat the edge.
${rulebookLine()}
- Set confidence as an honest, well-calibrated SCORE from 0 to 100 (50 = coin-flip, 80+ = strong conviction); the backend enforces a minimum-confidence threshold and holds low scores for manual review. ALWAYS give target_price and invalidation_price bracketing your entry: the backend enforces a minimum reward/risk of ${limits.minRiskReward} and its position monitor manages exits from your invalidation level.
${entryGateLine(limits, false)}
- Check your open offers first: don't duplicate an order you already have resting, and account for capital already committed.
- A "Your trading so far" summary may precede the request: respect the positions you already hold (don't blindly add to the same exposure - consider taking profit or cutting a loser instead), learn from your recent calls' outcomes, and trade more conservatively as the loss budget burns.
- MAKER-FIRST: DEFAULT to a resting (maker) limit order. Set post_only=true and price limit_price AT your level - the bid for a buy, the ask for a sell. The backend prices a post_only order at the live touch and never crosses, uses your limit_price as the worst-acceptable bound, and auto-cancels unfilled offers after ${limits.maxOfferAgeMinutes} minutes - so only rest when your level is CLOSE to the touch. This captures the spread instead of paying it. Set post_only=false to CROSS and fill immediately (taker) ONLY when you need the fill now (e.g. a breakout you fear will run).
- target_price and invalidation_price still bracket the entry for ANY order type (maker or taker).
- A maker order may rest unfilled or fill only partially - size so a partial fill is still a coherent position, and do NOT count resting (unfilled) quantity as open exposure.
- The hard gates (spread, volume, slippage, reward/risk, exposure caps) ARE the quality bar. When a setup clears it, take it at an honest size and confidence rather than standing flat by default; abstain only when nothing qualifies. Capital preservation still beats a marginal trade.
- ${LIMITS_ARE_EFFECTIVE}

Be concise: explain your reasoning in 2-4 sentences.`;
}

/**
 * FIX-PLAN Fix 4: one provider turn with truncation surfacing. A max_tokens-
 * truncated response (Anthropic "max_tokens", OpenAI dialect "length") can be
 * thinking-blocks-only: text="" and toolCalls=[] - previously indistinguishable
 * from a deliberate pass. Now it is logged and retried ONCE with a doubled
 * reply budget; an empty truncated turn is never silent.
 */
export async function runTurn(provider: AiProvider, req: AiRequest): Promise<AiTurn> {
  const turn = await provider.run(req);
  const truncated =
    !turn.text && turn.toolCalls.length === 0 && (turn.stopReason === "max_tokens" || turn.stopReason === "length");
  if (!truncated) return turn;
  store.log("warn", "AI turn truncated at max_tokens — raising reply budget for one retry");
  return provider.run({ ...req, maxReplyTokens: req.maxReplyTokens * 2 });
}

export async function analyze(
  baseAsset: string,
  quoteAsset: string,
  memory?: TradingMemory,
): Promise<AnalysisResult> {
  // Feature 3: the operator uses the env provider; other users their own key.
  const provider = await resolveProviderForCurrentUser();
  const toolTrace: string[] = [];
  const proposals: ProposedTrade[] = [];
  let reasoning = "";

  const memoryBlock = renderMemory(memory);
  // Active risk profile, read LIVE per call (never cached): it scales the size
  // cap the AI is told and is surfaced so the AI adjusts size / stop placement /
  // slippage / whether to trade a volatile token per the operator's risk dials.
  const profile = store.riskProfile;
  // Expert mode sizes per order as a % of available balance — fetch the live XLM
  // balance so the per-pair cap the AI is told reflects that (basic mode unaffected).
  let xlmBal: number | undefined;
  if (profile.expertMode) {
    const pub = signerPublicKey();
    if (pub) {
      try {
        const bals = await getBalances(pub);
        xlmBal = Number(bals.find((b) => b.asset === "XLM")?.balance ?? 0);
      } catch {
        /* leave undefined — falls back to the config size envelope */
      }
    }
  }
  // FIX-PLAN Fix 1: ONE effective-limits object drives both the cap shown and
  // the system prompt, so the model reads exactly what the policy enforces.
  const limits = effectiveLimits(profile, xlmBal);
  const system = systemPrompt(limits);
  const cap = effectiveCapForPair(
    baseAsset,
    quoteAsset,
    memory?.realizedPnlToday ?? 0,
    memory?.unrealizedPnl ?? 0,
    limits,
  );
  const messages: AiMessage[] = [
    {
      role: "user",
      content: `${memoryBlock ? `${memoryBlock}\n\n` : ""}Active risk profile (per factor): ${riskProfileSummary(profile)}. Size, stop placement, slippage tolerance and your willingness to trade a volatile token should scale with these — LOW = most conservative, HIGH = most aggressive.\n\nAnalyze the ${baseAsset}/${quoteAsset} market for account ${
        signerPublicKey() ?? "(none configured)"
      } and decide whether to trade. Per-trade size cap for this pair: ${cap} units of ${baseAsset} (the base). Fetch fresh data with your tools first.`,
    },
  ];

  for (let step = 0; step < 6; step++) {
    const turn = await runTurn(provider, {
      system,
      tools: tradingTools,
      messages,
      maxReplyTokens: 1024,
    });

    if (turn.text) reasoning += (reasoning ? "\n" : "") + turn.text;
    if (turn.toolCalls.length === 0) break;

    messages.push({
      role: "assistant",
      content: turn.text,
      toolCalls: turn.toolCalls,
      raw: turn.raw,
    });

    for (const tc of turn.toolCalls) {
      const { content, trace } = await runTool(tc.name, tc.input);
      if (trace) toolTrace.push(trace);
      if (tc.name === TOOL_PROPOSE) {
        const p = parseProposal(tc.input);
        if (p) proposals.push(p);
      }
      messages.push({ role: "tool", toolCallId: tc.id, content });
    }

    // Once the model has proposed, we have what we need - stop the loop.
    if (proposals.length > 0) break;
  }

  // Never end a no-trade in silence: if the model proposed nothing AND left no
  // commentary, ask it once - plainly, text only - WHY it is standing aside, so
  // the operator never has to guess whether the bot is stuck or just patient.
  if (proposals.length === 0 && !reasoning.trim()) {
    messages.push({
      role: "user",
      content: `You did not propose a trade on ${baseAsset}/${quoteAsset}. In ONE or TWO sentences, state plainly WHY you are not trading it right now - reference the concrete data: the regime, RSI/rangePos, the spread, your ${assetCode(baseAsset)} vs ${assetCode(quoteAsset)} balances, or risk. Answer in plain text; do not call any tool.`,
    });
    const turn = await runTurn(provider, {
      system,
      tools: [],
      messages,
      maxReplyTokens: 256,
    });
    if (turn.text) reasoning = turn.text.trim();
  }

  return {
    reasoning: reasoning || "(no commentary)",
    proposals,
    toolTrace,
  };
}

/** FIX-PLAN Fix 1: chain-scan sibling of systemPrompt() - same conversion from
 *  a frozen module constant to a per-invocation render of the effective limits. */
export function systemChainPrompt(limits: Limits): string {
  return `You are a disciplined trading analyst scanning the Stellar ${config.network} DEX: several reputable credit tokens quoted against XLM, plus a few CROSS pairs (fx and peg markets like USDC/EURC and yUSDC/USDC).

Your job: review the live order books provided, then propose the STRONGEST few trades (anywhere from zero to a small handful) via the propose_stellar_trade tool, or explain in plain text why you would stand pat.

Hard rules:
- You never hold keys and never execute. You only propose. A separate backend enforces risk limits and (unless auto-trade is on) a human approves every trade.
- Market lines reading "TOKEN: ..." are XLM-based: base_asset is "XLM", quote_asset is that token. Lines reading "A vs B: ..." are CROSS pairs: base_asset is A, quote_asset is B. Copy the full CODE:ISSUER specs exactly as shown; all scanned legs are whitelisted.
- Cross pairs have natural anchors - use them: yUSDC/USDC is a redeemable peg that belongs near 1.0 (a persistent deviation with depth behind it is a high-quality mean-reversion setup), and USDC/EURC tracks the EUR/USD rate (fade only clear dislocations, not fx drift).
- Each scanned market shows its own "maxBase=" per-trade cap in BASE units of that line's pair (already tapered for today's loss budget). Never exceed it.
- Keep slippage at or below ${limits.maxSlippageBps} bps and set max_slippage_bps accordingly.
- Daily caps apply (${limits.maxDailyVolume} XLM-equivalent volume, ${limits.maxTradesPerDay} trades), so never propose more than a handful at once.
- Each scanned market lists a 24h summary (last price, 24hΔ, range, 7dΔ/7dRange where available, vol24h, bid/ask/spread/depth) plus SERVER-COMPUTED indicators: regime, rsi, atrPct (per-candle volatility %), rangePos (0=at the low, 1=at the high), flow (taker buy %) and the rulebook's read. Trust these numbers over mental math, and use the 7d range for real support/resistance levels the 24h window can't show.
- Adapt the playbook to each market's regime tag: "trending-up"/"trending-down" -> only trade WITH the trend (e.g. buy a pullback in an uptrend), never fade it; "ranging" -> mean-reversion entries near the range edges only (rangePos near 0 or 1); "volatile" -> stand aside or halve size; "n/a" (no tag) -> too little history, skip.
${rulebookLine()}
${entryGateLine(limits, true)}
- Set confidence as an honest 0-100 SCORE on every proposal (50 = coin-flip, 80+ = strong conviction); the backend enforces a minimum-confidence threshold and holds low scores for manual review. ALWAYS give target_price and invalidation_price bracketing your entry: the backend enforces a minimum reward/risk of ${limits.minRiskReward} and manages exits from your invalidation level.
- Your balances and open (resting) offers are listed above; don't duplicate an order you already have working, and account for capital already committed.
- A "Your trading so far" summary may precede the data: respect the positions you already hold (don't blindly add to the same exposure - consider taking profit or cutting a loser instead), learn from your recent calls' outcomes, and trade more conservatively as the loss budget burns.
- Call get_account_balances to refresh holdings/offers and ground sizing. Before proposing on a pair, call get_price_history for its candles and get_market for deeper orderbook detail. Don't chase a parabolic 24hΔ or a thin, wide-spread book.
- MAKER-FIRST: DEFAULT to a resting (maker) limit order. Set post_only=true and price limit_price AT your level - the bid for a buy, the ask for a sell (e.g. a resting buy near range support, or inside the spread on a tight book). The backend prices a post_only order at the live touch and never crosses, uses your limit_price as the worst-acceptable bound, and auto-cancels unfilled offers after ${limits.maxOfferAgeMinutes} minutes - so only rest when your level is CLOSE to the touch. This captures the spread instead of paying it. Set post_only=false to CROSS and fill immediately (taker) ONLY when you need the fill now (e.g. a breakout you fear will run).
- target_price and invalidation_price still bracket the entry for ANY order type (maker or taker).
- A maker order may rest unfilled or fill only partially - size so a partial fill is still a coherent position, and do NOT count resting (unfilled) quantity as open exposure.
- The hard gates (spread, volume, slippage, reward/risk, exposure caps) ARE the quality bar. When a setup clears it, take it at an honest size and confidence rather than standing flat by default; abstain only when nothing qualifies. Capital preservation still beats a marginal trade.
- ${LIMITS_ARE_EFFECTIVE}

Be concise: summarize your reasoning in 2-5 sentences, then make any proposals.`;
}

/**
 * One market line of the chain-scan table. Exported for tests. FIX-PLAN Fix 2:
 * ends with the deterministic rulebook's read of the same indicators
 * ("rulebook=SELL (Range high: rangePos 0.84 >= 0.75, RSI 64.6 >= 60)" or
 * "rulebook=none") so the model sees the playbook's candidate signals BEFORE
 * deciding - a logged divergence now means reasoned disagreement, not
 * ignorance. baselineCall is the exact function the divergence logger scores
 * against, so the two can never drift apart.
 */
export function renderMarketRow(m: MarketSnapshot, cap: number | string): string {
  const s = m.stats;
  const spread = m.spreadBps != null ? m.spreadBps.toFixed(1) : "n/a";
  const last = s.lastPrice != null ? fmtNum(s.lastPrice) : "n/a";
  const chg =
    s.change24hPct != null
      ? `${s.change24hPct >= 0 ? "+" : ""}${s.change24hPct.toFixed(2)}%`
      : "n/a";
  const range =
    s.low24h != null && s.high24h != null
      ? `${fmtNum(s.low24h)}..${fmtNum(s.high24h)}`
      : "n/a";
  const vol = s.baseVolume24h != null ? fmtNum(s.baseVolume24h) : "n/a";
  const flow = m.flowBuyPct != null ? `${m.flowBuyPct.toFixed(0)}%buy` : "n/a";
  // XLM markets keep the bare quote label; cross pairs show "BASE vs QUOTE"
  // so the model copies base_asset/quote_asset exactly.
  const label = m.base === "XLM" ? m.quote : `${m.base} vs ${m.quote}`;
  const d7 = m.stats7d;
  const week =
    d7?.change24hPct != null && d7.low24h != null && d7.high24h != null
      ? ` 7dΔ=${d7.change24hPct >= 0 ? "+" : ""}${d7.change24hPct.toFixed(2)}% 7dRange=${fmtNum(d7.low24h)}..${fmtNum(d7.high24h)}`
      : "";
  const mid =
    m.bestBid != null && m.bestAsk != null
      ? (Number(m.bestBid) + Number(m.bestAsk)) / 2
      : Number(m.bestBid ?? m.bestAsk ?? 0);
  const rb = baselineCall(s, s.lastPrice ?? mid);
  const rulebook = rb.side ? `${rb.side.toUpperCase()} (${rb.reason})` : "none";
  return `- ${label}: last=${last} 24hΔ=${chg} range=${range}${week} vol24h=${vol} bid=${m.bestBid ?? "n/a"} ask=${m.bestAsk ?? "n/a"} spread=${spread}bps depth(b/a)=${m.bids.length}/${m.asks.length} regime=${s.regime ?? "n/a"} rsi=${s.rsi14 ?? "n/a"} atrPct=${s.atrPct ?? "n/a"} rangePos=${s.rangePos ?? "n/a"} flow=${flow} maxBase=${cap} rulebook=${rulebook}`;
}

/**
 * Scan several pre-fetched markets at once and let Claude propose 0..N trades
 * across them. Unlike analyze(), this does NOT stop after the first proposal -
 * Claude can surface multiple opportunities in a single pass.
 */
export async function analyzeChain(
  markets: MarketSnapshot[],
  memory?: TradingMemory,
): Promise<AnalysisResult> {
  // Feature 3: the operator uses the env provider; other users their own key.
  const provider = await resolveProviderForCurrentUser();
  const toolTrace: string[] = [];
  const proposals: ProposedTrade[] = [];
  let reasoning = "";

  const memoryBlock = renderMemory(memory);
  // Active risk profile (live), used to scale the per-pair caps shown + surfaced.
  const chainProfile = store.riskProfile;
  const pub = signerPublicKey();
  let balancesText = "(no account configured)";
  let offersText = "[]";
  let xlmBal: number | undefined;
  if (pub) {
    try {
      const bals = await getBalances(pub);
      balancesText = JSON.stringify(bals);
      xlmBal = Number(bals.find((b) => b.asset === "XLM")?.balance ?? 0);
    } catch {
      balancesText = "(failed to load balances)";
    }
    try {
      offersText = JSON.stringify(await getOpenOffers(pub));
    } catch {
      offersText = "(failed to load open offers)";
    }
  }
  // Expert mode: the per-pair caps shown reflect %-of-balance sizing.
  const chainLimits = effectiveLimits(chainProfile, chainProfile.expertMode ? xlmBal : undefined);
  // FIX-PLAN Fix 1: the system prompt renders from the SAME effective limits
  // the policy enforces. Fix 6 visibility: surface the (possibly risk-scaled)
  // reward/risk bar at scan start so the live log always shows what applied.
  const system = systemChainPrompt(chainLimits);
  store.log("info", `Effective minRiskReward this scan: ${chainLimits.minRiskReward}`);

  const table = markets
    .map((m) => {
      const cap = effectiveCapForPair(
        m.base,
        m.quote,
        memory?.realizedPnlToday ?? 0,
        memory?.unrealizedPnl ?? 0,
        chainLimits,
      );
      return renderMarketRow(m, cap);
    })
    .join("\n");

  const messages: AiMessage[] = [
    {
      role: "user",
      content: `${memoryBlock ? `${memoryBlock}\n\n` : ""}Active risk profile (per factor): ${riskProfileSummary(chainProfile)}. Scale size, stop placement, slippage and willingness to trade volatile tokens with these (LOW = conservative, HIGH = aggressive).

Account: ${pub ?? "(none configured)"}
Balances: ${balancesText}
Open offers (your resting orders - do not blindly duplicate them): ${offersText}

Scanned markets (TOKEN lines: base_asset=XLM, price = quote units per 1 XLM; "A vs B" lines: CROSS pairs with base_asset=A, quote_asset=B, price = B units per 1 A):
${table}

Decide whether to trade. You may call get_market for deeper detail on any pair, then propose your best zero-to-few trades.`,
    },
  ];

  const MAX_PROPOSALS = 12;
  for (let step = 0; step < 8; step++) {
    const turn = await runTurn(provider, {
      system,
      tools: tradingTools,
      messages,
      maxReplyTokens: 1536,
    });

    if (turn.text) reasoning += (reasoning ? "\n" : "") + turn.text;
    if (turn.toolCalls.length === 0) break;

    messages.push({
      role: "assistant",
      content: turn.text,
      toolCalls: turn.toolCalls,
      raw: turn.raw,
    });

    for (const tc of turn.toolCalls) {
      const { content, trace } = await runTool(tc.name, tc.input);
      if (trace) toolTrace.push(trace);
      if (tc.name === TOOL_PROPOSE && proposals.length < MAX_PROPOSALS) {
        const p = parseProposal(tc.input);
        if (p) proposals.push(p);
      }
      messages.push({ role: "tool", toolCallId: tc.id, content });
    }

    if (proposals.length >= MAX_PROPOSALS) break;
  }

  // FIX-PLAN Fix 3: never end a chain scan in silence. analyze() has had this
  // probe for a while; the chain scan did not - hence "(no commentary)" on
  // every silent pass. One cheap text-only turn, only when the model proposed
  // nothing AND said nothing.
  if (proposals.length === 0 && !reasoning.trim()) {
    messages.push({
      role: "user",
      content:
        "You proposed nothing. In 2-3 sentences, state why — reference the strongest candidates (especially any rulebook= signals) and the concrete numbers that made you pass. Answer in plain text; do not call any tool.",
    });
    const turn = await runTurn(provider, {
      system,
      tools: [],
      messages,
      maxReplyTokens: 256,
    });
    if (turn.text) reasoning = turn.text.trim();
  }

  return {
    reasoning: reasoning || "(no commentary)",
    proposals,
    toolTrace,
  };
}

async function runTool(
  name: string,
  input: unknown,
): Promise<{ content: string; trace?: string }> {
  try {
    if (name === TOOL_BALANCES) {
      const pub = signerPublicKey();
      if (!pub) {
        return {
          content: "No account configured.",
          trace: "get_account_balances -> no account",
        };
      }
      const [balances, openOffers] = await Promise.all([
        getBalances(pub),
        getOpenOffers(pub).catch(() => []),
      ]);
      return {
        content: JSON.stringify({ balances, openOffers }),
        trace: `get_account_balances -> ${balances.filter((b) => Number(b.balance) > 0).length} funded / ${balances.length} trustline(s), ${openOffers.length} open offer(s)`,
      };
    }
    if (name === TOOL_MARKET) {
      const o = input as { base_asset?: string; quote_asset?: string };
      const base = o.base_asset ?? "";
      const quote = o.quote_asset ?? "";
      const snap = await getMarketSnapshot(base, quote, 8);
      return {
        content: JSON.stringify(snap),
        trace: `get_market ${base}/${quote} -> bid ${snap.bestBid} / ask ${snap.bestAsk}`,
      };
    }
    if (name === TOOL_HISTORY) {
      const o = input as {
        base_asset?: string;
        quote_asset?: string;
        resolution?: string;
      };
      const base = o.base_asset ?? "";
      const quote = o.quote_asset ?? "";
      const { ms, limit } = resolutionToParams(o.resolution);
      const candles = await getTradeAggregations(base, quote, ms, limit);
      const stats = summarizeCandles(candles, ms);
      const chg =
        stats.change24hPct != null ? `${stats.change24hPct.toFixed(2)}%` : "n/a";
      return {
        content: JSON.stringify({
          resolution: o.resolution ?? "1h",
          stats,
          candles,
        }),
        trace: `get_price_history ${base}/${quote} -> ${candles.length} candle(s), Δ ${chg}`,
      };
    }
    if (name === TOOL_PROPOSE) {
      return {
        content:
          "Proposal received. The backend will apply risk policy and a human will review it.",
        trace: "propose_stellar_trade -> captured",
      };
    }
    // Stop-loss tools EXECUTE immediately (they mutate existing state, they are
    // not approval-gated proposals): the independent monitor then enforces them.
    if (
      name === TOOL_SET_STOP ||
      name === TOOL_UPDATE_STOP ||
      name === TOOL_CANCEL_STOP
    ) {
      const o = input as {
        base_asset?: string;
        quote_asset?: string;
        stop_price?: unknown;
        quantity?: unknown;
        sell_all?: boolean;
        notes?: unknown;
      };
      const base = String(o.base_asset ?? "");
      const quote = String(o.quote_asset ?? "");
      const pairText = pairLabel(base, quote);
      const notes = o.notes != null ? String(o.notes) : undefined;

      if (name === TOOL_CANCEL_STOP) {
        const mine = stopLossService
          .getActiveStopLosses(base, quote)
          .filter((s) => s.setBy === "ai");
        for (const s of mine) {
          stopLossService.cancelStopLoss(s.id, "ai", notes ?? "AI exited the position");
        }
        return {
          content: JSON.stringify({ ok: true, cancelled: mine.length }),
          trace: `cancel_stop_loss ${pairText} -> ${mine.length}`,
        };
      }

      const stopPrice = String(o.stop_price ?? "");
      if (name === TOOL_UPDATE_STOP) {
        const mine = stopLossService
          .getActiveStopLosses(base, quote)
          .filter((s) => s.setBy === "ai");
        if (mine.length === 0) {
          return {
            content: JSON.stringify({
              ok: false,
              error: "No active AI stop on this pair to update; use set_stop_loss first.",
            }),
            trace: `update_stop_loss ${pairText} -> none`,
          };
        }
        const updated = await stopLossService.updateStopLoss(mine[0]!.id, {
          triggerPrice: stopPrice,
          initiator: "ai",
          notes,
        });
        return {
          content: JSON.stringify({ ok: true, stop: updated }),
          trace: `update_stop_loss ${pairText} -> ${updated.triggerPrice}`,
        };
      }

      // set_stop_loss
      const sellAll = o.sell_all === true || o.quantity == null;
      const created = await stopLossService.setStopLoss({
        baseAsset: base,
        quoteAsset: quote,
        triggerPrice: stopPrice,
        sellAll,
        quantityToSell: sellAll ? undefined : String(o.quantity),
        setBy: "ai",
        notes,
      });
      return {
        content: JSON.stringify({ ok: true, stop: created }),
        trace: `set_stop_loss ${pairText} -> ${created.triggerPrice}`,
      };
    }
    return { content: `Unknown tool: ${name}` };
  } catch (err) {
    // Name the pair in the trace - a bare "get_price_history -> error" line
    // tells the operator nothing about WHICH market failed.
    const o = input as { base_asset?: string; quote_asset?: string } | null;
    const pair =
      o && (o.base_asset || o.quote_asset)
        ? ` ${o.base_asset ?? "?"}/${o.quote_asset ?? "?"}`
        : "";
    return {
      content: `Error: ${(err as Error).message}`,
      trace: `${name}${pair} -> error: ${(err as Error).message}`,
    };
  }
}

/** Map a 0-100 confidence score to the legacy label bucket (for label-based
 *  UI/gates that still read `confidence`). */
export function scoreToLabel(n: number): TradeConfidence {
  if (n >= 80) return "high";
  if (n >= 60) return "medium";
  return "low";
}

/** Approximate numeric score for a legacy label (back-compat fallback). */
export function labelToScore(l: TradeConfidence): number {
  return l === "high" ? 90 : l === "medium" ? 70 : 45;
}

/**
 * Accept the new numeric 0-100 confidence OR a legacy "low"/"medium"/"high"
 * label, and return BOTH a clamped score and a derived label. Returns {} when
 * the value is missing/unparseable (the conviction gate then fails closed).
 */
export function coerceConfidence(raw: unknown): {
  score?: number;
  label?: TradeConfidence;
} {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(Math.min(100, Math.max(0, raw)));
    return { score: n, label: scoreToLabel(n) };
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "low" || s === "medium" || s === "high") {
      const label = s as TradeConfidence;
      return { score: labelToScore(label), label };
    }
    if (s !== "") {
      const n = Number(s);
      if (Number.isFinite(n)) {
        const c = Math.round(Math.min(100, Math.max(0, n)));
        return { score: c, label: scoreToLabel(c) };
      }
    }
  }
  return {};
}

/** Exported for unit testing the fail-safe post_only / field parsing. */
export function parseProposal(input: unknown): ProposedTrade | null {
  const o = input as Record<string, unknown>;
  const side: TradeSide | null =
    o.side === "buy" || o.side === "sell" ? o.side : null;
  if (!side) return null;

  const base = String(o.base_asset ?? "");
  const quote = String(o.quote_asset ?? "");
  const safe = (spec: string) => {
    try {
      return canonicalAsset(spec);
    } catch {
      return spec; // keep raw; the policy engine will reject an invalid asset
    }
  };

  // Confidence is now a 0-100 SCORE; we still accept a legacy low/medium/high
  // label for backward compatibility and derive the score from it (and a label
  // from the score, so label-based code/UI keeps working).
  const { score: confidenceScore, label: confidence } = coerceConfidence(o.confidence);
  // Fail-safe to MAKER: a model that omits post_only gets the cheaper/safer
  // resting path that captures the spread; only an explicit false opts into
  // crossing the spread as a taker.
  const postOnly = o.post_only === false ? false : true;
  const optNum = (v: unknown): string | undefined => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s && Number(s) > 0 ? s : undefined;
  };

  return {
    side,
    baseAsset: safe(base),
    quoteAsset: safe(quote),
    amount: String(o.amount ?? ""),
    limitPrice: String(o.limit_price ?? ""),
    postOnly,
    maxSlippageBps: Number(o.max_slippage_bps ?? 0),
    reason: String(o.reason ?? ""),
    confidence,
    confidenceScore,
    targetPrice: optNum(o.target_price),
    invalidationPrice: optNum(o.invalidation_price),
    horizon: o.horizon != null ? String(o.horizon).slice(0, 16) : undefined,
  };
}

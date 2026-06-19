import type { AiTool } from "../ai/types";

export const TOOL_BALANCES = "get_account_balances";
export const TOOL_MARKET = "get_market";
export const TOOL_HISTORY = "get_price_history";
export const TOOL_PROPOSE = "propose_stellar_trade";

// Provider-neutral tool schemas. Each provider (Anthropic / OpenAI-compatible)
// translates these to its own wire format; Anthropic also adds prompt-cache
// breakpoints on the tool list internally.
export const tradingTools: AiTool[] = [
  {
    name: TOOL_BALANCES,
    description:
      "Get the trading account's current holdings: asset balances AND your open (resting) offers on the DEX. Use the open offers to avoid stacking duplicate orders and to gauge existing exposure. Read-only, safe to call.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: TOOL_MARKET,
    description:
      "Get the live orderbook (best bid/ask + depth) and recent trades for a base/quote pair on the Stellar DEX. Prices are quote units per 1 base unit. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        base_asset: {
          type: "string",
          description: 'Base asset: "XLM" or "CODE:ISSUER".',
        },
        quote_asset: {
          type: "string",
          description: 'Quote asset: "XLM" or "CODE:ISSUER".',
        },
      },
      required: ["base_asset", "quote_asset"],
    },
  },
  {
    name: TOOL_HISTORY,
    description:
      "Get recent OHLC price history (candles) for a base/quote pair on the Stellar DEX, plus a 24h summary: last price, % change, high, low and traded volume. Use this to read trend and volatility before proposing - avoid buying into a parabolic spike or catching a falling knife. Prices are quote units per 1 base unit. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        base_asset: {
          type: "string",
          description: 'Base asset: "XLM" or "CODE:ISSUER".',
        },
        quote_asset: {
          type: "string",
          description: 'Quote asset: "XLM" or "CODE:ISSUER".',
        },
        resolution: {
          type: "string",
          enum: ["15m", "1h", "1d"],
          description:
            "Candle width. 15m (~12h window), 1h (~24h, default), 1d (~30d).",
        },
      },
      required: ["base_asset", "quote_asset"],
    },
  },
  {
    name: TOOL_PROPOSE,
    description:
      "Propose exactly ONE Stellar DEX trade. This does NOT sign or submit anything: the backend applies hard risk limits, and a human approves or rejects unless auto-trade is enabled (low-confidence proposals are always held for manual review). Only call when you have a concrete, justified trade backed by data you fetched.",
    inputSchema: {
      type: "object",
      properties: {
        side: { type: "string", enum: ["buy", "sell"] },
        base_asset: { type: "string", description: 'e.g. "XLM"' },
        quote_asset: { type: "string", description: 'e.g. "USDC:GA5Z..."' },
        amount: {
          type: "string",
          description: "Amount of the base asset to trade.",
        },
        limit_price: {
          type: "string",
          description:
            "Limit price as quote units per 1 base unit. Its role depends on post_only: for a resting maker order (post_only=true) it is the WORST acceptable price (a ceiling for a buy, a floor for a sell) and the backend prices the order at the live touch; for a crossing taker order (post_only=false) it is your crossing price.",
        },
        post_only: {
          type: "boolean",
          description:
            "Maker-first. true = REST a limit order at/just inside the touch to CAPTURE the spread (a buy joins the bid, a sell joins the ask); the backend prices it at the live touch so it never crosses, and your limit_price acts as the WORST acceptable price (a ceiling for a buy, a floor for a sell). Default for mean-reversion/range entries. false = CROSS the spread and fill immediately (taker) - only when you need an immediate fill on conviction (e.g. a breakout you fear will run); then limit_price is your crossing price.",
        },
        max_slippage_bps: {
          type: "number",
          description: "Maximum acceptable slippage in basis points.",
        },
        reason: {
          type: "string",
          description: "Short rationale the human operator will read.",
        },
        confidence: {
          type: "string",
          enum: ["low", "medium", "high"],
          description:
            "Your conviction in this trade. Be honest - 'low' confidence trades are held for manual review even in auto-trade mode, and your calibration is tracked over time.",
        },
        target_price: {
          type: "string",
          description:
            "Price target that would validate the thesis (quote units per 1 base unit). Strongly recommended: together with invalidation_price the backend enforces a minimum reward/risk ratio.",
        },
        invalidation_price: {
          type: "string",
          description:
            "Price level that INVALIDATES the thesis - your stop. The backend's position monitor uses stops to manage exits. Must sit on the loss side of the entry.",
        },
        horizon: {
          type: "string",
          enum: ["hours", "days", "weeks"],
          description: "Expected holding period for the thesis to play out.",
        },
      },
      required: [
        "side",
        "base_asset",
        "quote_asset",
        "amount",
        "limit_price",
        "max_slippage_bps",
        "reason",
        "confidence",
        "target_price",
        "invalidation_price",
      ],
    },
  },
];

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
          description: "Limit price as quote units per 1 base unit.",
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

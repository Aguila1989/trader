import { type AiRequest, type AiTool } from "../ai";
import { aiReadyForCurrentUser, resolveProviderForCurrentUser } from "../ai/userKeys";
import type { TokenRawData, TokenScores } from "../types";

/**
 * Feature 4 — AI scoring of one token as a trustline candidate.
 *
 * Reuses the provider-neutral AI layer (src/ai): a SINGLE forced-tool call asks
 * the active model to return a strict structured evaluation. The tool's input
 * arrives already JSON-parsed (Record<string, unknown>); we clamp + validate it
 * defensively (same spirit as agent.ts parseProposal) so a malformed reply can
 * never produce out-of-range scores. When the AI is unavailable, the model
 * returns no tool call, or the call throws, we fall back to a conservative
 * low-confidence evaluation rather than failing the whole scan.
 */

const TOOL: AiTool = {
  name: "submit_token_evaluation",
  description:
    "Return the structured trustline-candidate evaluation for the token. Call this exactly once.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      liquidity_score: { type: "integer", minimum: 1, maximum: 10 },
      legitimacy_score: { type: "integer", minimum: 1, maximum: 10 },
      trend_score: { type: "integer", minimum: 1, maximum: 10 },
      risk_score: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "1 = very risky, 10 = very safe (lowest risk).",
      },
      overall_score: { type: "integer", minimum: 1, maximum: 10 },
      summary: { type: "string", description: "2-3 sentence plain-language summary." },
      red_flags: {
        type: "array",
        items: { type: "string" },
        description:
          "Any red flags: no TOML, anonymous issuer, sudden volume spike without fundamentals, very low trustline count, etc.",
      },
    },
    required: [
      "liquidity_score",
      "legitimacy_score",
      "trend_score",
      "risk_score",
      "overall_score",
      "summary",
      "red_flags",
    ],
  },
};

const SYSTEM =
  "You are a cautious Stellar token risk analyst evaluating whether a token is a " +
  "sound trustline candidate. You reason only from the supplied on-chain + market " +
  "data and the issuer's stellar.toml. You never invent facts. Higher scores are " +
  "better; for risk_score specifically, 10 means LOWEST risk and 1 means very risky. " +
  "Be conservative: missing documentation, an anonymous issuer, very thin liquidity, " +
  "very few trustlines, or a volume spike without supporting fundamentals should pull " +
  "scores down and appear as red flags.";

/** Clamp an untrusted score into 1..10 (rounded), defaulting to a neutral 5. */
function clampScore(v: unknown): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, n));
}

/**
 * Conservative fallback used when the AI can't be reached or returns nothing
 * usable. Low-but-not-zero scores + an explicit red flag, so the token is never
 * silently presented as a strong candidate on the back of a missing evaluation.
 */
export function fallbackScores(reason: string): TokenScores {
  return {
    liquidityScore: 3,
    legitimacyScore: 3,
    trendScore: 3,
    riskScore: 3,
    overallScore: 3,
    summary: `Automated AI evaluation was unavailable (${reason}). Treat this token as unscored and do your own research before trusting it.`,
    redFlags: ["AI evaluation unavailable"],
  };
}

/** Build the verbatim spec instruction + the token data payload. */
function userPrompt(asset: string, raw: TokenRawData): string {
  return (
    "Based on the following Stellar token data, evaluate this token as a trustline " +
    "candidate. Score it 1-10 on: liquidity, project legitimacy, growth trend, and " +
    "risk (risk_score: 1 = very risky, 10 = very safe). Provide a 2-3 sentence summary " +
    "explaining the score. Flag any red flags (no TOML, anonymous issuer, sudden volume " +
    "spike without fundamentals, very low trustline count). Return structured JSON only " +
    "by calling submit_token_evaluation.\n\n" +
    `TOKEN: ${asset}\n` +
    `DATA:\n${JSON.stringify(raw, null, 2)}`
  );
}

/** Score one token. Never throws - returns fallbackScores() on any failure. */
export async function scoreToken(asset: string, raw: TokenRawData): Promise<TokenScores> {
  if (!(await aiReadyForCurrentUser())) return fallbackScores("no AI API key configured");
  try {
    const req: AiRequest = {
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt(asset, raw) }],
      tools: [TOOL],
      maxReplyTokens: 800,
    };
    // Feature 3: operator -> env provider; other users -> their own stored key.
    const turn = await (await resolveProviderForCurrentUser()).run(req);
    const call =
      turn.toolCalls.find((c) => c.name === TOOL.name) ?? turn.toolCalls[0];
    if (!call) return fallbackScores("the AI returned no structured evaluation");
    const i = call.input as Record<string, unknown>;
    const summary =
      typeof i.summary === "string" && i.summary.trim()
        ? i.summary.trim().slice(0, 1000)
        : "No summary provided.";
    const redFlags = Array.isArray(i.red_flags)
      ? i.red_flags.map((x) => String(x)).filter(Boolean).slice(0, 12)
      : [];
    return {
      liquidityScore: clampScore(i.liquidity_score),
      legitimacyScore: clampScore(i.legitimacy_score),
      trendScore: clampScore(i.trend_score),
      riskScore: clampScore(i.risk_score),
      overallScore: clampScore(i.overall_score),
      summary,
      redFlags,
    };
  } catch (err) {
    return fallbackScores((err as Error)?.message ?? "AI request failed");
  }
}

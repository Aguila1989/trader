/**
 * Per-user AI API keys (2026-07 Feature 3). Premium users bring their own key
 * (Anthropic / OpenAI / Google / DeepSeek); the platform never proxies or
 * resells AI usage.
 *
 * SECURITY MODEL (mirrors stellar/keyProvider.ts):
 *  - stored encrypted (crypto/secretBox.ts, purpose "ai-api-key" - its own KDF
 *    domain, separate from wallet seeds) in dbo.UserAiKeys, one row per user;
 *  - decrypted ONLY inside resolveProviderForCurrentUser()/testAiKey(), for
 *    the duration of building the one request's provider;
 *  - never returned to a client (GET exposes provider + last4 only), never
 *    logged, never cached in plaintext.
 *
 * RESOLUTION: the DEFAULT operator account keeps using the env-configured
 * provider catalog (src/ai/index.ts) - the background bot is the operator's.
 * Every other user resolves to their own stored key; without one, AI is
 * unavailable for them (a clear, actionable error).
 */
import sql from "mssql";
import { randomUUID } from "node:crypto";
import { config } from "../config";
import { dbReady, getPool } from "../db/pool";
import { decryptSecret, encryptSecret } from "../crypto/secretBox";
import { currentUserId, DEFAULT_USER_ID } from "../users/context";
import { AnthropicProvider } from "./anthropic";
import { OpenAICompatibleProvider } from "./openai";
import { getProvider, aiReady } from "./index";
import type { AiProvider } from "./types";

/** The providers a user may bring a key for (the spec's four). */
export const USER_AI_PROVIDERS = ["anthropic", "openai", "google", "deepseek"] as const;
export type UserAiProvider = (typeof USER_AI_PROVIDERS)[number];

export function isUserAiProvider(v: unknown): v is UserAiProvider {
  return typeof v === "string" && (USER_AI_PROVIDERS as readonly string[]).includes(v);
}

export class AiKeyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/* ---- storage (DB-only; BYO keys make no sense without persistence) ------- */

export interface UserAiKeyMeta {
  provider: UserAiProvider;
  keyLast4: string;
  updatedAt: string;
  /** User-chosen model; null = the provider's catalog default. */
  model: string | null;
}

/** Model ids look like "claude-sonnet-4-6", "gpt-4o", "gemini-2.5-pro". */
const MODEL_RE = /^[\w.:/-]{1,120}$/;

/**
 * Normalise a user-supplied model choice: empty/undefined -> null (catalog
 * default), anything else must look like a model id. Throws AiKeyError on junk.
 */
export function normalizeUserModel(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  if (!MODEL_RE.test(s)) throw new AiKeyError(400, "That doesn't look like a valid model id.");
  return s;
}

export async function getUserAiKeyMeta(userId: string): Promise<UserAiKeyMeta | null> {
  if (!dbReady()) return null;
  const res = await getPool()
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .query<{ provider: string; keyLast4: string; updatedAt: Date | string; model: string | null }>(
      `SELECT provider, keyLast4, updatedAt, model FROM dbo.UserAiKeys WHERE userId = @userId;`,
    );
  const row = res.recordset[0];
  if (!row || !isUserAiProvider(row.provider)) return null;
  return {
    provider: row.provider,
    keyLast4: row.keyLast4,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
    model: row.model ?? null,
  };
}

export async function saveUserAiKey(
  userId: string,
  provider: UserAiProvider,
  key: string,
  model?: string | null,
): Promise<void> {
  if (!dbReady()) throw new AiKeyError(503, "AI key storage requires a configured database.");
  const trimmed = key.trim();
  if (trimmed.length < 20 || trimmed.length > 512 || /\s/.test(trimmed)) {
    throw new AiKeyError(400, "That doesn't look like a valid API key.");
  }
  const chosenModel = normalizeUserModel(model);
  const blob = encryptSecret(Buffer.from(trimmed, "utf8"), userId, config.walletEncryptionKey, "ai-api-key");
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), randomUUID())
    .input("userId", sql.NVarChar(64), userId)
    .input("provider", sql.NVarChar(24), provider)
    .input("blob", sql.NVarChar(sql.MAX), blob)
    .input("last4", sql.NVarChar(4), trimmed.slice(-4))
    .input("model", sql.NVarChar(120), chosenModel)
    .input("now", sql.DateTime2, new Date())
    .query(
      `MERGE dbo.UserAiKeys AS t
       USING (SELECT @userId AS userId) AS s ON t.userId = s.userId
       WHEN MATCHED THEN UPDATE SET provider = @provider, encryptedKey = @blob,
                                    keyLast4 = @last4, model = @model, updatedAt = @now
       WHEN NOT MATCHED THEN INSERT (id, createdAt, updatedAt, provider, encryptedKey, keyLast4, model, userId)
         VALUES (@id, @now, @now, @provider, @blob, @last4, @model, @userId);`,
    );
}

export async function deleteUserAiKey(userId: string): Promise<boolean> {
  if (!dbReady()) return false;
  const res = await getPool()
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .query(`DELETE FROM dbo.UserAiKeys WHERE userId = @userId;`);
  return (res.rowsAffected[0] ?? 0) > 0;
}

/* ---- provider construction (just-in-time decryption) --------------------- */

/** Catalog defaults (model/baseURL) for a user-supplied key. */
function specDefaults(provider: UserAiProvider): { model: string; baseURL: string } {
  const spec = config.ai.providers[provider];
  return { model: spec?.model || "", baseURL: spec?.baseURL || "" };
}

/** The model a provider falls back to when the user hasn't chosen one. */
export function defaultModelFor(provider: UserAiProvider): string {
  return specDefaults(provider).model;
}

/**
 * Build a provider from the user's key. The MODEL is the user's stored choice
 * when set, else the catalog default — it is the user's own bill, so their
 * configuration wins over the operator's env (this used to be unconditionally
 * pinned to the operator's model; fixed 2026-07).
 */
function buildUserProvider(provider: UserAiProvider, apiKey: string, model?: string | null): AiProvider {
  const d = specDefaults(provider);
  const chosenModel = model?.trim() || d.model;
  if (provider === "anthropic") {
    return new AnthropicProvider({
      id: "anthropic",
      apiKey,
      model: chosenModel,
      baseURL: d.baseURL || undefined,
      thinkingBudget: config.anthropicThinkingBudget,
    });
  }
  return new OpenAICompatibleProvider({ id: provider, apiKey, model: chosenModel, baseURL: d.baseURL });
}

/**
 * The AI provider for the CURRENT request context. DEFAULT operator -> the
 * env-configured active provider (unchanged behavior for the background bot);
 * any other user -> a provider built from THEIR stored key, decrypted for
 * this call only. Throws AiKeyError with an actionable message otherwise.
 */
export async function resolveProviderForCurrentUser(): Promise<AiProvider> {
  const userId = currentUserId();
  if (userId === DEFAULT_USER_ID) return getProvider();
  if (!dbReady()) throw new AiKeyError(503, "AI is unavailable: no database configured.");
  const res = await getPool()
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .query<{ provider: string; encryptedKey: string; model: string | null }>(
      `SELECT provider, encryptedKey, model FROM dbo.UserAiKeys WHERE userId = @userId;`,
    );
  const row = res.recordset[0];
  if (!row || !isUserAiProvider(row.provider)) {
    throw new AiKeyError(
      400,
      "No AI API key configured. Add your provider key in Settings > Account > AI API Key.",
    );
  }
  const keyBuf = decryptSecret(row.encryptedKey, userId, config.walletEncryptionKey, "ai-api-key");
  try {
    return buildUserProvider(row.provider, keyBuf.toString("utf8"), row.model);
  } finally {
    keyBuf.fill(0);
  }
}

/** aiReady() for the current context: env key for the operator, stored key
 *  for everyone else. */
export async function aiReadyForCurrentUser(): Promise<boolean> {
  const userId = currentUserId();
  if (userId === DEFAULT_USER_ID) return aiReady();
  return (await getUserAiKeyMeta(userId)) != null;
}

/* ---- "Test connection" ---------------------------------------------------- */

/**
 * A minimal one-token round-trip against the provider with a candidate key
 * (NOT the stored one - the user tests what they typed before saving). Returns
 * a safe, human-readable result; never throws with provider internals.
 */
export async function testAiKey(
  provider: UserAiProvider,
  key: string,
  model?: string | null,
): Promise<{ ok: boolean; message: string; model?: string }> {
  const trimmed = key.trim();
  if (trimmed.length < 20) return { ok: false, message: "That doesn't look like a valid API key." };
  const chosenModel = normalizeUserModel(model) ?? specDefaults(provider).model;
  try {
    // Test with the model the user intends to run, so a typo'd model id fails
    // HERE (before saving) instead of at their first real trade proposal.
    const p = buildUserProvider(provider, trimmed, chosenModel);
    const turn = await p.run({
      system: "You are a connectivity test. Reply with exactly: OK",
      messages: [{ role: "user", content: "Connectivity test." }],
      tools: [],
      maxReplyTokens: 8,
    });
    return typeof turn.text === "string"
      ? { ok: true, message: "Connection successful.", model: chosenModel }
      : { ok: false, message: "The provider answered in an unexpected format." };
  } catch (err) {
    const msg = (err as Error).message || "connection failed";
    // Provider errors (401 invalid key, 429 quota...) are safe + useful here.
    return { ok: false, message: `Connection failed: ${msg.slice(0, 200)}` };
  }
}

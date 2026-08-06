/**
 * StrategyArm registry - register/lookup by id, list ENABLED arms from a
 * caller-supplied id list.
 *
 * Deliberately never imports src/config.ts: the whole point of arms is that
 * they're usable identically inside the backtest engine / Phase 4 eval (which
 * have no live config) and inside the running app. The caller (a later
 * orchestrator wiring step, or the eval harness) decides which ids are
 * "enabled" - e.g. from a `config.strategyArms: string[]` list once that
 * config key exists - and passes it in here.
 */
import type { StrategyArm } from "./types";
import { directionalArm } from "./directional";
import { fundingCarryArm } from "./fundingCarry";
import { newsReactionArm } from "./newsReaction";
import { synthesisArm } from "./synthesis";

const registry = new Map<string, StrategyArm>();

function register(arm: StrategyArm): void {
  if (registry.has(arm.id)) {
    throw new Error(`Duplicate StrategyArm id "${arm.id}".`);
  }
  registry.set(arm.id, arm);
}

register(directionalArm);
register(fundingCarryArm);
register(newsReactionArm);
register(synthesisArm);

/** Look up one arm by id. Throws for an unknown id - a typo'd config id must
 *  never silently mean "no strategy ran". */
export function armFor(id: string): StrategyArm {
  const a = registry.get(id);
  if (!a) throw new Error(`No StrategyArm registered for id "${id}".`);
  return a;
}

/** True when `id` has a registered arm. */
export function isArmRegistered(id: string): boolean {
  return registry.has(id);
}

/** All registered arm ids, insertion order. */
export function registeredArmIds(): string[] {
  return Array.from(registry.keys());
}

/**
 * The arms enabled by the caller's config list, in the order given, silently
 * dropping any id that isn't actually registered (an unknown id here is a
 * config typo the caller should validate/log, not this registry's job to
 * throw on for every read).
 */
export function enabledArms(enabledIds: string[]): StrategyArm[] {
  return enabledIds
    .map((id) => registry.get(id))
    .filter((a): a is StrategyArm => a !== undefined);
}

/** True when `id` both exists AND is present in the caller's enabled list. */
export function isArmEnabled(id: string, enabledIds: string[]): boolean {
  return registry.has(id) && enabledIds.includes(id);
}

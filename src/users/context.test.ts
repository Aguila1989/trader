import { describe, it, expect, afterEach } from "vitest";
import {
  DEFAULT_USER_ID,
  currentUserId,
  setCurrentUserId,
  resetCurrentUserId,
} from "./context";

/**
 * The data layer reads currentUserId() ambiently (like config.network). Until
 * authentication lands it must resolve to the bootstrapped default user, and the
 * override seam used by the upcoming auth layer must work and be reversible.
 */
describe("users/context", () => {
  afterEach(() => resetCurrentUserId());

  it("defaults to the bootstrapped default user", () => {
    expect(currentUserId()).toBe(DEFAULT_USER_ID);
  });

  it("can be overridden (the auth seam) and reset back to the default", () => {
    setCurrentUserId("some-other-user-id");
    expect(currentUserId()).toBe("some-other-user-id");
    resetCurrentUserId();
    expect(currentUserId()).toBe(DEFAULT_USER_ID);
  });
});

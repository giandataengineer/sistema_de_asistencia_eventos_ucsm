import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, type RateLimitConfig } from "./rate-limiter";

const testConfig: RateLimitConfig = { maxRequests: 3, windowMs: 1000 };

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Use unique identifiers per test to avoid cross-test state
  });

  it("allows first request", () => {
    const id = `test-${Date.now()}-first`;
    const result = checkRateLimit(id, testConfig);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks remaining requests correctly", () => {
    const id = `test-${Date.now()}-track`;
    checkRateLimit(id, testConfig);
    const second = checkRateLimit(id, testConfig);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks after max requests", () => {
    const id = `test-${Date.now()}-block`;
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);
    const fourth = checkRateLimit(id, testConfig);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.retryAfter).toBeGreaterThan(0);
  });

  it("isolates different identifiers", () => {
    const id1 = `test-${Date.now()}-iso1`;
    const id2 = `test-${Date.now()}-iso2`;
    checkRateLimit(id1, testConfig);
    checkRateLimit(id1, testConfig);
    checkRateLimit(id1, testConfig);

    const result = checkRateLimit(id2, testConfig);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("respects different configs", () => {
    const id = `test-${Date.now()}-config`;
    const strictConfig: RateLimitConfig = { maxRequests: 1, windowMs: 1000 };
    checkRateLimit(id, strictConfig);
    const second = checkRateLimit(id, strictConfig);
    expect(second.allowed).toBe(false);
  });
});

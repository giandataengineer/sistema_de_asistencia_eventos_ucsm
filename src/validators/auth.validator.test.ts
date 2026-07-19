import { describe, it, expect } from "vitest";
import { loginSchema } from "./auth.validator";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      username: "seminario",
      password: "admin123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = loginSchema.safeParse({
      username: "",
      password: "admin123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      username: "seminario",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username exceeding 50 characters", () => {
    const result = loginSchema.safeParse({
      username: "a".repeat(51),
      password: "admin123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password exceeding 100 characters", () => {
    const result = loginSchema.safeParse({
      username: "seminario",
      password: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from username", () => {
    const result = loginSchema.safeParse({
      username: "  seminario  ",
      password: "admin123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("seminario");
    }
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string types", () => {
    const result = loginSchema.safeParse({
      username: 12345,
      password: true,
    });
    expect(result.success).toBe(false);
  });
});

import { describe, test, expect } from "vitest";
import { isGuardError } from "./api-guard";
import { NextResponse } from "next/server";

describe("isGuardError", () => {
  test("returns true for NextResponse instances", () => {
    const response = NextResponse.json({ error: "test" }, { status: 401 });
    expect(isGuardError(response)).toBe(true);
  });

  test("returns false for guard result objects", () => {
    const result = { session: { sub: "1", username: "test", nombre: "Test", eventoId: "e1" }, ip: "127.0.0.1" };
    expect(isGuardError(result as never)).toBe(false);
  });
});

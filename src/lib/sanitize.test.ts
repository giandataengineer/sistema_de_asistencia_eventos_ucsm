import { describe, test, expect } from "vitest";
import { stripControlChars, escapeHtml, sanitizeInput } from "./sanitize";

describe("stripControlChars", () => {
  test("removes null bytes and control characters", () => {
    expect(stripControlChars("hello\x00world")).toBe("helloworld");
    expect(stripControlChars("test\x08\x1F")).toBe("test");
  });

  test("preserves newlines and tabs", () => {
    expect(stripControlChars("line1\nline2\ttab")).toBe("line1\nline2\ttab");
  });

  test("preserves normal text", () => {
    expect(stripControlChars("Juan Pérez López")).toBe("Juan Pérez López");
  });
});

describe("escapeHtml", () => {
  test("escapes HTML special characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  test("escapes ampersands", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  test("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  test("does not modify clean text", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("sanitizeInput", () => {
  test("trims whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  test("removes control chars and trims", () => {
    expect(sanitizeInput("\x00test\x08 input ")).toBe("test input");
  });

  test("truncates to max length", () => {
    const long = "a".repeat(600);
    expect(sanitizeInput(long, 100).length).toBe(100);
  });

  test("uses default max length of 500", () => {
    const long = "b".repeat(1000);
    expect(sanitizeInput(long).length).toBe(500);
  });
});

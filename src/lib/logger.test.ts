import { describe, it, expect, vi } from "vitest";
import { createLogger } from "./logger";

describe("createLogger", () => {
  it("creates a logger with all methods", () => {
    const logger = createLogger("test");
    expect(logger.debug).toBeTypeOf("function");
    expect(logger.info).toBeTypeOf("function");
    expect(logger.warn).toBeTypeOf("function");
    expect(logger.error).toBeTypeOf("function");
  });

  it("logs error messages to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createLogger("auth");
    logger.error("login failed", { userId: "123" });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("ERROR");
    expect(spy.mock.calls[0][0]).toContain("[auth]");
    expect(spy.mock.calls[0][0]).toContain("login failed");
    spy.mockRestore();
  });

  it("logs warn messages to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = createLogger("rate-limit");
    logger.warn("rate limit exceeded");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("WARN");
    spy.mockRestore();
  });

  it("includes context in all log messages", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("asistencia");
    logger.info("record created");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("[asistencia]");
    spy.mockRestore();
  });

  it("serializes data as JSON", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("test");
    logger.info("event", { dia: 1, sesion: 2 });
    expect(spy.mock.calls[0][0]).toContain('"dia":1');
    spy.mockRestore();
  });
});

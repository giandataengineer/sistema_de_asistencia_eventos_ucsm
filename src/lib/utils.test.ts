import { describe, it, expect } from "vitest";
import { formatDatePeru, formatTimePeru, formatDateTimePeru, fullName } from "./utils";

describe("formatDatePeru", () => {
  it("formats a date in dd/mm/yyyy format", () => {
    const date = new Date("2026-08-01T12:00:00Z");
    const result = formatDatePeru(date);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("formatTimePeru", () => {
  it("returns HH:MM:SS format", () => {
    const date = new Date("2026-08-01T18:30:00Z");
    const result = formatTimePeru(date);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe("formatDateTimePeru", () => {
  it("combines date and time", () => {
    const date = new Date("2026-08-01T18:30:00Z");
    const result = formatDateTimePeru(date);
    expect(result).toContain("/");
    expect(result).toContain(":");
  });
});

describe("fullName", () => {
  it("combines all parts", () => {
    expect(fullName("GARCIA", "LOPEZ", "JUAN")).toBe("GARCIA LOPEZ JUAN");
  });

  it("handles null apellidoMaterno", () => {
    expect(fullName("GARCIA", null, "JUAN")).toBe("GARCIA JUAN");
  });

  it("handles empty apellidoPaterno gracefully", () => {
    expect(fullName("", null, "JUAN")).toBe("JUAN");
  });
});

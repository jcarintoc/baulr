import { describe, it, expect } from "vitest";
import { formatBytes, formatSpeed, formatDuration } from "@/lib/formatters";

describe("formatBytes", () => {
  it("formats zero bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats kilobytes, megabytes, and gigabytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024 * 5)).toBe("5 MB");
    expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe("2.5 GB");
  });

  it("preserves up to two decimals for fractional gigabytes while omitting trailing zeroes", () => {
    expect(formatBytes(1024 * 1024 * 1024 * 3.31)).toBe("3.31 GB");
    expect(formatBytes(1024 * 1024 * 1024 * 3.01)).toBe("3.01 GB");
    expect(formatBytes(1024 * 1024 * 1024 * 15)).toBe("15 GB");
  });
});

describe("formatSpeed", () => {
  it("formats transfer speed correctly", () => {
    expect(formatSpeed(1024 * 1024 * 12.5)).toBe("12.5 MB/s");
  });
});

describe("formatDuration", () => {
  it("formats seconds, minutes, and hours correctly", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(3665)).toBe("1h 1m");
  });
});

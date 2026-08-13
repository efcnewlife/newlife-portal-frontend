import { describe, expect, it } from "vitest";
import { formatEventTimeClock, formatEventTimeRange } from "./formatEventTime";

const at = (hour: number, minute = 0): Date => new Date(2026, 7, 13, hour, minute, 0, 0);

describe("formatEventTimeClock", () => {
  it("formats English 12h with lowercase period and omits :00", () => {
    expect(formatEventTimeClock(at(13, 0), "en")).toBe("1pm");
    expect(formatEventTimeClock(at(13, 35), "en")).toBe("1:35pm");
    expect(formatEventTimeClock(at(0, 0), "en")).toBe("12am");
    expect(formatEventTimeClock(at(12, 0), "en")).toBe("12pm");
  });

  it("formats non-English as 24h without period", () => {
    expect(formatEventTimeClock(at(13, 0), "zh-TW")).toBe("13");
    expect(formatEventTimeClock(at(13, 35), "zh-TW")).toBe("13:35");
  });
});

describe("formatEventTimeRange", () => {
  it("keeps am/pm only on the end when both times share a period", () => {
    expect(formatEventTimeRange(at(13, 35), at(16, 35), "en")).toBe("1:35 – 4:35pm");
  });

  it("shows both periods when the range crosses noon or midnight", () => {
    expect(formatEventTimeRange(at(11, 30), at(13, 0), "en")).toBe("11:30am – 1pm");
    expect(formatEventTimeRange(at(23, 30), at(1, 0), "en")).toBe("11:30pm – 1am");
  });

  it("omits :00 minutes on either side", () => {
    expect(formatEventTimeRange(at(11, 0), at(13, 0), "en")).toBe("11am – 1pm");
  });

  it("formats non-English ranges in 24h with an en dash", () => {
    expect(formatEventTimeRange(at(13, 35), at(16, 35), "zh-TW")).toBe("13:35 – 16:35");
    expect(formatEventTimeRange(at(11, 30), at(13, 0), "zh-CN")).toBe("11:30 – 13");
  });
});

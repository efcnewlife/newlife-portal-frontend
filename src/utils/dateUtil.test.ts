import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sync_dayjs_locale } from "@/i18n/dayjs_locale_sync";
import { DateUtil } from "./dateUtil";

const FIXED_NOW = new Date("2026-08-12T12:00:00.000Z");
const TWO_HOURS_AGO = "2026-08-12T10:00:00.000Z";
const FIVE_MINUTES_LATER = "2026-08-12T12:05:00.000Z";

describe("DateUtil display contract", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    sync_dayjs_locale("en");
  });

  afterEach(() => {
    sync_dayjs_locale("en");
    vi.useRealTimers();
  });

  describe("format", () => {
    it("formats a valid wall-clock datetime with the default pattern", () => {
      expect(DateUtil.format("2026-03-15 14:30")).toBe("2026-03-15 02:30 PM");
    });

    it("formats an ISO local datetime as wall-clock with the default pattern", () => {
      expect(DateUtil.format("2026-03-15T14:30:00")).toBe("2026-03-15 02:30 PM");
    });

    it("uses DATETIME_DISPLAY_FORMAT when the pattern is omitted", () => {
      expect(DateUtil.DATETIME_DISPLAY_FORMAT).toBe("YYYY-MM-DD hh:mm A");
      expect(DateUtil.format("2026-03-15 14:30")).toBe(
        DateUtil.format("2026-03-15 14:30", DateUtil.DATETIME_DISPLAY_FORMAT)
      );
    });

    it("formats a valid datetime with a custom pattern", () => {
      expect(DateUtil.format("2026-03-15 14:30", "YYYY-MM-DD")).toBe("2026-03-15");
    });

    it("returns undefined for empty values", () => {
      expect(DateUtil.format(null)).toBeUndefined();
      expect(DateUtil.format(undefined)).toBeUndefined();
      expect(DateUtil.format("")).toBeUndefined();
    });

    it("returns undefined for invalid values", () => {
      expect(DateUtil.format("not-a-date")).toBeUndefined();
    });
  });

  describe("friendlyDate", () => {
    it("returns an empty string for empty values", () => {
      expect(DateUtil.friendlyDate(null)).toBe("");
      expect(DateUtil.friendlyDate(undefined)).toBe("");
      expect(DateUtil.friendlyDate("")).toBe("");
    });

    it("returns an empty string for invalid values", () => {
      expect(DateUtil.friendlyDate("not-a-date")).toBe("");
    });

    it("returns English fromNow phrasing for a past instant", () => {
      expect(DateUtil.friendlyDate(TWO_HOURS_AGO)).toBe("2 hours ago");
    });

    it("returns English fromNow phrasing for a near-future instant", () => {
      expect(DateUtil.friendlyDate(FIVE_MINUTES_LATER)).toBe("in 5 minutes");
    });

    it("returns Traditional Chinese fromNow phrasing after switching to zh-TW", () => {
      sync_dayjs_locale("zh-TW");
      expect(DateUtil.friendlyDate(TWO_HOURS_AGO)).toBe("2 小時前");
      expect(DateUtil.friendlyDate(FIVE_MINUTES_LATER)).toBe("5 分鐘內");
    });

    it("returns Simplified Chinese fromNow phrasing after switching to zh-CN", () => {
      sync_dayjs_locale("zh-CN");
      expect(DateUtil.friendlyDate(TWO_HOURS_AGO)).toBe("2 小时前");
      expect(DateUtil.friendlyDate(FIVE_MINUTES_LATER)).toBe("5 分钟内");
    });
  });
});

import type { ApiResponse } from "@/types/api";
import type { LocaleItem, LocaleListResponse } from "@/api/services/localeService";

const mockLocales: LocaleItem[] = [
  {
    id: "locale-en",
    language_code: "en",
    script_code: null,
    region_code: null,
    name: "English",
    native_name: "English",
    is_active: true,
    is_default: true,
  },
  {
    id: "locale-zh-tw",
    language_code: "zh",
    script_code: null,
    region_code: "TW",
    name: "Traditional Chinese",
    native_name: "繁體中文",
    is_active: true,
    is_default: false,
  },
  {
    id: "locale-zh-cn",
    language_code: "zh",
    script_code: null,
    region_code: "CN",
    name: "Simplified Chinese",
    native_name: "简体中文",
    is_active: true,
    is_default: false,
  },
];

export const listMockLocales = (): ApiResponse<LocaleListResponse> => {
  return {
    success: true,
    code: 200,
    data: { items: mockLocales },
  };
};

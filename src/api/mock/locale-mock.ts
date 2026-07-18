import type { ApiResponse } from "@/types/api";
import type { LocaleItem, LocaleListResponse } from "@/api/services/localeService";

const mockLocales: LocaleItem[] = [
  {
    id: "locale-en",
    languageCode: "en",
    scriptCode: null,
    regionCode: null,
    name: "English",
    nativeName: "English",
    isActive: true,
    isDefault: true,
  },
  {
    id: "locale-zh-tw",
    languageCode: "zh",
    scriptCode: null,
    regionCode: "TW",
    name: "Traditional Chinese",
    nativeName: "繁體中文",
    isActive: true,
    isDefault: false,
  },
  {
    id: "locale-zh-cn",
    languageCode: "zh",
    scriptCode: null,
    regionCode: "CN",
    name: "Simplified Chinese",
    nativeName: "简体中文",
    isActive: true,
    isDefault: false,
  },
];

export const listMockLocales = (): ApiResponse<LocaleListResponse> => {
  return {
    success: true,
    code: 200,
    data: { items: mockLocales },
  };
};

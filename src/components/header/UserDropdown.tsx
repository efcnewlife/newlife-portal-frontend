import { localeService, userService } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { change_app_language, normalize_locale_code } from "@/i18n";
import { locale_item_to_code } from "@/utils/localeResolve";
import { format_user_display_name } from "@/utils/userDisplayName";
import { Dropdown, DropdownItem, Select, type SelectOptionType } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAccountCircle, MdKeyboardArrowDown, MdLogout, MdPerson } from "react-icons/md";
import { Link, useNavigate } from "react-router";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [localeCodeById, setLocaleCodeById] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { logout, user, refreshUser } = useAuth();
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const { t: tLanguage } = useTranslation("language");
  const [languageOptions, setLanguageOptions] = useState<SelectOptionType[]>([]);

  useEffect(() => {
    const load_locale_options = async () => {
      const response = await localeService.list();
      if (!response.success || !response.data?.items?.length) {
        setLocaleCodeById({});
        setLanguageOptions([]);
        return;
      }
      const options: SelectOptionType[] = response.data.items
        .filter((item) => item.isActive)
        .map((item) => ({
          value: item.id,
          label: item.nativeName || item.name || locale_item_to_code(item),
        }));
      const nextLocaleCodeById = response.data.items.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = locale_item_to_code(item);
        return acc;
      }, {});
      setLocaleCodeById(nextLocaleCodeById);
      setLanguageOptions(options);
    };

    void load_locale_options();
  }, [tLanguage]);

  const selectedLanguage = useMemo(() => {
    if (user?.preferredLocaleId) {
      return user.preferredLocaleId;
    }
    const normalized = normalize_locale_code(i18n.language);
    if (!normalized) {
      return undefined;
    }
    const matchedLocaleId = Object.entries(localeCodeById).find(
      ([, code]) => normalize_locale_code(code) === normalized
    )?.[0];
    return matchedLocaleId;
  }, [i18n.language, localeCodeById, user?.preferredLocaleId]);

  const display_name = useMemo(() => (user ? format_user_display_name(user) : "Anonymous"), [user]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      closeDropdown();
      navigate("/signin", { replace: true });
    }
  };
  return (
    <div className="relative">
      <button onClick={toggleDropdown} className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400">
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <MdAccountCircle size={44} className="text-gray-500 dark:text-gray-400" />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{display_name}</span>
        <MdKeyboardArrowDown
          size={18}
          className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">{display_name}</span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              LinkComponent={Link}
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <MdPerson
                size={24}
                className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
              />
              User Profile
            </DropdownItem>
          </li>
          <li className="px-3 pt-2">
            <Select
              id="user-language"
              label={tLanguage("label")}
              size="sm"
              labels={{
                selectPlaceholder: t("common:selectPlaceholder"),
                clearSelection: t("common:clearSelection"),
                toggleOptions: t("common:toggleOptions"),
                searchOptions: t("common:searchOptions"),
                noOptions: t("common:noOptions"),
              }}
              options={languageOptions}
              value={selectedLanguage}
              onChange={async (value) => {
                if (typeof value === "string") {
                  try {
                    await userService.updateCurrentUserPreferredLocale(value);
                    const localeCode = localeCodeById[value];
                    if (localeCode) {
                      await change_app_language(localeCode);
                    }
                    await refreshUser();
                  } catch (error) {
                    console.warn("Failed to update preferred language:", error);
                  }
                }
              }}
            />
          </li>
        </ul>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <MdLogout
            size={24}
            className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
          />
          Logout
        </button>
      </Dropdown>
    </div>
  );
}

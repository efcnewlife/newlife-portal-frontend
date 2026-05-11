import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import { MdKeyboardArrowDown, MdMoreHoriz, MdRefresh } from "react-icons/md";
import { ENV_CONFIG } from "@/config/env";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../context/SidebarContext";
import { useNavigationItems } from "../hooks/useNavigationItems";
import { initializeRoutes } from "../routes";

// Initialize route system
initializeRoutes();

// Dynamic navigation item type
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; icon?: React.ReactNode }[];
};

/** Spinning loader for sidebar label slots (matches refresh-style spinners elsewhere). */
const SidebarNavTextSpinner = () => (
  <span className="inline-flex shrink-0 items-center" aria-hidden>
    <MdRefresh className="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500" />
  </span>
);

const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
  const location = useLocation();
  const { mainNavItems, systemNavItems, isLoading: menus_loading } = useNavigationItems();
  const menus_refreshing = menus_loading && (mainNavItems.length > 0 || systemNavItems.length > 0);
  const menus_initial_skeleton = menus_loading && mainNavItems.length === 0 && systemNavItems.length === 0;

  // Auto-close sidebar on mobile after route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "system";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "system"].forEach((menuType) => {
      const items = menuType === "main" ? mainNavItems : systemNavItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "system",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, mainNavItems, systemNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "system") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.type === menuType && prevOpenSubmenu.index === index) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const collapsed_xl_nav = !isExpanded && !isHovered;

  const render_nav_skeleton_rows = () => (
    <ul className="flex flex-col gap-1">
      {[0, 1, 2].map((idx) => (
        <li key={idx}>
          <div className={`menu-item group menu-item-inactive cursor-default ${collapsed_xl_nav ? "xl:justify-center" : "xl:justify-start"}`}>
            <span className="menu-item-icon-size inline-flex items-center justify-center shrink-0">
              <MdRefresh className="h-5 w-5 animate-spin text-gray-300 dark:text-gray-600" aria-hidden />
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text inline-flex flex-1 min-w-0 items-center">
                <SidebarNavTextSpinner />
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  const renderMenuItems = (items: NavItem[], menuType: "main" | "system") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"
              } cursor-pointer ${collapsed_xl_nav ? "xl:justify-center" : "xl:justify-start"}`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text inline-flex flex-1 min-w-0 items-center">
                  {menus_refreshing ? <SidebarNavTextSpinner /> : nav.name}
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <MdKeyboardArrowDown
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link to={nav.path} className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}>
                <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text inline-flex flex-1 min-w-0 items-center">
                    {menus_refreshing ? <SidebarNavTextSpinner /> : nav.name}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index ? `${subMenuHeight[`${menuType}-${index}`]}px` : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.icon && <span className="mr-2 inline-flex items-center">{subItem.icon}</span>}
                      <span className="inline-flex min-w-0 flex-1 items-center">
                        {menus_refreshing ? <SidebarNavTextSpinner /> : subItem.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed  flex flex-col  top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8  flex ${!isExpanded && !isHovered ? "xl:justify-center" : "justify-start"}`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-2">
              <img src="/images/logo/logo.png" alt="Logo" className="rounded-lg w-10 h-10" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">{ENV_CONFIG.APP_NAME}</span>
            </div>
          ) : (
            <img src="/images/logo/logo.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? t("common:menu") : <MdMoreHoriz className="size-6" />}
              </h2>
              {menus_initial_skeleton ? render_nav_skeleton_rows() : renderMenuItems(mainNavItems, "main")}
            </div>
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? t("common:system") : <MdMoreHoriz />}
              </h2>
              {menus_initial_skeleton ? render_nav_skeleton_rows() : renderMenuItems(systemNavItems, "system")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;

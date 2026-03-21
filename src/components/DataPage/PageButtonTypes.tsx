import { Verb } from "@/const/enums";
import i18n from "@/i18n";
import { ReactNode } from "react";
import {
  MdAdd,
  MdContentCopy,
  MdDelete,
  MdDownload,
  MdEdit,
  MdFileDownload,
  MdOutlineRecycling,
  MdRefresh,
  MdRestore,
  MdSearch,
  MdVisibility,
} from "react-icons/md";
import { PageButtonType, PopoverType } from "./types";

// Built-in button types
export enum PAGE_BUTTON_TYPES {
  ADD = "add",
  REFRESH = "refresh",
  SEARCH = "search",
  BULK_DELETE = "bulk_delete",
  RECYCLE = "recycle",
  RESTORE = "restore",
  DOWNLOAD = "download",
  EDIT = "edit",
  DELETE = "delete",
  VIEW = "view",
  COPY = "copy",
  EXPORT = "export",
}

export type PageButtonTypeKey = (typeof PAGE_BUTTON_TYPES)[keyof typeof PAGE_BUTTON_TYPES];

// The style used by the recycle bin button (the same as the original Toolbar consistent)
export const getRecycleButtonClassName = (active: boolean): string => {
  return active
    ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
    : "border border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500/10";
};

// Built-in button icon (use react-icons/md）
export const getPageButtonIcon = (type: PageButtonTypeKey): ReactNode => {
  const icons: Record<PageButtonTypeKey, ReactNode> = {
    [PAGE_BUTTON_TYPES.ADD]: <MdAdd className="size-4" />,
    [PAGE_BUTTON_TYPES.REFRESH]: <MdRefresh className="w-4 h-4" />,
    [PAGE_BUTTON_TYPES.SEARCH]: <MdSearch className="size-4" />,
    [PAGE_BUTTON_TYPES.BULK_DELETE]: <MdDelete className="size-4" />,
    [PAGE_BUTTON_TYPES.RECYCLE]: <MdOutlineRecycling className="size-4" />,
    [PAGE_BUTTON_TYPES.RESTORE]: <MdRestore className="size-4" />,
    [PAGE_BUTTON_TYPES.DOWNLOAD]: <MdDownload className="size-4" />,
    [PAGE_BUTTON_TYPES.EDIT]: <MdEdit className="size-4" />,
    [PAGE_BUTTON_TYPES.DELETE]: <MdDelete className="size-4" />,
    [PAGE_BUTTON_TYPES.VIEW]: <MdVisibility className="size-4" />,
    [PAGE_BUTTON_TYPES.COPY]: <MdContentCopy className="size-4" />,
    [PAGE_BUTTON_TYPES.EXPORT]: <MdFileDownload className="size-4" />,
  };

  return icons[type];
};

// Built-in button text
export const getPageButtonText = (type: PageButtonTypeKey): string => {
  const texts: Record<PageButtonTypeKey, string> = {
    [PAGE_BUTTON_TYPES.SEARCH]: i18n.t("common.search"),
    [PAGE_BUTTON_TYPES.ADD]: i18n.t("common.create"),
    [PAGE_BUTTON_TYPES.REFRESH]: i18n.t("common.refresh"),
    [PAGE_BUTTON_TYPES.BULK_DELETE]: i18n.t("common.delete"),
    [PAGE_BUTTON_TYPES.RECYCLE]: i18n.t("common.delete"),
    [PAGE_BUTTON_TYPES.RESTORE]: i18n.t("common.restore"),
    [PAGE_BUTTON_TYPES.DOWNLOAD]: i18n.t("common.view"),
    [PAGE_BUTTON_TYPES.EDIT]: i18n.t("common.edit"),
    [PAGE_BUTTON_TYPES.DELETE]: i18n.t("common.delete"),
    [PAGE_BUTTON_TYPES.VIEW]: i18n.t("common.view"),
    [PAGE_BUTTON_TYPES.COPY]: i18n.t("common.view"),
    [PAGE_BUTTON_TYPES.EXPORT]: i18n.t("common.view"),
  };

  return texts[type];
};

// The default permission verb corresponding to the button type
const getDefaultPermission = (type: PageButtonTypeKey): string | undefined => {
  const permissionMap: Partial<Record<PageButtonTypeKey, string>> = {
    [PAGE_BUTTON_TYPES.SEARCH]: Verb.Read,
    [PAGE_BUTTON_TYPES.ADD]: Verb.Create,
    [PAGE_BUTTON_TYPES.REFRESH]: Verb.Read,
    [PAGE_BUTTON_TYPES.BULK_DELETE]: Verb.Delete,
    [PAGE_BUTTON_TYPES.RECYCLE]: Verb.Delete,
    [PAGE_BUTTON_TYPES.RESTORE]: Verb.Modify,
    [PAGE_BUTTON_TYPES.EDIT]: Verb.Modify,
    [PAGE_BUTTON_TYPES.DELETE]: Verb.Delete,
    [PAGE_BUTTON_TYPES.VIEW]: Verb.Read,
    // DOWNLOAD, COPY, EXPORT No default permissions (optional)
  };

  return permissionMap[type];
};

// Create a factory function for built-in buttons
export const createPageButton = (type: PageButtonTypeKey, onClick: () => void, options: Partial<PageButtonType> = {}): PageButtonType => {
  const defaultPermission = getDefaultPermission(type);
  const { permission, ...restOptions } = options;

  return {
    key: type,
    text: getPageButtonText(type),
    icon: getPageButtonIcon(type),
    onClick,
    size: "md",
    // if options not specified in permission，then use default permissions
    // if options specified in permission（string), use it
    // if options specified in permission: undefined，then remove permissions (do not check permissions)
    permission: permission ?? defaultPermission,
    ...restOptions,
  };
};

export class CommonPageButton {
  static SEARCH = (
    popoverCallback: (props: {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      trigger: ReactNode;
      popover: PopoverType;
    }) => ReactNode,
    options: Partial<PageButtonType> = {}
  ) => {
    return createPageButton(PAGE_BUTTON_TYPES.SEARCH, () => {}, {
      align: "left",
      tooltip: i18n.t("common.search"),
      popoverCallback,
      ...options,
    });
  };

  static ADD = (onClick: () => void, options: Partial<PageButtonType> = {}) => {
    return createPageButton(PAGE_BUTTON_TYPES.ADD, onClick, {
      variant: "primary",
      align: "left",
      ...options,
    });
  };

  static REFRESH = (onClick: () => void, options: Partial<PageButtonType> = {}) => {
    return createPageButton(PAGE_BUTTON_TYPES.REFRESH, onClick, {
      outline: true,
      align: "right",
      ...options,
    });
  };

  static BULK_DELETE = (onClick: () => void, options: Partial<PageButtonType> = {}) => {
    return createPageButton(PAGE_BUTTON_TYPES.BULK_DELETE, onClick, {
      variant: "danger",
      outline: true,
      align: "right",
      tooltip: i18n.t("common.delete"),
      ...options,
    });
  };
  static RECYCLE = (onClick: () => void, options: Partial<PageButtonType> = {}) => {
    return createPageButton(PAGE_BUTTON_TYPES.RECYCLE, onClick, {
      align: "right",
      tooltip: i18n.t("common.delete"),
      ...options,
    });
  };

  static RESTORE = (onClick: () => void, options: Partial<PageButtonType> = {}) => {
    return createPageButton(PAGE_BUTTON_TYPES.RESTORE, onClick, {
      align: "left",
      tooltip: i18n.t("common.restore"),
      ...options,
    });
  };
}

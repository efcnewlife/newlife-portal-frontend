import { Verb } from "@/const/enums";
import i18n from "@/i18n";
import { ReactNode } from "react";
import { MdArrowDownward, MdArrowUpward, MdDelete, MdEdit, MdRestore, MdVisibility } from "react-icons/md";
import { MenuButtonType } from "./types";

// Built-in row operation types
export enum ROW_ACTION_TYPES {
  VIEW = "view",
  EDIT = "edit",
  DELETE = "delete",
  RESTORE = "restore",
}

export type RowActionTypeKey = (typeof ROW_ACTION_TYPES)[keyof typeof ROW_ACTION_TYPES];

// Built-in row action icons (use react-icons/md）
export const getRowActionIcon = (type: RowActionTypeKey): ReactNode => {
  const icons: Record<RowActionTypeKey, ReactNode> = {
    [ROW_ACTION_TYPES.VIEW]: <MdVisibility />,
    [ROW_ACTION_TYPES.EDIT]: <MdEdit />,
    [ROW_ACTION_TYPES.DELETE]: <MdDelete />,
    [ROW_ACTION_TYPES.RESTORE]: <MdRestore />,
  };

  return icons[type];
};

// Built-in line action text
export const getRowActionLabel = (type: RowActionTypeKey): string => {
  const labels: Record<RowActionTypeKey, string> = {
    [ROW_ACTION_TYPES.VIEW]: i18n.t("common.view"),
    [ROW_ACTION_TYPES.EDIT]: i18n.t("common.edit"),
    [ROW_ACTION_TYPES.DELETE]: i18n.t("common.delete"),
    [ROW_ACTION_TYPES.RESTORE]: i18n.t("common.restore"),
  };

  return labels[type];
};

// The default permission verb corresponding to the row operation type
const getDefaultPermission = (type: RowActionTypeKey): string | undefined => {
  const permissionMap: Record<RowActionTypeKey, string> = {
    [ROW_ACTION_TYPES.VIEW]: Verb.Read,
    [ROW_ACTION_TYPES.EDIT]: Verb.Modify,
    [ROW_ACTION_TYPES.DELETE]: Verb.Delete,
    [ROW_ACTION_TYPES.RESTORE]: Verb.Modify,
  };

  return permissionMap[type];
};

// Create factory functions for built-in row operations
export const createRowAction = <T extends Record<string, unknown>>(
  type: RowActionTypeKey,
  onClick: (row: T, index: number) => void,
  options: Partial<MenuButtonType<T>> = {}
): MenuButtonType<T> => {
  const defaultPermission = getDefaultPermission(type);
  const { permission, ...restOptions } = options;

  return {
    key: type,
    text: getRowActionLabel(type),
    icon: getRowActionIcon(type),
    onClick,
    // if options not specified in permission，then use default permissions
    // if options specified in permission（string), use it
    // if options specified in permission: undefined，then remove permissions (do not check permissions)
    permission: permission ?? defaultPermission,
    ...restOptions,
  };
};

export class CommonMenuButton {
  static SEPARATOR = <T extends Record<string, unknown>>(options: Partial<MenuButtonType<T>> = {}): MenuButtonType<T> => {
    return {
      key: "separator",
      text: "",
      icon: null,
      onClick: () => {},
      variant: "default" as const,
      disabled: true,
      render: () => <div className="cursor-default pointer-events-none h-px bg-gray-200 dark:bg-gray-800" />,
      ...options,
    };
  };

  static MOVE_UP = <T extends Record<string, unknown>>(
    onClick: (row: T, index: number) => void,
    options: Partial<MenuButtonType<T>> = {}
  ): MenuButtonType<T> => {
    return {
      key: "move-up",
      text: i18n.t("common.moveUp"),
      icon: <MdArrowUpward />,
      onClick,
      variant: "default" as const,
      ...options,
    };
  };

  static MOVE_DOWN = <T extends Record<string, unknown>>(
    onClick: (row: T, index: number) => void,
    options: Partial<MenuButtonType<T>> = {}
  ): MenuButtonType<T> => {
    return {
      key: "move-down",
      text: i18n.t("common.moveDown"),
      icon: <MdArrowDownward />,
      onClick,
      variant: "default" as const,
      ...options,
    };
  };

  static VIEW = <T extends Record<string, unknown>>(
    onClick: (row: T, index: number) => void,
    options: Partial<MenuButtonType<T>> = {}
  ): MenuButtonType<T> => {
    return createRowAction(ROW_ACTION_TYPES.VIEW, onClick, {
      ...options,
    });
  };

  static EDIT = <T extends Record<string, unknown>>(
    onClick: (row: T, index: number) => void,
    options: Partial<MenuButtonType<T>> = {}
  ): MenuButtonType<T> => {
    return createRowAction(ROW_ACTION_TYPES.EDIT, onClick, {
      ...options,
    });
  };

  static DELETE = <T extends Record<string, unknown>>(
    onClick: (row: T, index: number) => void,
    options: Partial<MenuButtonType<T>> = {}
  ): MenuButtonType<T> => {
    return createRowAction(ROW_ACTION_TYPES.DELETE, onClick, {
      variant: "danger",
      ...options,
    });
  };

  static RESTORE = <T extends Record<string, unknown>>(
    onClick: (row: T, index: number) => void,
    options: Partial<MenuButtonType<T>> = {}
  ): MenuButtonType<T> => {
    return createRowAction(ROW_ACTION_TYPES.RESTORE, onClick, {
      variant: "primary",
      ...options,
    });
  };
}

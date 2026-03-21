import React from "react";
import * as FaIcons from "react-icons/fa";
import * as HiIcons from "react-icons/hi";
import * as IoIcons from "react-icons/io5";
import * as MdIcons from "react-icons/md";

export type IconLibrary = "md" | "fa" | "hi" | "io";

export interface IconResolverOptions {
  library?: IconLibrary;
  className?: string;
  size?: number;
}

export interface IconResolverResult {
  icon: React.ReactNode | null;
  error: string | null;
  isValid: boolean;
}

/**
 * Illustration parser - dynamically generates corresponding icons based on input text
 * @param iconName Icon name (e.g.: "home", "person", "settings")
 * @param options Configuration options
 * @returns IconResolverResult Contains graphical components, error messages and validity
 */
export const resolveIcon = (iconName: string, options: IconResolverOptions = {}): IconResolverResult => {
  const { library = "md", className = "size-5", size } = options;

  if (!iconName?.trim()) {
    return {
      icon: null,
      error: null,
      isValid: true,
    };
  }

  // Select the corresponding icon collection according to the icon library
  const iconMap = {
    md: MdIcons,
    fa: FaIcons,
    hi: HiIcons,
    io: IoIcons,
  };

  const iconSet = iconMap[library];
  if (!iconSet) {
    return {
      icon: null,
      error: `Unsupported icon library: ${library}`,
      isValid: false,
    };
  }

  // Generate schema names and try multiple key name matches
  const originalName = iconName.trim();
  const normalizedName = originalName.toLowerCase();
  const capitalizedName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
  const libPrefix = { md: "Md", fa: "Fa", hi: "Hi", io: "Io" }[library];
  const candidates = [
    originalName, // Direct key name (such as:MdHome）
    `${libPrefix}${capitalizedName}`, // prefix + name (e.g.:MdHome）
    capitalizedName, // Only the first letter of the name is capitalized (in rare cases)
  ];

  // Try to find the diagram component
  const IconComponent = (iconSet as any)[candidates.find((k) => (iconSet as any)[k]) as string];

  if (IconComponent) {
    const iconProps = {
      className,
      ...(size && { size }),
    };

    return {
      icon: <IconComponent {...iconProps} />,
      error: null,
      isValid: true,
    };
  }

  // If the icon cannot be found, an error is returned
  const libraryNames = {
    md: "Material Design",
    fa: "Font Awesome",
    hi: "Heroicons",
    io: "Ionicons",
  };

  return {
    icon: null,
    error: `Can't find the corresponding ${libraryNames[library]} Icon, please enter a valid icon name`,
    isValid: false,
  };
};

/**
 * Hook version - used for React in component
 * @param iconName Icon name
 * @param options Configuration options
 * @returns IconResolverResult
 */
export const useIconResolver = (iconName: string, options: IconResolverOptions = {}): IconResolverResult => {
  const { library = "md", className = "size-5", size } = options;

  return React.useMemo(() => resolveIcon(iconName, { library, className, size }), [iconName, library, className, size]);
};

/**
 * Get a list of available icon libraries
 */
export const getAvailableLibraries = (): IconLibrary[] => {
  return ["md", "fa", "hi", "io"];
};

/**
 * Get the display name of the icon library
 */
export const getLibraryDisplayName = (library: IconLibrary): string => {
  const names = {
    md: "Material Design",
    fa: "Font Awesome",
    hi: "Heroicons",
    io: "Ionicons",
  };
  return names[library];
};

/**
 * Get a list of commonly used icon names (for prompts)
 */
export const getCommonIconNames = (library: IconLibrary = "md"): string[] => {
  const commonIcons = {
    md: [
      "home",
      "person",
      "settings",
      "email",
      "phone",
      "search",
      "menu",
      "close",
      "edit",
      "delete",
      "add",
      "remove",
      "save",
      "cancel",
      "check",
      "warning",
      "error",
      "info",
      "help",
      "star",
      "favorite",
      "share",
      "download",
      "upload",
      "refresh",
      "lock",
      "unlock",
      "visibility",
      "visibilityOff",
    ],
    fa: [
      "home",
      "user",
      "cog",
      "envelope",
      "phone",
      "search",
      "bars",
      "times",
      "edit",
      "trash",
      "plus",
      "minus",
      "save",
      "times",
      "check",
      "exclamation",
      "times",
      "info",
      "question",
      "star",
      "heart",
      "share",
      "download",
      "upload",
      "refresh",
      "lock",
      "unlock",
      "eye",
      "eyeSlash",
    ],
    hi: [
      "home",
      "user",
      "cog",
      "mail",
      "phone",
      "search",
      "menu",
      "x",
      "pencil",
      "trash",
      "plus",
      "minus",
      "save",
      "x",
      "check",
      "exclamation",
      "x",
      "information",
      "question",
      "star",
      "heart",
      "share",
      "download",
      "upload",
      "refresh",
      "lockClosed",
      "lockOpen",
      "eye",
      "eyeSlash",
    ],
    io: [
      "home",
      "person",
      "settings",
      "mail",
      "call",
      "search",
      "menu",
      "close",
      "create",
      "trash",
      "add",
      "remove",
      "save",
      "close",
      "checkmark",
      "warning",
      "close",
      "information",
      "help",
      "star",
      "heart",
      "share",
      "download",
      "cloudUpload",
      "refresh",
      "lockClosed",
      "lockOpen",
      "eye",
      "eyeOff",
    ],
  };

  return commonIcons[library] || [];
};

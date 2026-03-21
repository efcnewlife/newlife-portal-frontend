import { usePermissions } from "@/context/AuthContext";
import PageButton from "./PageButton";
import { PageButtonType } from "./types";

interface PageButtonGroupProps {
  /** button list */
  buttons: PageButtonType[];
  /** display mode */
  mode: "toolbar" | "contextmenu";
  /** Resource name (for permission checking) */
  resource?: string;
  /** Container style class name */
  className?: string;
  /** button spacing */
  gap?: "sm" | "md" | "lg";
  /** Alignment */
  align?: "left" | "right" | "center";
  /** Whether to display dividing lines */
  showDivider?: boolean;
}

export default function PageButtonGroup({
  buttons,
  mode,
  resource,
  className,
  gap = "md",
  align = "left",
  showDivider = false,
}: PageButtonGroupProps) {
  const { hasPermission } = usePermissions();

  // Check button permissions
  const checkButtonPermission = (button: PageButtonType): boolean => {
    // If permissions are not set, allow display
    if (!button.permission || !resource) {
      return true;
    }

    // judge permission Whether it is a complete permission code (including colon)
    // If it is a full permission code (e.g. "system:role:modify"），then use directly
    // If it is a verb (e.g. "modify"），then with resource Spliced ​​into resource:verb
    const permissionCode = button.permission.includes(":") ? button.permission : `${resource}:${button.permission}`;

    // Check permissions
    return hasPermission(permissionCode);
  };

  // Filter visible buttons and sort them
  const visibleButtons = buttons
    .filter((button) => {
      // Check first visible property
      if (button.visible === false) {
        return false;
      }
      // Check permissions again
      return checkButtonPermission(button);
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (visibleButtons.length === 0) {
    return null;
  }

  // spacing style
  const getGapClass = () => {
    switch (gap) {
      case "sm":
        return "gap-1";
      case "lg":
        return "gap-3";
      case "md":
      default:
        return "gap-2";
    }
  };

  // alignment style
  const getAlignClass = () => {
    switch (align) {
      case "right":
        return "justify-end";
      case "center":
        return "justify-center";
      case "left":
      default:
        return "justify-start";
    }
  };

  // container style
  const containerClass = `
    flex ${mode === "contextmenu" ? "flex-col items-stretch" : "items-center"}
    ${getGapClass()}
    ${mode === "toolbar" ? getAlignClass() : ""}
    ${className || ""}
  `.trim();

  return (
    <div className={containerClass}>
      {visibleButtons.map((button, index) => {
        // If the button has render function, use render Function creates elements
        if (button.render) {
          return (
            <div key={button.key}>
              {button.render()}
              {showDivider && index < visibleButtons.length - 1 && <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />}
            </div>
          );
        }

        // Otherwise use PageButton Component render button
        return (
          <div key={button.key}>
            <PageButton button={button} mode={mode} />
            {showDivider && index < visibleButtons.length - 1 && <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// dedicated to Toolbar button group
export function ToolbarButtonGroup({ buttons, resource, className, ...props }: Omit<PageButtonGroupProps, "mode">) {
  return <PageButtonGroup buttons={buttons} mode="toolbar" resource={resource} className={className} {...props} />;
}

// dedicated to ContextMenu button group
export function ContextMenuButtonGroup({ buttons, resource, className, ...props }: Omit<PageButtonGroupProps, "mode">) {
  return <PageButtonGroup buttons={buttons} mode="contextmenu" resource={resource} className={className} {...props} />;
}

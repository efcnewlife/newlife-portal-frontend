import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { MdClose } from "react-icons/md";
import { modalStackManager } from "./modalStack";

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean; // Default to false for backwards compatibility
  title?: string;
  footer?: React.ReactNode; // Footer content (e.g., buttons)
  footerAlign?: "left" | "right";
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export interface ModalFormHandle {
  submit: () => void;
}

export const ModalForm = forwardRef<ModalFormHandle, ModalFormProps>(function ModalForm(
  { isOpen, onClose, children, className, showCloseButton = true, isFullscreen = false, title, footer, footerAlign = "right", onSubmit },
  ref
) {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalIdRef = useRef<ReturnType<typeof modalStackManager.register> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // register/Unregister Modal to the stack
  useEffect(() => {
    if (isOpen) {
      modalIdRef.current = modalStackManager.register();
    } else if (modalIdRef.current) {
      modalStackManager.unregister(modalIdRef.current);
      modalIdRef.current = null;
    }

    return () => {
      if (modalIdRef.current) {
        modalStackManager.unregister(modalIdRef.current);
        modalIdRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalIdRef.current) {
        // Only close the top layer Modal
        if (modalStackManager.isTopModal(modalIdRef.current)) {
          event.stopPropagation();
          event.preventDefault();
          onClose();
        }
      }
    };

    if (isOpen) {
      // Use the capture phase to ensure that the top-level Modal handle events first
      document.addEventListener("keydown", handleEscape, true);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useImperativeHandle(ref, () => ({
    submit: () => {
      formRef.current?.requestSubmit();
    },
  }));

  if (!isOpen) return null;

  const contentClasses = isFullscreen ? "w-full h-full" : "relative w-full rounded-3xl max-h-[90vh] ";

  // if there is footer，use flex layout, let body scrollable,footer fixed at bottom
  const hasFooter = !!footer;
  const contentWrapperClasses = hasFooter ? "flex flex-col bg-white dark:bg-gray-900" : "";

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
      {!isFullscreen && <div className="fixed inset-0 h-full w-full bg-gray-400/60" onClick={onClose}></div>}
      <div ref={modalRef} className={`${contentClasses} ${contentWrapperClasses} ${className}`} onClick={(e) => e.stopPropagation()}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between pb-2 shrink-0">
            {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-red-200 hover:text-red-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-700 dark:hover:text-red-500 sm:h-11 sm:w-11"
              >
                <MdClose className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
        <form ref={formRef} onSubmit={onSubmit} className={hasFooter ? "flex-1 overflow-y-auto min-h-0 p-2" : ""}>
          {children}
        </form>
        {footer && <div className={`flex gap-3 pt-4 shrink-0 ${footerAlign === "left" ? "justify-start" : "justify-end"}`}>{footer}</div>}
      </div>
    </div>
  );
});

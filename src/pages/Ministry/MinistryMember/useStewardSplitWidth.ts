import {useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from "react";

const DEFAULT_RAIL_WIDTH = 300;
const MIN_RAIL_WIDTH = 250;
const MAX_RAIL_WIDTH = 600;

export const useStewardSplitWidth = () => {
  const [railWidth, setRailWidth] = useState(DEFAULT_RAIL_WIDTH);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_RAIL_WIDTH);

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = event.clientX - startXRef.current;
    const next = Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, startWidthRef.current + delta));
    setRailWidth(next);
  }, []);

  const stopDragging = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [onPointerMove, stopDragging]);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      draggingRef.current = true;
      startXRef.current = event.clientX;
      startWidthRef.current = railWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [railWidth],
  );

  return { railWidth, startResize };
};

import { useCallback, useState } from "react";
import { MenuButtonType } from "./types";

interface ContextMenuState<T = unknown> {
  visible: boolean;
  position: { x: number; y: number };
  buttons: MenuButtonType<T>[];
  row?: T;
  index?: number;
}

export const useContextMenu = <T = unknown>() => {
  const [state, setState] = useState<ContextMenuState<T>>({
    visible: false,
    position: { x: 0, y: 0 },
    buttons: [],
    row: undefined,
    index: undefined,
  });

  const showContextMenu = useCallback((event: React.MouseEvent, buttons: MenuButtonType<T>[], row: T, index: number) => {
    event.preventDefault();
    event.stopPropagation();

    setState({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      buttons,
      row,
      index,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const updateButtons = useCallback((buttons: MenuButtonType<T>[]) => {
    setState((prev) => ({
      ...prev,
      buttons,
    }));
  }, []);

  return {
    ...state,
    showContextMenu,
    hideContextMenu,
    updateButtons,
  };
};

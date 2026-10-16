import { useEffect, useRef, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

interface UseWebviewDropOptions {
  disabled?: boolean;
  onDrop: (paths: string[]) => void;
}

export function useWebviewDrop({ disabled, onDrop }: UseWebviewDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const onDropRef = useRef(onDrop);
  const disabledRef = useRef(disabled);

  onDropRef.current = onDrop;
  disabledRef.current = disabled;

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let mounted = true;

    try {
      getCurrentWebview()
        .onDragDropEvent((event) => {
          if (!mounted) return;
          if (event.payload.type === "enter" || event.payload.type === "over") {
            if (!disabledRef.current) setIsDragging(true);
          } else if (event.payload.type === "drop") {
            setIsDragging(false);
            if (!disabledRef.current && event.payload.paths && event.payload.paths.length > 0) {
              onDropRef.current(event.payload.paths);
            }
          } else if (event.payload.type === "leave") {
            setIsDragging(false);
          }
        })
        .then((fn) => {
          if (mounted) unlisten = fn;
          else fn();
        })
        .catch(() => {});
    } catch {}

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
  }, []);

  return { isDragging, setIsDragging };
}

import { useState, useEffect, useCallback, useRef } from "react";
import {
  startMobileReceiver,
  stopMobileReceiver,
  listenMobileFileReceived,
  listenMobileClientConnected,
  MobileReceiverInfo,
  MobileFileReceivedPayload,
} from "@/lib/api/mobile";
import { useTransferStore } from "@/store/useTransferStore";

export type ReceiverState = "idle" | "starting" | "waiting" | "connected" | "receiving" | "error";

export function useMobileReceiver(isOpen: boolean) {
  const [receiverInfo, setReceiverInfo] = useState<MobileReceiverInfo | null>(null);
  const [receiverState, setReceiverState] = useState<ReceiverState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<MobileFileReceivedPayload[]>([]);
  const unlistenFnsRef = useRef<Array<() => void>>([]);

  const stop = useCallback(async () => {
    unlistenFnsRef.current.forEach((fn) => fn());
    unlistenFnsRef.current = [];
    try {
      await stopMobileReceiver();
    } catch {}
    setReceiverInfo(null);
    setReceiverState("idle");
  }, []);

  const start = useCallback(async () => {
    try {
      setReceiverState("starting");
      setError(null);
      const info = await startMobileReceiver();
      setReceiverInfo(info);
      setReceiverState("waiting");

      const unlistenConnected = await listenMobileClientConnected(() => {
        setReceiverState("connected");
      });

      const unlistenFile = await listenMobileFileReceived((payload) => {
        setReceiverState("receiving");
        setReceivedFiles((prev) => [payload, ...prev]);
        useTransferStore.getState().enqueuePaths([payload.filePath]).catch(() => {});
      });

      unlistenFnsRef.current = [unlistenConnected, unlistenFile];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setReceiverState("error");
    }
  }, []);

  useEffect(() => {
    if (isOpen && receiverState === "idle") {
      start();
    }
  }, [isOpen, start, receiverState]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    receiverInfo,
    receiverState,
    error,
    receivedFiles,
    retry: start,
    stop,
  };
}

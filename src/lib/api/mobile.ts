import { commands, MobileReceiverInfo } from "../bindings";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export type { MobileReceiverInfo };

export interface MobileFileReceivedPayload {
  fileName: string;
  filePath: string;
  sizeBytes: number;
}

export interface MobileClientConnectedPayload {
  ip: string;
}

export async function startMobileReceiver(): Promise<MobileReceiverInfo> {
  const res = await commands.startMobileReceiver();
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

export async function stopMobileReceiver(): Promise<void> {
  const res = await commands.stopMobileReceiver();
  if (res.status === "error") throw new Error(res.error);
}

export async function listenMobileFileReceived(
  handler: (payload: MobileFileReceivedPayload) => void
): Promise<UnlistenFn> {
  return listen<MobileFileReceivedPayload>("mobile://file-received", (event) => {
    handler(event.payload);
  });
}

export async function listenMobileClientConnected(
  handler: (payload: MobileClientConnectedPayload) => void
): Promise<UnlistenFn> {
  return listen<MobileClientConnectedPayload>("mobile://client-connected", (event) => {
    handler(event.payload);
  });
}

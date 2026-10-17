import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { commands, RcloneItem } from "@/lib/bindings";

export type RemoteVaultItem = RcloneItem;

export interface DownloadProgress {
  jobId: number;
  path: string;
  name: string;
  transferredBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  status: "downloading" | "completed" | "error";
  error?: string | null;
  destinationDir: string;
}

export async function fetchVaultFiles(): Promise<RemoteVaultItem[]> {
  const result = await commands.listVaultFiles();
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

export async function removeVaultItem(
  itemPath: string,
  isDir: boolean
): Promise<void> {
  const result = await commands.deleteVaultItem(itemPath, isDir);
  if (result.status === "error") {
    throw new Error(result.error);
  }
}

export async function downloadVaultItemToDirectory(
  itemPath: string,
  itemName: string,
  isDir: boolean,
  destinationDir: string
): Promise<number | null> {
  const result = await commands.downloadVaultItem(
    itemPath,
    itemName,
    isDir,
    destinationDir
  );
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

export async function pickDownloadDestination(): Promise<string | null> {
  const result = await commands.pickDestinationFolder();
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

export function listenToDownloadProgress(
  callback: (progress: DownloadProgress) => void
): Promise<UnlistenFn> {
  return listen<DownloadProgress>("vault://download-progress", (event) => {
    callback(event.payload);
  });
}

export async function fetchFileShareLink(path: string): Promise<string> {
  const result = await commands.getFileShareLink(path);
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

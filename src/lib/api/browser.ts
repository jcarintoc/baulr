import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { commands, RcloneItem } from "@/lib/bindings";

export type RemoteVaultItem = RcloneItem & {
  provider?: string;
};

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

const shareLinkCache = new Map<string, string>();

function getShareCacheKey(path: string, provider?: string | null): string {
  return `${provider ?? "vault"}:${path}`;
}

export function clearShareLinkCache(path?: string, provider?: string | null): void {
  if (path) {
    shareLinkCache.delete(getShareCacheKey(path, provider));
    shareLinkCache.delete(path);
  } else {
    shareLinkCache.clear();
  }
}

export async function fetchVaultFiles(path?: string): Promise<RemoteVaultItem[]> {
  const result = await commands.listVaultFiles(path || null);
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

export async function fetchProviderVaultFiles(
  provider: string,
  path?: string
): Promise<RemoteVaultItem[]> {
  const result = await commands.listProviderVaultFiles(provider, path || null);
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

export async function fetchVaultMediaBaseUrl(): Promise<string | null> {
  const result = await commands.getVaultMediaBaseUrl();
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

export async function removeVaultItem(
  itemPath: string,
  isDir: boolean,
  provider?: string | null
): Promise<void> {
  const result = await commands.deleteVaultItem(itemPath, isDir, provider ?? null);
  if (result.status === "error") {
    throw new Error(result.error);
  }
}

export async function createVaultFolder(folderPath: string): Promise<void> {
  const result = await commands.createVaultFolder(folderPath);
  if (result.status === "error") {
    throw new Error(result.error);
  }
}

export async function downloadVaultItemToDirectory(
  itemPath: string,
  itemName: string,
  isDir: boolean,
  destinationDir: string,
  provider?: string | null
): Promise<number | null> {
  const result = await commands.downloadVaultItem(
    itemPath,
    itemName,
    isDir,
    destinationDir,
    provider ?? null
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

export async function fetchFileShareLink(
  path: string,
  provider?: string | null
): Promise<string> {
  const cacheKey = getShareCacheKey(path, provider);
  const cached = shareLinkCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const result = await commands.getFileShareLink(path, provider ?? null);
  if (result.status === "error") {
    throw new Error(result.error);
  }
  shareLinkCache.set(cacheKey, result.data);
  return result.data;
}

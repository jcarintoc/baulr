export type CloudProviderType = "gdrive" | "onedrive" | "dropbox" | "box";

export interface CloudAccount {
  name: string;
  provider: CloudProviderType;
  usedBytes: number;
  totalBytes: number;
  isConnected: boolean;
  needsAuth: boolean;
}

export interface VaultQuota {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  accounts: CloudAccount[];
}

export interface TransferItem {
  id: string;
  fileName: string;
  localPath: string;
  sizeBytes: number;
  transferredBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  status: "queued" | "uploading" | "verifying" | "verified" | "error";
  error?: string;
}

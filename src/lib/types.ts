export type CloudProviderType = "gdrive" | "onedrive" | "dropbox" | "box";

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

import {
  commands,
  InspectPathResult,
  OffloadJobInfo,
  ReclaimResult,
} from "../bindings";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export type { InspectPathResult, OffloadJobInfo, ReclaimResult };

export interface OffloadProgress {
  jobId: number;
  name: string;
  transferredBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  status: "uploading" | "completed" | "error";
  error?: string | null;
  targetProvider?: string | null;
}

export async function inspectLocalPath(path: string): Promise<InspectPathResult> {
  const res = await commands.inspectPath(path);
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

export async function selectOffloadFolder(): Promise<InspectPathResult | null> {
  const res = await commands.pickOffloadFolder();
  if (res.status === "error") throw new Error(res.error);
  return res.data as InspectPathResult | null;
}

export async function startOffloadJob(
  localPath: string,
  targetProvider?: string | null
): Promise<OffloadJobInfo> {
  const res = await commands.startOffload(localPath, targetProvider ?? null);
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}


export async function cancelOffloadJob(jobId: number): Promise<void> {
  const res = await commands.cancelOffload(jobId);
  if (res.status === "error") throw new Error(res.error);
}

export async function reclaimPaths(paths: string[]): Promise<ReclaimResult> {
  const res = await commands.reclaimPaths(paths);
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

export async function listenOffloadProgress(
  handler: (progress: OffloadProgress) => void
): Promise<UnlistenFn> {
  return listen<OffloadProgress>("vault://offload-progress", (event) => {
    handler(event.payload);
  });
}

import { commands, DaemonStatus, CoreStats } from "../bindings";

export async function fetchDaemonStatus(): Promise<DaemonStatus> {
  const res = await commands.getDaemonStatus();
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

export async function fetchCoreStats(): Promise<CoreStats> {
  const res = await commands.getCoreStats();
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

import { commands, DaemonStatus } from "../bindings";

export async function fetchDaemonStatus(): Promise<DaemonStatus> {
  const res = await commands.getDaemonStatus();
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

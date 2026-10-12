import { commands, VaultQuota } from "../bindings";

/**
 * Type-safe IPC wrapper consuming auto-generated Tauri Specta bindings.
 */
export async function fetchVaultQuota(): Promise<VaultQuota> {
  const res = await commands.getVaultQuota();
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

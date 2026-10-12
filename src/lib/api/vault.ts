import { invoke } from "@tauri-apps/api/core";
import { VaultQuota } from "../types";

/**
 * Strict IPC wrapper for Vault commands.
 * Never call invoke() directly inside React components.
 */

export async function fetchVaultQuota(): Promise<VaultQuota> {
  return await invoke<VaultQuota>("get_vault_quota");
}

import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { commands, VaultQuota } from "../bindings";

/**
 * Initiates local loopback OAuth connection for the specified provider.
 * Resolves with the updated VaultQuota when authorization completes.
 */
export async function connectAccount(provider: string): Promise<VaultQuota> {
  const res = await commands.connectAccount(provider);
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

/**
 * Disconnects a cloud account and synchronizes baulr_vault upstreams.
 * Resolves with the updated VaultQuota.
 */
export async function disconnectAccount(provider: string): Promise<VaultQuota> {
  const res = await commands.disconnectAccount(provider);
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

/**
 * Signals Rclone to terminate any active OAuth authorization server.
 */
export async function cancelOAuth(): Promise<void> {
  const res = await commands.cancelOauth();
  if (res.status === "error") throw new Error(res.error);
}

/**
 * Listens for backend notification that browser OAuth completed and setup is finalizing.
 */
export function onOAuthFinalizing(callback: (provider: string) => void): Promise<UnlistenFn> {
  return listen<string>("oauth:finalizing", (event) => {
    callback(event.payload);
  });
}

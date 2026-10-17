import { commands, BandwidthLimit } from "../bindings";

export async function fetchBandwidthLimit(): Promise<BandwidthLimit> {
  const res = await commands.getBandwidthLimit();
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

export async function updateBandwidthLimit(rate: string): Promise<BandwidthLimit> {
  const res = await commands.setBandwidthLimit(rate);
  if (res.status === "error") throw new Error(res.error);
  return res.data;
}

import {
  createTokenSource,
  type FirstSyncChoice,
  sync,
  type SyncResult,
} from "@gamerdexapp/gamerdex-sync";
import type { AppData } from "@/types/app";
import { parseBackup } from "@/service/backup";
import { buildingLevelOrders } from "@/data/game/syncOrders";
import { deviceStore, SYNC_APP_ID } from "./device";
import {
  authEndpoint,
  createProvider,
  providerOf,
  type SyncProviderId,
} from "./providers";
import { createSyncSchema } from "./schema";

export const syncSchema = createSyncSchema(buildingLevelOrders);

export const isDataWhole = (data: unknown) =>
  parseBackup(JSON.stringify(data)).ok;

export const tokenSource = (provider: SyncProviderId) =>
  createTokenSource({
    endpoint: authEndpoint(provider),
    load: () => deviceStore.load().tokens,
    save: (tokens) => deviceStore.update({ tokens }),
    now: Date.now,
  });

export const runSync = (
  local: AppData,
  firstSync?: FirstSyncChoice,
): Promise<SyncResult> => {
  const device = deviceStore.load();
  const id = providerOf(device);
  const provider = id && createProvider(id, device, tokenSource(id).getToken);
  if (!provider) throw new Error("No storage is chosen."); // i18n-ignore
  return sync({
    appId: SYNC_APP_ID,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    provider,
    schema: syncSchema,
    local,
    state: device.state,
    firstSync,
    validate: isDataWhole,
    now: () => new Date().toISOString(),
  });
};

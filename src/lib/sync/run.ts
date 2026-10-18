import {
  createTokenSource,
  type FirstSyncChoice,
  GitHubProvider,
  sync,
  type SyncResult,
} from "@gamerdexapp/gamerdex-sync";
import type { AppData } from "@/types/app";
import { parseBackup } from "@/service/backup";
import { buildingLevelOrders } from "@/data/game/syncOrders";
import { deviceStore, SYNC_APP_ID } from "./device";
import { createSyncSchema } from "./schema";

export const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_GAMERDEX_AUTH_URL ?? "";

export const syncSchema = createSyncSchema(buildingLevelOrders);

export const isDataWhole = (data: unknown) =>
  parseBackup(JSON.stringify(data)).ok;

export const tokenSource = () =>
  createTokenSource({
    endpoint: AUTH_ENDPOINT,
    load: () => deviceStore.load().tokens,
    save: (tokens) => deviceStore.update({ tokens }),
    now: Date.now,
  });

export const runSync = (
  local: AppData,
  firstSync?: FirstSyncChoice,
): Promise<SyncResult> => {
  const device = deviceStore.load();
  if (!device.repository) throw new Error("No repository is chosen."); // i18n-ignore
  return sync({
    appId: SYNC_APP_ID,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    provider: new GitHubProvider({
      repository: device.repository,
      getToken: tokenSource().getToken,
    }),
    schema: syncSchema,
    local,
    state: device.state,
    firstSync,
    validate: isDataWhole,
    now: () => new Date().toISOString(),
  });
};

import {
  authorizeUrl,
  GitHubProvider,
  googleAuthorizeUrl,
  GoogleDriveProvider,
  type SyncProvider,
} from "@gamerdexapp/gamerdex-sync";
import type { DeviceSync } from "./device";

export type SyncProviderId = "github" | "google";

const AUTH_URL = process.env.NEXT_PUBLIC_GAMERDEX_AUTH_URL ?? "";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/** The sign in service without a provider, so a value that ends in /github or /google still works. */
const authBase = AUTH_URL.replace(/\/+$/, "").replace(/\/(github|google)$/, "");

/** The providers that this build can sign in with. Google needs its own client ID. */
export const availableProviders: SyncProviderId[] = !authBase
  ? []
  : GOOGLE_CLIENT_ID
    ? ["github", "google"]
    : ["github"];

export const authEndpoint = (provider: SyncProviderId) =>
  `${authBase}/${provider}`;

/** A device that signed in before there was a choice of providers used GitHub. */
export const providerOf = (device: DeviceSync): SyncProviderId | null =>
  device.provider ?? (device.tokens ? "github" : null);

export const signInUrl = (
  provider: SyncProviderId,
  redirectUri: string,
  state: string,
) =>
  provider === "github"
    ? authorizeUrl(redirectUri, state)
    : googleAuthorizeUrl(GOOGLE_CLIENT_ID, redirectUri, state);

/** Returns null while the provider still needs a setting, such as the repository of GitHub. */
export const createProvider = (
  provider: SyncProviderId,
  device: DeviceSync,
  getToken: () => Promise<string>,
): SyncProvider | null => {
  if (provider === "google") return new GoogleDriveProvider({ getToken });
  return device.repository
    ? new GitHubProvider({ repository: device.repository, getToken })
    : null;
};

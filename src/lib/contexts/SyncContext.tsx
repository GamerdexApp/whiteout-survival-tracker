"use client";

import {
	authorizeUrl,
	type Conflict,
	type FirstSyncChoice,
	type InstalledRepository,
	installUrl,
	listInstalledRepositories,
	newState,
	ProviderError,
	readCallback,
	RemoteDataError,
	resolveConflict,
	type Side,
	SyncBusyError,
} from "@gamerdexapp/gamerdex-sync";
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import type { AppData } from "@/types/app";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import { deviceStore } from "@/lib/sync/device";
import { AUTH_ENDPOINT, runSync, syncSchema, tokenSource } from "@/lib/sync/run";
import { storageService } from "@/service/storage";

const AUTO_SYNC_DELAY_MS = 4000;

export type SyncStatus =
	| "signedOut"
	| "needsRepository"
	| "idle"
	| "syncing"
	| "offline"
	| "reauth"
	| "needsChoice"
	| "error";

export type SyncErrorKind =
	"rateLimit" | "notFound" | "forbidden" | "server" | "data" | "busy" | "other";

export interface PendingChoice {
	local: AppData;
	remote: AppData;
}

export type CallbackOutcome = "ok" | "denied" | "state" | "missing" | "failed";

interface SyncContextType {
	/** False when this build has no sign in service address, so syncing is not offered. */
	available: boolean;
	status: SyncStatus;
	errorKind: SyncErrorKind | null;
	/** The HTTP status of the provider answer that failed the sync, when there is one. */
	errorStatus: number | null;
	repository: string | null;
	lastSyncAt: string | null;
	conflicts: Conflict[];
	pendingChoice: PendingChoice | null;
	signIn: () => void;
	installApp: () => void;
	completeSignIn: (search: string) => Promise<CallbackOutcome>;
	listRepositories: () => Promise<InstalledRepository[]>;
	chooseRepository: (fullName: string) => void;
	syncNow: (firstSync?: FirstSyncChoice) => Promise<void>;
	keepLocalValue: (conflict: Conflict) => void;
	dismissConflicts: () => void;
	signOut: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const callbackUri = () => `${window.location.origin}/sync/callback`;

interface Failure {
	status: SyncStatus;
	kind: SyncErrorKind | null;
	httpStatus: number | null;
}

const errorKindOf = (error: unknown): Failure => {
	if (error instanceof ProviderError) {
		const httpStatus = error.status ?? null;
		if (error.kind === "network") return { status: "offline", kind: null, httpStatus };
		if (error.kind === "auth" && httpStatus === 403) {
			return { status: "error", kind: "forbidden", httpStatus };
		}
		if (error.kind === "auth") return { status: "reauth", kind: null, httpStatus };
		if (error.kind === "rate-limit") return { status: "error", kind: "rateLimit", httpStatus };
		if (error.kind === "not-found") return { status: "error", kind: "notFound", httpStatus };
		if (error.kind === "server") return { status: "error", kind: "server", httpStatus };
		return { status: "error", kind: "data", httpStatus };
	}
	if (error instanceof RemoteDataError)
		return { status: "error", kind: "data", httpStatus: null };
	if (error instanceof SyncBusyError) return { status: "error", kind: "busy", httpStatus: null };
	return { status: "error", kind: "other", httpStatus: null };
};

const withValidActiveChief = (data: AppData): AppData =>
	data.playthroughs.some((chief) => chief.id === data.activePlaythroughId)
		? data
		: { ...data, activePlaythroughId: data.playthroughs[0]?.id ?? null };

export function SyncProvider({ children }: { children: React.ReactNode }) {
	const appData = useSyncExternalStore(
		storageService.subscribe,
		storageService.load,
		storageService.loadOnServer
	);
	const device = useSyncExternalStore(
		deviceStore.subscribe,
		deviceStore.load,
		deviceStore.loadOnServer
	);
	const isLoaded = useIsHydrated();
	const [busy, setBusy] = useState(false);
	const [failure, setFailure] = useState<Failure | null>(null);
	const [conflicts, setConflicts] = useState<Conflict[]>([]);
	const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
	const running = useRef(false);
	const rerun = useRef(false);
	const lastSynced = useRef<AppData | null>(null);

	const available = AUTH_ENDPOINT !== "";
	const signedIn = device.tokens !== null;

	const syncNow = useCallback(async (firstSync?: FirstSyncChoice) => {
		if (running.current) return;
		if (!deviceStore.load().repository) return;
		running.current = true;
		setBusy(true);
		try {
			do {
				rerun.current = false;
				const snapshot = storageService.load();
				const result = await runSync(snapshot, firstSync);
				if (storageService.load() !== snapshot) {
					rerun.current = true;
					continue;
				}
				if (result.status === "needs-choice") {
					setPendingChoice({
						local: result.local as AppData,
						remote: result.remote as AppData,
					});
					continue;
				}
				const merged = withValidActiveChief(result.data as AppData);
				if (JSON.stringify(merged) !== JSON.stringify(snapshot)) {
					storageService.save(merged);
				}
				lastSynced.current = storageService.load();
				deviceStore.update({ state: result.state, lastSyncAt: new Date().toISOString() });
				setPendingChoice(null);
				setConflicts(result.conflicts);
				setFailure(null);
			} while (rerun.current);
		} catch (error) {
			console.warn("Sync failed", error); // i18n-ignore
			setFailure(errorKindOf(error));
		} finally {
			running.current = false;
			setBusy(false);
		}
	}, []);

	const ready = isLoaded && available && signedIn && device.repository !== null;

	useEffect(() => {
		if (!ready || pendingChoice) return;
		const timer = window.setTimeout(() => {
			if (lastSynced.current !== storageService.load()) void syncNow();
		}, AUTO_SYNC_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [ready, appData, pendingChoice, syncNow]);

	useEffect(() => {
		if (!ready) return;
		const onOnline = () => void syncNow();
		window.addEventListener("online", onOnline);
		return () => window.removeEventListener("online", onOnline);
	}, [ready, syncNow]);

	const signIn = () => {
		const state = newState();
		deviceStore.update({ signInState: state });
		window.location.href = authorizeUrl(callbackUri(), state);
	};

	const installApp = () => {
		const state = newState();
		deviceStore.update({ signInState: state });
		window.location.href = installUrl(state);
	};

	const completeSignIn = async (search: string): Promise<CallbackOutcome> => {
		const expected = deviceStore.load().signInState;
		deviceStore.update({ signInState: null });
		const callback = readCallback(search, expected);
		if (!callback.ok) return callback.reason;
		try {
			await tokenSource().signIn(callback.code, callbackUri());
			setFailure(null);
			return "ok";
		} catch {
			return "failed";
		}
	};

	const listRepositories = async () => listInstalledRepositories(await tokenSource().getToken());

	const chooseRepository = (fullName: string) => {
		deviceStore.update({ repository: fullName, state: null, lastSyncAt: null });
		setFailure(null);
		void syncNow();
	};

	const keepLocalValue = (conflict: Conflict) => {
		const next = resolveConflict(
			storageService.load(),
			syncSchema,
			conflict,
			"local"
		) as AppData;
		storageService.save(next);
		setConflicts((current) => current.filter((other) => other !== conflict));
	};

	const signOut = () => {
		deviceStore.update({ tokens: null, repository: null, state: null, lastSyncAt: null });
		setFailure(null);
		setConflicts([]);
		setPendingChoice(null);
	};

	let status: SyncStatus = "idle";
	if (failure?.status === "reauth") status = "reauth";
	else if (!signedIn) status = "signedOut";
	else if (!device.repository) status = "needsRepository";
	else if (busy) status = "syncing";
	else if (pendingChoice) status = "needsChoice";
	else if (failure) status = failure.status;

	return (
		<SyncContext.Provider
			value={{
				available,
				status,
				errorKind: failure?.kind ?? null,
				errorStatus: failure?.httpStatus ?? null,
				repository: device.repository,
				lastSyncAt: device.lastSyncAt,
				conflicts,
				pendingChoice,
				signIn,
				installApp,
				completeSignIn,
				listRepositories,
				chooseRepository,
				syncNow,
				keepLocalValue,
				dismissConflicts: () => setConflicts([]),
				signOut,
			}}
		>
			{children}
		</SyncContext.Provider>
	);
}

export function useSync() {
	const context = useContext(SyncContext);
	if (context === undefined) {
		throw new Error("useSync must be used within a SyncProvider"); // i18n-ignore
	}
	return context;
}

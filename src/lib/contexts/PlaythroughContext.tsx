"use client";

import React, { createContext, useContext, useState, useSyncExternalStore } from "react";
import type { AppData } from "@/types/app";
import type { PlaythroughContextType } from "@/types/contexts";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import { storageService } from "@/service/storage";

const PlaythroughContext = createContext<PlaythroughContextType | undefined>(undefined);

export function PlaythroughProvider({ children }: { children: React.ReactNode }) {
	const appData = useSyncExternalStore(
		storageService.subscribe,
		storageService.load,
		storageService.loadOnServer
	);
	const isLoaded = useIsHydrated();
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

	const commit = (update: (current: AppData) => AppData) => {
		storageService.save(update(storageService.load()));
		setLastSavedAt(new Date());
	};

	const activePlaythrough =
		appData.playthroughs.find((p) => p.id === appData.activePlaythroughId) ?? null;

	const setActivePlaythrough = (id: string | null) => {
		commit((current) => ({ ...current, activePlaythroughId: id }));
	};

	const updateSettings: PlaythroughContextType["updateSettings"] = (updates) => {
		commit((current) => ({ ...current, settings: { ...current.settings, ...updates } }));
	};

	return (
		<PlaythroughContext.Provider
			value={{
				playthroughs: appData.playthroughs,
				activePlaythrough,
				settings: appData.settings ?? {},
				isLoaded,
				lastSavedAt,
				setActivePlaythrough,
				updateSettings,
			}}
		>
			{children}
		</PlaythroughContext.Provider>
	);
}

export function usePlaythrough() {
	const context = useContext(PlaythroughContext);
	if (context === undefined) {
		throw new Error("usePlaythrough must be used within a PlaythroughProvider");
	}
	return context;
}

"use client";

import { translator } from "@/i18n/formatter";
import React, { createContext, useContext, useState, useSyncExternalStore } from "react";
import type { AppData } from "@/types/app";
import type { PlaythroughContextType } from "@/types/contexts";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import { downloadBackup } from "@/service/backup";
import { storageService } from "@/service/storage";
import { useToast } from "@/comps/ui/Toast";

const PlaythroughContext = createContext<PlaythroughContextType | undefined>(undefined);

export function PlaythroughProvider({ children }: { children: React.ReactNode }) {
	const appData = useSyncExternalStore(
		storageService.subscribe,
		storageService.load,
		storageService.loadOnServer
	);
	const isLoaded = useIsHydrated();
	const showToast = useToast();
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const [saveFailed, setSaveFailed] = useState(false);

	const updateData: PlaythroughContextType["updateData"] = (update) => {
		const previous = storageService.load();
		const next = update(previous);
		const saved = storageService.save(next);

		setSaveFailed(!saved);
		if (saved) {
			setLastSavedAt(new Date());
		} else {
			const t = translator("common");
			showToast({
				variant: "error",
				title: t("saveFailed.title"),
				message: t("saveFailed.message"),
				action: {
					label: t("saveFailed.exportBackup"),
					onAction: () => downloadBackup(next),
				},
			});
		}
		return saved ? previous : null;
	};

	const activePlaythrough =
		appData.playthroughs.find((p) => p.id === appData.activePlaythroughId) ?? null;

	const setActivePlaythrough = (id: string | null) => {
		updateData((current: AppData) => ({ ...current, activePlaythroughId: id }));
	};

	const updateSettings: PlaythroughContextType["updateSettings"] = (updates) => {
		updateData((current) => ({ ...current, settings: { ...current.settings, ...updates } }));
	};

	return (
		<PlaythroughContext.Provider
			value={{
				appData,
				playthroughs: appData.playthroughs,
				activePlaythrough,
				settings: appData.settings ?? {},
				isLoaded,
				lastSavedAt,
				saveFailed,
				updateData,
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
		throw new Error("usePlaythrough must be used within a PlaythroughProvider"); // i18n-ignore
	}
	return context;
}

"use client";

import { useEffect, useState } from "react";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";

const REFRESH_MS = 30_000;
const MINUTE_MS = 60_000;

const formatSaved = (savedAt: Date | null, now: number) => {
	if (!savedAt) return "Saves automatically";

	const elapsed = now - savedAt.getTime();
	if (elapsed < MINUTE_MS) return "Saved just now";
	if (elapsed < 60 * MINUTE_MS) return `Saved ${Math.floor(elapsed / MINUTE_MS)} min ago`;
	return `Saved ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
};

export function useSavedLabel() {
	const { lastSavedAt, saveFailed } = usePlaythrough();
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), REFRESH_MS);
		return () => clearInterval(timer);
	}, []);

	if (saveFailed) return "Not saved, storage is full";
	return formatSaved(lastSavedAt, Math.max(now, lastSavedAt?.getTime() ?? 0));
}

export function SavedChip() {
	const label = useSavedLabel();

	return (
		<span
			role="status"
			className="border-line bg-surface text-muted inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 text-xs"
		>
			<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
			{label}
		</span>
	);
}

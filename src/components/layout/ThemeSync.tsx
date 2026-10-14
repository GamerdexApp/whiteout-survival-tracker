"use client";

import { useEffect } from "react";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function ThemeSync() {
	const { settings } = usePlaythrough();
	const theme = settings.theme ?? "system";

	useEffect(() => {
		const systemDark = window.matchMedia(DARK_QUERY);
		const apply = () => {
			const dark = theme === "dark" || (theme === "system" && systemDark.matches);
			document.documentElement.classList.toggle("dark", dark);
		};

		apply();
		systemDark.addEventListener("change", apply);
		return () => systemDark.removeEventListener("change", apply);
	}, [theme]);

	return null;
}

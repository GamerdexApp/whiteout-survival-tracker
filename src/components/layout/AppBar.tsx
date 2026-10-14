"use client";

import { usePathname } from "next/navigation";
import { LuMenu } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useUI } from "@/lib/contexts/UIContext";
import { getPageTitle } from "@/data/nav";
import { IconButton } from "@/comps/ui/IconButton";
import { useSavedLabel } from "@/comps/ui/SavedChip";

export function AppBar() {
	const pathname = usePathname();
	const { openDrawer } = useUI();
	const { activePlaythrough } = usePlaythrough();
	const savedLabel = useSavedLabel();
	const subline = [activePlaythrough?.name, savedLabel].filter(Boolean).join(" · ");

	return (
		<header className="border-line bg-surface sticky top-0 z-30 flex h-14 items-center gap-1 border-b-[1.5px] px-2 lg:hidden">
			<IconButton label="Open menu" onClick={openDrawer} className="text-ink hover:bg-tint">
				<LuMenu size={22} aria-hidden="true" />
			</IconButton>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-base font-semibold">{getPageTitle(pathname)}</span>
				<span className="text-muted truncate text-xs">{subline}</span>
			</div>
		</header>
	);
}

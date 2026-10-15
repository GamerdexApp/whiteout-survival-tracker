"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { constructionJobs, researchJobs } from "@/service/queues";
import type { NavItem } from "@/data/nav";
import { isNavItemActive, navGroups, settingsNavItem } from "@/data/nav";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { BrandMark } from "./BrandMark";
import { ChiefSwitcher } from "./ChiefSwitcher";

/**
 * The number of upgrades running for each page, shown beside its name.
 */
function useQueueCounts(): Record<string, number> {
	const { activePlaythrough } = usePlaythrough();
	if (!activePlaythrough) return {};
	return {
		"/buildings": constructionJobs(activePlaythrough).length,
		"/research": researchJobs(activePlaythrough).length,
	};
}

function SidebarLink({
	item,
	count = 0,
	onNavigate,
}: {
	item: NavItem;
	count?: number;
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	const active = isNavItemActive(item, pathname);
	const Icon = item.icon;

	return (
		<Link
			href={item.href}
			onClick={onNavigate}
			aria-current={active ? "page" : undefined}
			className={`flex h-10 items-center gap-2.5 rounded-md px-2.5 lg:h-[34px] ${
				active
					? "bg-sb-active-bg text-sb-active-text font-semibold"
					: "text-sb-text hover:bg-sb-line"
			}`}
		>
			<Icon size={16} aria-hidden="true" className="shrink-0" />
			<span className="flex-1">{item.label}</span>
			{count > 0 && (
				<span
					className={`font-mono text-xs ${active ? "text-sb-active-text" : "text-sb-muted"}`}
				>
					<span aria-hidden="true">{count}</span>
					<span className="sr-only">
						, {count} {count === 1 ? "upgrade" : "upgrades"} running
					</span>
				</span>
			)}
		</Link>
	);
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
	const queueCounts = useQueueCounts();

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 [--ring:var(--color-sb-active-bg)]">
			<BrandMark onNavigate={onNavigate} />
			<ChiefSwitcher onNavigate={onNavigate} />
			<nav aria-label="Main" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
				{navGroups.map((group) => (
					<div key={group.label ?? "top"} className="flex flex-col gap-0.5">
						{group.label && (
							<SectionLabel className="text-sb-muted mt-2 px-2.5 pb-0.5">
								{group.label}
							</SectionLabel>
						)}
						{group.items.map((item) => (
							<SidebarLink
								key={item.href}
								item={item}
								count={queueCounts[item.href]}
								onNavigate={onNavigate}
							/>
						))}
					</div>
				))}
			</nav>
			<div className="border-sb-line border-t-[1.5px] pt-3">
				<SidebarLink item={settingsNavItem} onNavigate={onNavigate} />
			</div>
		</div>
	);
}

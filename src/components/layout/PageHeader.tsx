"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LuBookOpen } from "react-icons/lu";
import { wikiPages } from "@/data/wiki";
import type { WikiPageId } from "@/data/wiki";
import { ButtonLink } from "@/comps/ui/Button";
import { SavedChip } from "@/comps/ui/SavedChip";
import { SyncChip } from "./SyncChip";

interface PageHeaderProps {
	title: string;
	subline?: string;
	actions?: ReactNode;
	/** Shown at the start of the title on desktop. The mobile app bar already names the page. */
	icon?: ReactNode;
	/** The Wiki page to open, for a page whose tabs each have their own Wiki page. */
	wikiPage?: WikiPageId;
}

/** A link to the Wiki page of the data this page edits. Pages with no Wiki page show none. */
function WikiLink({ wikiPage }: { wikiPage?: WikiPageId }) {
	const t = useTranslations("shell.pageHeader");
	const pathname = usePathname();
	const page = wikiPage
		? wikiPages.find((item) => item.id === wikiPage)
		: wikiPages.find((item) => item.trackerHref === pathname);
	if (!page) return null;

	return (
		<ButtonLink href={`/wiki/${page.slug}`} variant="secondary">
			<LuBookOpen size={16} aria-hidden="true" />
			{t("wiki")}
		</ButtonLink>
	);
}

export function PageHeader({ title, subline, actions, icon, wikiPage }: PageHeaderProps) {
	return (
		<header className="flex flex-wrap items-center justify-between gap-4">
			<div className="flex items-center gap-3">
				{icon && <span className="max-lg:hidden">{icon}</span>}
				<div className="flex flex-col">
					<h1 className="text-2xl font-semibold max-lg:sr-only">{title}</h1>
					{subline && <span className="text-muted max-lg:sr-only">{subline}</span>}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				{actions}
				<WikiLink wikiPage={wikiPage} />
				<span className="flex items-center gap-3 max-lg:hidden">
					<SavedChip />
					<SyncChip />
				</span>
			</div>
		</header>
	);
}

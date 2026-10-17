"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { wikiPages } from "@/data/wiki";
import type { WikiPageId } from "@/data/wiki";
import { ButtonLink } from "@/comps/ui/Button";
import { WikiBreadcrumb } from "./WikiBreadcrumb";

interface WikiPageShellProps {
	id: WikiPageId;
	/** One line with the package modules and their record counts, or a line about the record. */
	line: string;
	/** The name of the open record. The shell then shows the record page: Wiki / Page / Record. */
	recordName?: string;
	children: ReactNode;
}

/** The header every Wiki page shares. A Wiki page has no Saved chip because it stores nothing. */
export function WikiPageShell({ id, line, recordName, children }: WikiPageShellProps) {
	const t = useTranslations("wiki");
	const info = wikiPages.find((page) => page.id === id);
	const pageTitle = t(`pages.${id}.title`);
	const steps = recordName
		? [{ label: pageTitle, href: `/wiki/${info?.slug}` }, { label: recordName }]
		: [{ label: pageTitle }];

	return (
		<>
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<WikiBreadcrumb steps={steps} />
					<h1 className="text-2xl font-semibold">{recordName ?? pageTitle}</h1>
					<p className="text-muted">{line}</p>
				</div>
				{info?.trackerHref && (
					<ButtonLink
						href={info.trackerHref}
						variant="secondary"
						className="max-lg:w-full"
					>
						{t("openInTracker")}
					</ButtonLink>
				)}
			</header>
			{children}
		</>
	);
}

"use client";

import { useTranslations } from "next-intl";
import { wikiPages } from "@/data/wiki";
import type { WikiPageId } from "@/data/wiki";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { WikiBreadcrumb } from "./WikiBreadcrumb";

/** Shown when the address names a record the package does not have. */
export function WikiRecordMissing({ id }: { id: WikiPageId }) {
	const t = useTranslations("wiki");
	const slug = wikiPages.find((page) => page.id === id)?.slug;
	const pageTitle = t(`pages.${id}.title`);

	return (
		<>
			<WikiBreadcrumb steps={[{ label: pageTitle, href: `/wiki/${slug}` }]} />
			<EmptyState
				title={t("recordMissing.title")}
				description={t("recordMissing.description")}
				actions={
					<ButtonLink href={`/wiki/${slug}`} variant="secondary">
						{t("recordMissing.back", { page: pageTitle })}
					</ButtonLink>
				}
			/>
		</>
	);
}

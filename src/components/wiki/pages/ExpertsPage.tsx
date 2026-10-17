"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { allExperts, findExpert, relationships } from "@/data/game/experts";
import { ExpertDetail } from "../experts/ExpertDetail";
import { ExpertRelationships } from "../experts/ExpertRelationships";
import { ExpertRoster } from "../experts/ExpertRoster";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

export function ExpertsPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiExperts");

	if (recordId === undefined) {
		return (
			<WikiPageShell
				id="experts"
				line={t("line", {
					experts: formatNumber(allExperts.length),
					relationships: formatNumber(relationships.length),
				})}
			>
				<ExpertRoster />
				<ExpertRelationships />
			</WikiPageShell>
		);
	}

	const expert = findExpert(recordId);
	if (!expert) return <WikiRecordMissing id="experts" />;

	return (
		<WikiPageShell
			id="experts"
			recordName={expert.name}
			line={t("recordLine", {
				title: expert.title,
				specialty: expert.specialty,
				generation: formatNumber(expert.generation),
			})}
		>
			<ExpertDetail expert={expert} />
		</WikiPageShell>
	);
}

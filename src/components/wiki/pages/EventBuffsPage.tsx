"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { allEventBuffs, BUFF_SOURCE_IDS } from "@/data/game/wikiEventBuffs";
import type { BuffApplicability, EventBuff } from "@/data/game/wikiEventBuffs";
import { Card } from "@/comps/ui/Card";
import { ResponsiveTable } from "../parts/ResponsiveTable";
import { RecordSection } from "../records/RecordParts";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

const applicabilityTone: Record<BuffApplicability, string> = {
	yes: "text-kept",
	no: "text-ink",
	partial: "text-changed",
};

function ApplicabilityValue({ value }: { value: BuffApplicability }) {
	const t = useTranslations("wikiEventBuffs.applicability");

	return <span className={applicabilityTone[value]}>{t(value)}</span>;
}

function BuffMatrix() {
	const t = useTranslations("wikiEventBuffs");

	return (
		<RecordSection
			title={t("matrix.title")}
			meta={t("matrix.meta", {
				modes: formatNumber(allEventBuffs.length),
				sources: formatNumber(BUFF_SOURCE_IDS.length),
			})}
		>
			<Card className="hidden overflow-hidden lg:block">
				<table aria-label={t("matrix.table")} className="w-full border-collapse">
					<thead>
						<tr>
							<th
								scope="col"
								className="text-muted px-2 py-2 text-start font-mono text-xs font-normal uppercase"
							>
								{t("matrix.mode")}
							</th>
							{BUFF_SOURCE_IDS.map((source) => (
								<th
									key={source}
									scope="col"
									className="text-muted px-2 py-2 text-start font-mono text-xs font-normal uppercase"
								>
									{t(`sources.${source}.short`)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{allEventBuffs.map((mode) => (
							<tr key={mode.id} className="border-line border-t-[1.5px]">
								<th scope="row" className="px-2 py-2.5 text-start font-semibold">
									{mode.name}
								</th>
								{BUFF_SOURCE_IDS.map((source) => (
									<td key={source} className="px-2 py-2.5">
										<ApplicabilityValue value={mode[source]} />
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</Card>
			<ul aria-label={t("matrix.table")} className="flex flex-col gap-2 lg:hidden">
				{allEventBuffs.map((mode) => (
					<li
						key={mode.id}
						className="border-line bg-surface rounded-md border-[1.5px] p-3"
					>
						<span className="block font-semibold">{mode.name}</span>
						<span className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
							{BUFF_SOURCE_IDS.map((source) => (
								<span key={source} className="block min-w-0">
									<span className="text-muted block font-mono text-xs uppercase">
										{t(`sources.${source}.full`)}
									</span>
									<ApplicabilityValue value={mode[source]} />
								</span>
							))}
						</span>
					</li>
				))}
			</ul>
		</RecordSection>
	);
}

function BuffNotes() {
	const t = useTranslations("wikiEventBuffs");
	const tApplicability = useTranslations("wikiEventBuffs.applicability");

	return (
		<RecordSection title={t("notes.title")}>
			<ResponsiveTable
				label={t("notes.table")}
				titleColumnId="mode"
				rows={allEventBuffs}
				rowKey={(row) => row.id}
				columns={[
					{ id: "mode", header: t("matrix.mode"), render: (row) => row.name },
					{
						id: "auto",
						header: t("notes.petSkillsAutoApplied"),
						render: (row) => tApplicability(row.petSkillsAutoApplied ? "yes" : "no"),
					},
					{
						id: "note",
						header: t("notes.note"),
						render: (row) => row.notes ?? t("notes.noNote"),
						wideOnCard: true,
					},
				]}
			/>
		</RecordSection>
	);
}

export function EventBuffsPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiEventBuffs");

	if (recordId) return <WikiRecordMissing id="eventBuffs" />;

	return (
		<WikiPageShell
			id="eventBuffs"
			line={t("line", {
				modes: formatNumber(allEventBuffs.length),
				sources: formatNumber(BUFF_SOURCE_IDS.length),
			})}
		>
			<BuffMatrix />
			<BuffNotes />
		</WikiPageShell>
	);
}

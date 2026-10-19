"use client";

import type { AllianceTechNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { useStaticUrlTab } from "@/lib/hooks/useUrlTab";
import {
	categoryFilters,
	countOfCategory,
	filterTechNodes,
	tiersOfTech,
} from "@/service/wikiAllianceTech";
import type { TechCategoryFilter } from "@/service/wikiAllianceTech";
import { techNodes } from "@/data/game/alliance";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";
import { Tabs } from "@/comps/ui/Tabs";
import { TechDetail } from "../alliance/TechDetail";
import { TechList } from "../alliance/TechList";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

export function AllianceTechPage({ recordId }: WikiPageProps) {
	return recordId === undefined ? <TechListPage /> : <WikiRecordMissing id="allianceTech" />;
}

function TechListPage() {
	const t = useTranslations("wikiAllianceTech");
	const [category, setCategory] = useStaticUrlTab(categoryFilters, "all");
	const [tier, setTier] = useState<number | null>(null);
	const [query, setQuery] = useState("");
	const [openNode, setOpenNode] = useState<AllianceTechNode>();

	const nodes = filterTechNodes(category, tier, query);

	return (
		<WikiPageShell
			id="allianceTech"
			line={t("line", {
				total: formatNumber(techNodes.length),
				growth: formatNumber(countOfCategory("Growth")),
				territory: formatNumber(countOfCategory("Territory")),
				battle: formatNumber(countOfCategory("Battle")),
			})}
		>
			<RecordSection
				title={t("list.title")}
				meta={t("list.count", { count: nodes.length, amount: formatNumber(nodes.length) })}
			>
				<Tabs
					label={t("list.categoriesLabel")}
					activeId={category}
					onChange={setCategory}
					tabs={categoryFilters.map((id) => ({
						id,
						label: t(`list.categories.${id}`),
						count: countOfCategory(id),
					}))}
				>
					<RecordFilters>
						<Field label={t("list.search")}>
							<Input
								type="search"
								leadingIcon={<LuSearch size={16} />}
								value={query}
								placeholder={t("list.searchPlaceholder")}
								onChange={(event) => setQuery(event.target.value)}
							/>
						</Field>
						<Field label={t("list.tier")}>
							<Select
								value={tier ?? ""}
								onChange={(event) =>
									setTier(
										event.target.value === ""
											? null
											: Number(event.target.value)
									)
								}
							>
								<option value="">{t("list.allTiers")}</option>
								{tiersOfTech.map((value) => (
									<option key={value} value={value}>
										{t("list.tierOption", { tier: formatNumber(value) })}
									</option>
								))}
							</Select>
						</Field>
					</RecordFilters>
					<TechList nodes={nodes} onSelect={setOpenNode} />
				</Tabs>
			</RecordSection>
			{openNode && (
				<Flyout open onClose={() => setOpenNode(undefined)} title={openNode.name}>
					<TechDetail node={openNode} />
				</Flyout>
			)}
		</WikiPageShell>
	);
}

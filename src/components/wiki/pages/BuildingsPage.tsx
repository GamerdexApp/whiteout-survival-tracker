"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { matchesBuildingSearch } from "@/service/wikiBuildings";
import { allBuildings, allFacilities, buildingCategories } from "@/data/game/buildings";
import type { Building } from "@/data/game/wikiBuildings";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { BuildingLevels } from "../buildings/BuildingLevels";
import { RecordFilters } from "../records/RecordParts";
import { UnknownValue } from "../UnknownValue";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

type CategoryFilter = "all" | (typeof buildingCategories)[number];

export function BuildingsPage({ recordId }: WikiPageProps) {
	if (recordId === undefined) return <BuildingsList />;

	const building = allBuildings.find((entry) => entry.id === recordId);
	if (!building) return <WikiRecordMissing id="buildings" />;

	return <BuildingRecord building={building} />;
}

const useBuildingMeta = () => {
	const t = useTranslations("wikiBuildings");

	return (building: Building) =>
		t("list.buildingMeta", {
			category: t(`list.categories.${building.category}`),
			maxLevel: building.maxLevelLabel,
			count: building.levels.length,
			amount: formatNumber(building.levels.length),
		});
};

function BuildingRecord({ building }: { building: Building }) {
	const t = useTranslations("wikiBuildings");
	const buildingMeta = useBuildingMeta();

	return (
		<WikiPageShell id="buildings" recordName={building.name} line={buildingMeta(building)}>
			<Card className="flex flex-col gap-4 p-4">
				<div className="flex items-center gap-3">
					<ItemIcon src={building.img} size={56} />
					{building.description ? <p>{building.description}</p> : <UnknownValue />}
				</div>
				<h2 className="text-lg font-semibold">{t("detail.levels")}</h2>
				<BuildingLevels building={building} />
			</Card>
		</WikiPageShell>
	);
}

function BuildingsList() {
	const t = useTranslations("wikiBuildings");
	const buildingMeta = useBuildingMeta();
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<CategoryFilter>("all");

	const shown = allBuildings.filter(
		(building) =>
			(category === "all" || building.category === category) &&
			matchesBuildingSearch(building.name, search)
	);
	const facilityMatches = allFacilities.filter((facility) =>
		matchesBuildingSearch(facility.name, search)
	);

	const categoryOptions = [
		{
			id: "all" as CategoryFilter,
			label: t("list.categories.all"),
			count: allBuildings.length,
		},
		...buildingCategories.map((id) => ({
			id: id as CategoryFilter,
			label: t(`list.categories.${id}`),
			count: allBuildings.filter((building) => building.category === id).length,
		})),
	];

	return (
		<WikiPageShell
			id="buildings"
			line={t("line", {
				buildings: formatNumber(allBuildings.length),
				facilities: formatNumber(allFacilities.length),
			})}
		>
			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold">{t("list.heading")}</h2>
				<RecordFilters>
					<Field label={t("list.searchLabel")}>
						<Input
							type="search"
							placeholder={t("list.searchPlaceholder")}
							leadingIcon={<LuSearch size={16} />}
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</Field>
					<Field label={t("list.categoryLabel")}>
						<Select
							value={category}
							onChange={(event) => setCategory(event.target.value as CategoryFilter)}
						>
							{categoryOptions.map((option) => (
								<option key={option.id} value={option.id}>
									{t("list.categoryOption", {
										category: option.label,
										count: formatNumber(option.count),
									})}
								</option>
							))}
						</Select>
					</Field>
				</RecordFilters>
				{shown.length === 0 ? (
					<p className="text-muted">{t("list.empty")}</p>
				) : (
					<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{shown.map((building) => (
							<li key={building.id}>
								<Link
									href={`/wiki/buildings/${encodeURIComponent(building.id)}`}
									className="bg-surface border-line hover:border-primary flex min-h-14 w-full items-center gap-3 rounded-md border-[1.5px] p-2"
								>
									<ItemIcon src={building.img} size={40} />
									<span className="flex min-w-0 flex-col">
										<span className="truncate font-semibold">
											{building.name}
										</span>
										<span className="text-muted truncate text-xs">
											{buildingMeta(building)}
										</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold">
					{t("facilities.heading")}{" "}
					<span className="text-muted font-mono text-xs">{t("facilities.meta")}</span>
				</h2>
				{facilityMatches.length === 0 ? (
					<p className="text-muted">{t("facilities.empty")}</p>
				) : (
					<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{facilityMatches.map((facility) => (
							<li key={facility.id}>
								<Card className="flex h-full gap-3 p-3">
									<ItemIcon src={facility.img} size={40} />
									<div className="flex min-w-0 flex-col gap-1">
										<h3 className="font-semibold">{facility.name}</h3>
										<p className="text-muted">{facility.description}</p>
										<p className="text-xs">
											{facility.unlockFurnaceLevel > 0 ? (
												t("facilities.unlock", {
													level: String(facility.unlockFurnaceLevel),
												})
											) : (
												<UnknownValue />
											)}
										</p>
									</div>
								</Card>
							</li>
						))}
					</ul>
				)}
			</section>
		</WikiPageShell>
	);
}

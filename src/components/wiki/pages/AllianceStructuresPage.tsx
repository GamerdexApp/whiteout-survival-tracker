"use client";

import type {
	AllianceBannerLevel,
	AllianceFacility,
	AllianceFortress,
} from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import {
	filterBanners,
	filterFacilities,
	filterFortresses,
	showsBanners,
	showsFacilities,
	showsFortresses,
	structureFilters,
} from "@/service/wikiAllianceStructures";
import type { StructureFilter } from "@/service/wikiAllianceStructures";
import { bannerRanges, facilities, fortresses } from "@/data/game/alliance";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";
import { BannerCard } from "../alliance/BannerCard";
import { BannerDetail } from "../alliance/BannerDetail";
import { FacilityCard, FacilityDetail } from "../alliance/FacilityCard";
import { FortressCard, FortressDetail } from "../alliance/FortressCard";
import { FortressMap } from "../alliance/FortressMap";
import { RecordFilters } from "../records/RecordParts";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

type OpenStructure =
	| { kind: "banner"; range: AllianceBannerLevel }
	| { kind: "facility"; facility: AllianceFacility }
	| { kind: "fortress"; fortress: AllianceFortress };

const nameOf = (open: OpenStructure) =>
	open.kind === "banner"
		? open.range.name
		: open.kind === "facility"
			? open.facility.name
			: open.fortress.name;

function StructureDetail({ open }: { open: OpenStructure }) {
	if (open.kind === "banner") return <BannerDetail range={open.range} />;
	if (open.kind === "facility") return <FacilityDetail facility={open.facility} />;

	return (
		<>
			<FortressDetail fortress={open.fortress} />
			<FortressMap fortresses={fortresses} selectedId={open.fortress.id} />
		</>
	);
}

export function AllianceStructuresPage({ recordId }: WikiPageProps) {
	return recordId === undefined ? (
		<StructuresList />
	) : (
		<WikiRecordMissing id="allianceStructures" />
	);
}

function StructuresList() {
	const t = useTranslations("wikiAllianceStructures");
	const [query, setQuery] = useState("");
	const [structure, setStructure] = useState<StructureFilter>("all");
	const [open, setOpen] = useState<OpenStructure>();

	return (
		<WikiPageShell
			id="allianceStructures"
			line={t("line", {
				banners: formatNumber(bannerRanges.length),
				facilities: formatNumber(facilities.length),
				fortresses: formatNumber(fortresses.length),
			})}
		>
			<RecordFilters>
				<Field label={t("filters.search")}>
					<Input
						type="search"
						leadingIcon={<LuSearch size={16} />}
						value={query}
						placeholder={t("filters.searchPlaceholder")}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</Field>
				<Field label={t("filters.structure")}>
					<Select
						value={structure}
						onChange={(event) => setStructure(event.target.value as StructureFilter)}
					>
						{structureFilters.map((id) => (
							<option key={id} value={id}>
								{t(`filters.structures.${id}`)}
							</option>
						))}
					</Select>
				</Field>
			</RecordFilters>
			{showsBanners(structure) && (
				<BannerCard
					ranges={filterBanners(query)}
					onSelect={(range) => setOpen({ kind: "banner", range })}
				/>
			)}
			{showsFacilities(structure) && (
				<FacilityCard
					facilities={filterFacilities(query)}
					onSelect={(facility) => setOpen({ kind: "facility", facility })}
				/>
			)}
			{showsFortresses(structure) && (
				<FortressCard
					fortresses={filterFortresses(query, structure)}
					onSelect={(fortress) => setOpen({ kind: "fortress", fortress })}
				/>
			)}
			{open && (
				<Flyout open onClose={() => setOpen(undefined)} title={nameOf(open)}>
					<StructureDetail open={open} />
				</Flyout>
			)}
		</WikiPageShell>
	);
}

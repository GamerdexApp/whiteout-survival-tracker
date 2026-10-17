import type { AllianceFacility, AllianceFacilityLevel } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { FACILITY_LEVEL_NUMBERS, facilityLevelAt } from "@/service/wikiAllianceStructures";
import { Note } from "@/comps/ui/Note";
import { CardRows } from "../cost/CardRows";
import { RowButton } from "../cost/RowButton";
import { RecordSection } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";

function LevelCell({ facility, level }: { facility: AllianceFacility; level: number }) {
	const t = useTranslations("wikiAllianceStructures.facilities");
	const entry = facilityLevelAt(facility, level);

	if (!entry) return <UnknownValue />;

	return (
		<span className="flex flex-col max-lg:items-end">
			<span className="font-mono">
				{t("detail.percent", { value: formatNumber(entry.boosterPercent) })}
			</span>
			<span className="text-muted text-xs">
				{t("cell", { available: formatNumber(entry.available) })}
			</span>
		</span>
	);
}

const levelFields: {
	id: "booster" | "injured" | "losses" | "ownLimit" | "available";
	text: (entry: AllianceFacilityLevel, percent: (value: number) => string) => string;
}[] = [
	{ id: "booster", text: (entry, percent) => percent(entry.boosterPercent) },
	{ id: "injured", text: (entry, percent) => percent(entry.heavilyInjuredPercent) },
	{ id: "losses", text: (entry, percent) => percent(entry.lossesPercent) },
	{ id: "ownLimit", text: (entry) => formatNumber(entry.ownLimit) },
	{ id: "available", text: (entry) => formatNumber(entry.available) },
];

export function FacilityDetail({ facility }: { facility: AllianceFacility }) {
	const t = useTranslations("wikiAllianceStructures.facilities");
	const percent = (value: number) => t("detail.percent", { value: formatNumber(value) });

	const columns: RecordColumn<number>[] = [
		{
			id: "level",
			header: t("detail.columns.level"),
			heading: true,
			cell: (number) => (
				<span className="font-mono font-semibold">
					{t("detail.level", { level: formatNumber(number) })}
				</span>
			),
		},
		...levelFields.map(({ id, text }) => ({
			id,
			header: t(`detail.columns.${id}`),
			cell: (number: number) => {
				const entry = facilityLevelAt(facility, number);
				return entry ? (
					<span className="font-mono">{text(entry, percent)}</span>
				) : (
					<UnknownValue />
				);
			},
		})),
		{
			id: "locations",
			header: t("detail.columns.locations"),
			cell: (number) => {
				const entry = facilityLevelAt(facility, number);
				return entry ? (
					<span className="font-mono text-xs">
						{entry.locations
							.map((location) =>
								t("detail.location", {
									x: formatNumber(location.x),
									y: formatNumber(location.y),
								})
							)
							.join(" / ")}
					</span>
				) : (
					<UnknownValue />
				);
			},
		},
	];

	return (
		<RecordSection title={t("detail.title", { name: facility.name })}>
			<Note>
				{t("levelsNote", {
					listed: formatNumber(facility.levels.length),
					total: formatNumber(FACILITY_LEVEL_NUMBERS.length),
				})}
			</Note>
			<CardRows
				columns={columns}
				rows={FACILITY_LEVEL_NUMBERS}
				rowKey={(number) => String(number)}
			/>
		</RecordSection>
	);
}

export function FacilityCard({
	facilities,
	onSelect,
}: {
	facilities: AllianceFacility[];
	onSelect: (facility: AllianceFacility) => void;
}) {
	const t = useTranslations("wikiAllianceStructures");
	const total = FACILITY_LEVEL_NUMBERS.length;

	const columns: RecordColumn<AllianceFacility>[] = [
		{
			id: "facility",
			header: t("facilities.columns.facility"),
			heading: true,
			cell: (facility) => (
				<RowButton onClick={() => onSelect(facility)}>{facility.name}</RowButton>
			),
		},
		{
			id: "bonus",
			header: t("facilities.columns.bonus"),
			cell: (facility) => facility.bonusStat,
		},
		...FACILITY_LEVEL_NUMBERS.map((number) => ({
			id: `level-${number}`,
			header: t("facilities.columns.level", { level: formatNumber(number) }),
			cell: (facility: AllianceFacility) => <LevelCell facility={facility} level={number} />,
		})),
		{
			id: "listed",
			header: t("facilities.columns.listed"),
			cell: (facility) => (
				<span className="font-mono">
					{t("facilities.listedOf", {
						listed: formatNumber(facility.levels.length),
						total: formatNumber(total),
					})}
				</span>
			),
		},
	];

	return (
		<RecordSection
			title={t("facilities.title")}
			meta={t("facilities.count", {
				count: facilities.length,
				amount: formatNumber(facilities.length),
			})}
		>
			{facilities.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<RecordTable
					columns={columns}
					rows={facilities}
					rowKey={(facility) => facility.id}
				/>
			)}
		</RecordSection>
	);
}

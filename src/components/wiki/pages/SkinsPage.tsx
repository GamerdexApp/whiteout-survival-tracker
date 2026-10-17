"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import {
	ANY_STAT,
	bonusStatNames,
	countSkinsOfType,
	filterSkins,
	NO_BONUS,
	skinDuration,
} from "@/service/wikiSkins";
import type { DurationFilter } from "@/service/wikiSkins";
import { allSkins, skinTypes } from "@/data/game/wikiSkins";
import type { Skin, SkinType } from "@/data/game/wikiSkins";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

const DURATION_FILTERS: DurationFilter[] = ["any", "permanent", "timed", "notStated"];

function BonusText({ skin }: { skin: Skin }) {
	const t = useTranslations("wikiSkins");
	if (!skin.bonus) return <UnknownValue />;

	return <>{t("bonusValue", { stat: skin.bonus.stat, value: skin.bonus.value })}</>;
}

function DurationText({ skin }: { skin: Skin }) {
	const duration = skinDuration(skin);
	return duration ?? <UnknownValue />;
}

function SourcesText({ skin }: { skin: Skin }) {
	if (skin.sources.length === 0) return <UnknownValue />;
	return <>{skin.sources.join(", ")}</>;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="border-line grid grid-cols-[7rem_1fr] gap-4 border-t py-2">
			<dt className="text-muted">{label}</dt>
			<dd className="min-w-0 wrap-break-word">{children}</dd>
		</div>
	);
}

function SkinDetail({ skin }: { skin: Skin }) {
	const t = useTranslations("wikiSkins.detail");

	return (
		<>
			<ItemIcon src={skin.img} size={96} />
			<dl>
				<DetailRow label={t("type")}>{skin.skinType}</DetailRow>
				<DetailRow label={t("bonus")}>
					<BonusText skin={skin} />
				</DetailRow>
				<DetailRow label={t("duration")}>
					<DurationText skin={skin} />
				</DetailRow>
				<DetailRow label={t("sources")}>
					<SourcesText skin={skin} />
				</DetailRow>
				<DetailRow label={t("description")}>{skin.description}</DetailRow>
			</dl>
		</>
	);
}

export function SkinsPage({ recordId }: WikiPageProps) {
	if (recordId !== undefined) return <WikiRecordMissing id="skins" />;

	return <SkinsList />;
}

function SkinsList() {
	const t = useTranslations("wikiSkins");
	const [search, setSearch] = useState("");
	const [skinType, setSkinType] = useState<SkinType | undefined>(undefined);
	const [stat, setStat] = useState(ANY_STAT);
	const [duration, setDuration] = useState<DurationFilter>("any");
	const [openSkin, setOpenSkin] = useState<Skin | undefined>(undefined);

	const matches = filterSkins({ search, skinType, stat, duration });
	const line = t("line", {
		skins: t("skinCount", { count: allSkins.length, amount: formatNumber(allSkins.length) }),
		types: t("typeCount", { count: skinTypes.length, amount: formatNumber(skinTypes.length) }),
	});

	const columns: RecordColumn<Skin>[] = [
		{
			id: "skin",
			header: t("columns.skin"),
			heading: true,
			cell: (skin) => (
				<button
					type="button"
					aria-haspopup="dialog"
					onClick={() => setOpenSkin(skin)}
					className="flex min-h-11 w-full items-center gap-2 text-left font-semibold hover:underline lg:min-h-9"
				>
					<ItemIcon src={skin.img} size={32} />
					{skin.name}
				</button>
			),
		},
		{ id: "type", header: t("columns.type"), cell: (skin) => skin.skinType },
		{ id: "bonus", header: t("columns.bonus"), cell: (skin) => <BonusText skin={skin} /> },
		{
			id: "duration",
			header: t("columns.duration"),
			cell: (skin) => <DurationText skin={skin} />,
		},
		{
			id: "sources",
			header: t("columns.sources"),
			cell: (skin) => <SourcesText skin={skin} />,
		},
	];

	return (
		<WikiPageShell id="skins" line={line}>
			<RecordSection
				title={t("gallery.title")}
				meta={t("gallery.showing", {
					shown: formatNumber(matches.length),
					total: formatNumber(allSkins.length),
				})}
			>
				<RecordFilters>
					<Field label={t("gallery.search")}>
						<Input
							type="search"
							value={search}
							placeholder={t("gallery.searchPlaceholder")}
							leadingIcon={<LuSearch size={16} />}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</Field>
					<Field label={t("gallery.bonusStat")}>
						<Select value={stat} onChange={(event) => setStat(event.target.value)}>
							<option value={ANY_STAT}>{t("gallery.anyStat")}</option>
							<option value={NO_BONUS}>{t("gallery.noBonus")}</option>
							{bonusStatNames.map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</Select>
					</Field>
					<Field label={t("gallery.duration")}>
						<Select
							value={duration}
							onChange={(event) => setDuration(event.target.value as DurationFilter)}
						>
							{DURATION_FILTERS.map((id) => (
								<option key={id} value={id}>
									{t(id === "any" ? "gallery.anyDuration" : `gallery.${id}`)}
								</option>
							))}
						</Select>
					</Field>
				</RecordFilters>
				<ul aria-label={t("gallery.types")} className="flex flex-wrap gap-2">
					<TypeChip
						label={t("gallery.allTypes")}
						count={allSkins.length}
						active={skinType === undefined}
						onClick={() => setSkinType(undefined)}
					/>
					{skinTypes.map((type) => (
						<TypeChip
							key={type}
							label={type}
							count={countSkinsOfType(type)}
							active={skinType === type}
							onClick={() => setSkinType(type)}
						/>
					))}
				</ul>
				{matches.length > 0 ? (
					<RecordTable columns={columns} rows={matches} rowKey={(skin) => skin.id} />
				) : (
					<EmptyState
						title={t("gallery.empty.title")}
						description={t("gallery.empty.description")}
					/>
				)}
			</RecordSection>
			{openSkin && (
				<Flyout open onClose={() => setOpenSkin(undefined)} title={openSkin.name}>
					<SkinDetail skin={openSkin} />
				</Flyout>
			)}
		</WikiPageShell>
	);
}

function TypeChip({
	label,
	count,
	active,
	onClick,
}: {
	label: string;
	count: number;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<li>
			<button
				type="button"
				aria-pressed={active}
				onClick={onClick}
				className={`flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-3.5 lg:min-h-9 ${
					active
						? "border-primary bg-tint font-semibold"
						: "border-line text-muted hover:text-ink"
				}`}
			>
				{label}
				<span className="font-mono text-xs">{formatNumber(count)}</span>
			</button>
		</li>
	);
}

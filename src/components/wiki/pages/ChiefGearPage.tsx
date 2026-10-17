"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatDecimal, formatNumber } from "@/lib/format";
import { matchesLadderSearch, summarizeLadder } from "@/service/wikiChiefGear";
import { chiefGearSlotList, gearConverter, gearLevels, gearTiers } from "@/data/game/chiefGear";
import { setBonusRule, setBonusTiers } from "@/data/game/wikiChiefGear";
import type {
	ChiefGearLevel,
	ChiefGearSetBonusTier,
	ChiefGearSlot,
} from "@/data/game/wikiChiefGear";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { ExchangeRates } from "../chief/ExchangeRates";
import { LadderSummary } from "../chief/LadderSummary";
import { ResourceList } from "../tables/ResourceList";
import { StackTable } from "../tables/StackTable";
import type { StackColumn } from "../tables/StackTable";
import { useGameLabels } from "../useGameLabels";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

const tierSummaries = summarizeLadder(gearLevels, (level) => level.tier);
const starValues = [...new Set(gearLevels.map((level) => level.stars))];

export function ChiefGearPage({ recordId }: WikiPageProps) {
	if (recordId !== undefined) return <WikiRecordMissing id="chiefGear" />;

	return <ChiefGearList />;
}

const rarityIds = (slot: ChiefGearSlot) =>
	Object.keys(slot.images) as (keyof ChiefGearSlot["images"])[];

function SlotDetail({ slot }: { slot: ChiefGearSlot }) {
	const t = useTranslations("wikiChiefGear");
	const labels = useGameLabels();

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted">
				{t("slots.detailLine", { troopType: labels.heroClass(slot.troopType) })}
			</p>
			<ul className="grid grid-cols-2 gap-3">
				{rarityIds(slot).map((rarity) => (
					<li key={rarity}>
						<Card className="flex h-full flex-col items-center gap-2 p-3">
							<ItemIcon src={slot.images[rarity]} size={72} />
							<span className="font-semibold">{labels.rarity(rarity)}</span>
						</Card>
					</li>
				))}
			</ul>
		</div>
	);
}

function ChiefGearList() {
	const t = useTranslations("wikiChiefGear");
	const labels = useGameLabels();
	const [search, setSearch] = useState("");
	const [tier, setTier] = useState("all");
	const [stars, setStars] = useState("all");
	const [openSlot, setOpenSlot] = useState<ChiefGearSlot>();

	const matches = gearLevels.filter(
		(level) =>
			(tier === "all" || level.tier === tier) &&
			(stars === "all" || String(level.stars) === stars) &&
			matchesLadderSearch([level.name, level.tier], search)
	);

	const statsText = (level: ChiefGearLevel) =>
		t("cells.percent", { value: formatDecimal(level.statTotalPercent) });

	const columns: StackColumn<ChiefGearLevel>[] = [
		{
			id: "row",
			header: t("columns.row"),
			width: "minmax(0,1.3fr)",
			render: (level) => <span className="font-semibold">{level.name}</span>,
		},
		{
			id: "materials",
			header: t("columns.materials"),
			width: "minmax(0,2fr)",
			render: (level) => (
				<ResourceList entries={level.materials} emptyText={t("cells.none")} />
			),
		},
		{ id: "stats", header: t("columns.stats"), width: "5rem", render: statsText },
		{
			id: "power",
			header: t("columns.power"),
			width: "6rem",
			render: (level) => formatNumber(level.powerTotal),
		},
		{
			id: "score",
			header: t("columns.score"),
			width: "4.5rem",
			render: (level) => formatNumber(level.score),
		},
		{
			id: "capacity",
			header: t("columns.capacity"),
			width: "5.5rem",
			render: (level) => formatNumber(level.troopsDeploymentCapacity ?? 0),
		},
	];

	return (
		<WikiPageShell
			id="chiefGear"
			line={t("line", {
				rows: formatNumber(gearLevels.length),
				slots: formatNumber(chiefGearSlotList.length),
				rates: formatNumber(gearConverter.length),
			})}
		>
			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">{t("slots.heading")}</h2>
				<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{chiefGearSlotList.map((slot) => {
						const images = Object.values(slot.images);
						return (
							<li key={slot.id}>
								<button
									type="button"
									aria-haspopup="dialog"
									onClick={() => setOpenSlot(slot)}
									className="bg-surface border-line hover:border-primary flex h-full min-h-11 w-full flex-col items-start gap-2 rounded-md border-[1.5px] p-3 text-start"
								>
									<span className="font-semibold">{slot.name}</span>
									<span className="text-muted">
										{labels.heroClass(slot.troopType)}
									</span>
									<span className="flex gap-1">
										{images.map((image) => (
											<ItemIcon key={image} src={image} size={28} />
										))}
									</span>
									<span className="text-muted text-xs">
										{t("slots.rarities", {
											first: labels.rarity(rarityIds(slot)[0]),
											last: labels.rarity(rarityIds(slot)[images.length - 1]),
										})}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			</section>

			<SetBonuses />

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					{t("table.heading")}{" "}
					<span className="text-muted font-mono text-xs">
						{t("table.meta", {
							rows: formatNumber(gearLevels.length),
							tiers: formatNumber(gearTiers.length),
						})}
					</span>
				</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_10rem]">
					<Input
						type="search"
						aria-label={t("table.searchLabel")}
						placeholder={t("table.searchPlaceholder", {
							rows: formatNumber(gearLevels.length),
						})}
						leadingIcon={<LuSearch size={16} />}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="sm:col-span-2 lg:col-span-1"
					/>
					<Select
						aria-label={t("table.tierLabel")}
						value={tier}
						onChange={(event) => setTier(event.target.value)}
					>
						<option value="all">{t("table.allTiers")}</option>
						{gearTiers.map((option) => (
							<option key={option.tier} value={option.tier}>
								{labels.rarityTier(option.tier)}
							</option>
						))}
					</Select>
					<Select
						aria-label={t("table.starsLabel")}
						value={stars}
						onChange={(event) => setStars(event.target.value)}
					>
						<option value="all">{t("table.allStars")}</option>
						{starValues.map((value) => (
							<option key={value} value={String(value)}>
								{t("table.starsOption", { stars: formatNumber(value) })}
							</option>
						))}
					</Select>
				</div>
				{matches.length === 0 ? (
					<p className="text-muted">{t("table.empty")}</p>
				) : (
					<StackTable
						label={t("table.heading")}
						columns={columns}
						rows={matches}
						rowKey={(level) => level.id}
					/>
				)}
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">
					{t("tiers.heading")}{" "}
					<span className="text-muted font-mono text-xs">
						{t("tiers.meta", { tiers: formatNumber(tierSummaries.length) })}
					</span>
				</h2>
				<LadderSummary
					label={t("tiers.heading")}
					headers={{
						group: t("tiers.tier"),
						rows: t("tiers.rows"),
						stats: t("tiers.stats"),
						power: t("tiers.power"),
					}}
					groups={tierSummaries}
					groupName={labels.rarityTier}
					statsRange={(first, last) => t("tiers.statsRange", { first, last })}
				/>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">{t("exchange.heading")}</h2>
				<ExchangeRates
					label={t("exchange.heading")}
					headers={{
						exchange: t("exchange.exchange"),
						from: t("exchange.from"),
						to: t("exchange.to"),
						weeklyLimit: t("exchange.weeklyLimit"),
					}}
					rates={gearConverter}
				/>
			</section>
			{openSlot && (
				<Flyout open onClose={() => setOpenSlot(undefined)} title={openSlot.name}>
					<SlotDetail slot={openSlot} />
				</Flyout>
			)}
		</WikiPageShell>
	);
}

function SetBonuses() {
	const t = useTranslations("wikiChiefGear");
	const labels = useGameLabels();
	const { threePiece, sixPiece, troopTypes } = setBonusRule;
	const percentOf = (tier: ChiefGearSetBonusTier) =>
		t("cells.percent", { value: formatDecimal(tier.percent) });

	const columns: StackColumn<ChiefGearSetBonusTier>[] = [
		{
			id: "tier",
			header: t("setBonus.tier"),
			width: "minmax(0,1.2fr)",
			render: (tier) => (
				<span className="font-mono font-semibold">{labels.rarityTier(tier.name)}</span>
			),
		},
		{
			id: "three",
			header: t("setBonus.pieces", {
				pieces: formatNumber(threePiece.pieces),
				stat: threePiece.stat,
			}),
			width: "minmax(0,1fr)",
			render: percentOf,
		},
		{
			id: "six",
			header: t("setBonus.pieces", {
				pieces: formatNumber(sixPiece.pieces),
				stat: sixPiece.stat,
			}),
			width: "minmax(0,1fr)",
			render: percentOf,
		},
	];

	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-lg font-semibold">
				{t("setBonus.heading")}{" "}
				<span className="text-muted font-mono text-xs">
					{t("setBonus.meta", { tiers: formatNumber(setBonusTiers.length) })}
				</span>
			</h2>
			<p className="text-muted">
				{t("setBonus.hint", {
					types: troopTypes.map((type) => labels.troopId(type)).join(", "),
				})}
			</p>
			<div className="grid gap-3 sm:grid-cols-2">
				{[threePiece, sixPiece].map((bonus) => (
					<Card key={bonus.pieces} className="flex flex-col gap-1 p-4">
						<span className="font-mono text-2xl">{bonus.stat}</span>
						<span className="text-muted">
							{t("setBonus.pieceSet", { pieces: formatNumber(bonus.pieces) })}
						</span>
					</Card>
				))}
			</div>
			<StackTable
				label={t("setBonus.heading")}
				columns={columns}
				rows={setBonusTiers}
				rowKey={(tier) => tier.id}
			/>
		</section>
	);
}

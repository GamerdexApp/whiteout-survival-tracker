import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Playthrough } from "@/types/app";
import { formatFurnaceLevel, formatNumber, formatTimeLeft } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { dayLabelOf } from "@/service/coreEvents";
import type { EventsZone } from "@/service/eventsSchedule";
import { furnaceProgressOf, ownedSkinCountOf, vipLevelOfChief } from "@/service/overview";
import { dailiesTodayOf, eventsTileOf } from "@/service/overviewEvents";
import {
	constructionRowsOf,
	researchRowsOf,
	researchTileOf,
	runningCountOf,
} from "@/service/overviewQueues";
import { packageTotals } from "@/data/game/overviewTotals";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface TileProps {
	href: string;
	label: string;
	value: ReactNode;
	sub: string;
}

function Tile({ href, label, value, sub }: TileProps) {
	return (
		<Link href={href} className="block">
			<Card className="hover:bg-tint flex h-full min-h-11 flex-col gap-1 p-4">
				<SectionLabel className="text-muted">{label}</SectionLabel>
				<span className="font-mono text-2xl">{value}</span>
				<span className="text-muted">{sub}</span>
			</Card>
		</Link>
	);
}

interface OverviewTilesProps {
	chief: Playthrough;
	now: number;
	zone: EventsZone;
}

export function OverviewTiles({ chief, now, zone }: OverviewTilesProps) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
			<FurnaceTile chief={chief} />
			<ConstructionTile chief={chief} />
			<ResearchTile chief={chief} now={now} />
			<DailiesTile chief={chief} now={now} />
			<EventsTile chief={chief} now={now} zone={zone} />
			<SkinsTile chief={chief} />
			<VipTile chief={chief} />
		</div>
	);
}

function FurnaceTile({ chief }: { chief: Playthrough }) {
	const t = useTranslations("overview.tiles.furnace");
	const { ui } = useUiSettings();
	const furnace = furnaceProgressOf(chief);

	return (
		<Tile
			href="/buildings"
			label={t("label")}
			value={
				furnace.level
					? formatFurnaceLevel(furnace.level, ui.furnaceFullLabels ?? false)
					: t("unknown")
			}
			sub={
				furnace.level
					? t("steps", {
							order: formatNumber(furnace.order),
							total: formatNumber(furnace.maxOrder),
						})
					: t("unknownHint")
			}
		/>
	);
}

function ConstructionTile({ chief }: { chief: Playthrough }) {
	const t = useTranslations("overview.tiles.construction");
	const rows = constructionRowsOf(chief);
	const busy = runningCountOf(rows);
	const idle = rows.length - busy;
	const sub =
		busy === rows.length
			? t("allBusy")
			: busy === 0
				? t("allIdle")
				: t("someIdle", { count: idle, amount: formatNumber(idle) });

	return (
		<Tile
			href="/buildings"
			label={t("label")}
			value={t("value", { busy: formatNumber(busy), total: formatNumber(rows.length) })}
			sub={sub}
		/>
	);
}

function ResearchTile({ chief, now }: { chief: Playthrough; now: number }) {
	const t = useTranslations("overview.tiles.research");
	const tQueues = useTranslations("overview.queues");
	const state = researchTileOf(chief, now);
	const total = researchRowsOf(chief).length;
	const nameOf = (slot: unknown) =>
		slot === "warAcademy" ? tQueues("researchWarAcademy") : tQueues("researchMain");

	const sub =
		state.running.length === 0
			? t("bothIdle")
			: state.running.length === total
				? t("bothRunning")
				: t("oneRunning", {
						name: nameOf(state.running[0].row.slot),
						left: formatTimeLeft(state.running[0].seconds),
					});

	return (
		<Tile
			href="/research"
			label={t("label")}
			value={t("value", {
				running: formatNumber(state.running.length),
				total: formatNumber(total),
			})}
			sub={sub}
		/>
	);
}

function DailiesTile({ chief, now }: { chief: Playthrough; now: number }) {
	const t = useTranslations("overview.tiles.dailies");
	const { summary } = dailiesTodayOf(chief, now);
	const hasTasks = summary.tasksTotal > 0;

	return (
		<Tile
			href="/dailies"
			label={t("label")}
			value={t("value", {
				done: formatNumber(hasTasks ? summary.tasksDone : summary.missionsDone),
				total: formatNumber(hasTasks ? summary.tasksTotal : summary.missionsTotal),
			})}
			sub={hasTasks ? t("tasks") : t("missions")}
		/>
	);
}

function EventsTile({ chief, now, zone }: { chief: Playthrough; now: number; zone: EventsZone }) {
	const t = useTranslations("overview.tiles.events");
	const tCore = useTranslations("coreEvents.events");
	const tile = eventsTileOf(chief, now, zone);
	const week =
		tile.startingThisWeek > 0
			? t("moreThisWeek", { amount: formatNumber(tile.startingThisWeek) })
			: t("noneThisWeek");
	const sub = tile.firstLiveCore
		? `${t("coreDay", {
				event: tCore(tile.firstLiveCore.event),
				day: dayLabelOf(tile.firstLiveCore.event, tile.firstLiveCore.todayId),
			})}, ${week}`
		: week;

	return (
		<Tile
			href="/events"
			label={t("label")}
			value={t("live", { amount: formatNumber(tile.liveCount) })}
			sub={sub}
		/>
	);
}

function SkinsTile({ chief }: { chief: Playthrough }) {
	const t = useTranslations("overview.tiles.skins");
	const owned = ownedSkinCountOf(chief);

	return (
		<Tile
			href="/skins"
			label={t("label")}
			value={t("value", {
				owned: formatNumber(owned),
				total: formatNumber(packageTotals.skins),
			})}
			sub={t("hint")}
		/>
	);
}

function VipTile({ chief }: { chief: Playthrough }) {
	const t = useTranslations("overview.tiles.vip");
	const level = vipLevelOfChief(chief);

	return (
		<Tile
			href="/vip"
			label={t("label")}
			value={level === undefined ? t("unknown") : t("value", { level: formatNumber(level) })}
			sub={level === undefined ? t("unknownHint") : t("hint")}
		/>
	);
}

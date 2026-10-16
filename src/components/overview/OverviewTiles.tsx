import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Playthrough } from "@/types/app";
import { formatFurnaceLevel, formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { dayLabelOf } from "@/service/coreEvents";
import {
	buildDecorationViews,
	islandUnlocked,
	summarizeProsperity,
	unlockFurnaceLabel,
} from "@/service/daybreak";
import type { EventsZone } from "@/service/eventsSchedule";
import { furnaceProgressOf, ownedSkinCountOf, vipLevelOfChief } from "@/service/overview";
import { dailiesTodayOf, eventsTileOf } from "@/service/overviewEvents";
import { nextGenerationOf } from "@/service/overviewUnlocks";
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
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
			<FurnaceTile chief={chief} />
			<GenerationTile chief={chief} now={now} />
			<ProsperityTile chief={chief} />
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

function GenerationTile({ chief, now }: { chief: Playthrough; now: number }) {
	const t = useTranslations("overview.tiles.generation");
	const upcoming = nextGenerationOf(chief, now);
	const generation = formatNumber(chief.heroGenerationUnlocked);
	const sub = !upcoming
		? t("allUnlocked")
		: upcoming.next.passed
			? t("shouldBeOpen", { next: formatNumber(upcoming.generation) })
			: upcoming.next.daysLeft === null
				? t("onDay", {
						next: formatNumber(upcoming.generation),
						day: formatNumber(upcoming.next.day),
					})
				: t("inDays", {
						next: formatNumber(upcoming.generation),
						days: formatNumber(upcoming.next.daysLeft),
					});

	return <Tile href="/heroes" label={t("label")} value={generation} sub={sub} />;
}

function ProsperityTile({ chief }: { chief: Playthrough }) {
	const t = useTranslations("overview.tiles.prosperity");
	const unlocked = islandUnlocked(chief);
	const summary = summarizeProsperity(buildDecorationViews(chief));

	return (
		<Tile
			href="/daybreak-island"
			label={t("label")}
			value={unlocked ? formatNumber(summary.now) : t("locked")}
			sub={
				unlocked
					? t("possible", { max: formatNumber(summary.max) })
					: t("lockedHint", { level: unlockFurnaceLabel })
			}
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

import { useTranslations } from "next-intl";
import type { PlannedUpgrade, Playthrough } from "@/types/app";
import type { CoreEventId } from "@/types/app";
import { formatCompact, formatNumber } from "@/lib/format";
import { dayLabelOf } from "@/service/coreEvents";
import {
	costLinesOf,
	isKnownUpgradePage,
	upgradeDoneOf,
	upgradeLevelsOf,
} from "@/service/historyEvents";
import type { UpgradeGroup } from "@/service/historyEvents";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";

const COMPACT_FROM = 100_000;

const amountText = (amount: number) =>
	amount >= COMPACT_FROM ? formatCompact(amount) : formatNumber(amount);

function DonePill({ done }: { done: boolean | null }) {
	const t = useTranslations("history.upgrades");
	if (done === null) return null;

	return (
		<span
			className={`inline-flex items-center rounded-full border-[1.5px] border-current px-2 py-0.5 font-mono text-[11px] tracking-[0.06em] whitespace-nowrap uppercase ${
				done ? "text-kept" : "text-danger"
			}`}
		>
			{done ? t("done") : t("notDone")}
		</span>
	);
}

function LevelText({ upgrade }: { upgrade: PlannedUpgrade }) {
	const t = useTranslations("history.upgrades");
	const levels = upgradeLevelsOf(upgrade);
	const values = { from: levels.from ?? "", to: levels.to };
	const text =
		levels.from === null
			? t(levels.numeric ? "levelsResearchTo" : "levelsTo", values)
			: t(levels.numeric ? "levelsResearchFrom" : "levelsFrom", values);

	return <span className="text-muted">{text}</span>;
}

function Cost({ upgrade }: { upgrade: PlannedUpgrade }) {
	return (
		<ul className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-sm">
			{costLinesOf(upgrade).map((line) => {
				const item = findItem(line.itemId);
				return (
					<li key={line.itemId} className="inline-flex items-center gap-1.5">
						<ItemIcon src={item?.img} size={16} className="rounded-sm" />
						{amountText(line.amount)} {item?.name ?? line.itemId}
					</li>
				);
			})}
		</ul>
	);
}

interface UpgradeRowProps {
	chief: Playthrough;
	event: CoreEventId;
	upgrade: PlannedUpgrade;
}

function UpgradeRow({ chief, event, upgrade }: UpgradeRowProps) {
	const t = useTranslations("history.upgrades");
	const done = upgradeDoneOf(chief, upgrade);
	const day = t("plannedDay", { day: dayLabelOf(event, upgrade.day) });

	return (
		<li className="border-line flex flex-col gap-2 border-t-[1.5px] py-3 lg:grid lg:grid-cols-[minmax(0,1.3fr)_9rem_8rem_minmax(0,2fr)_5.5rem] lg:items-center lg:gap-x-4">
			<div className="flex items-start justify-between gap-3 lg:contents">
				<span className="min-w-0">
					<span className="font-semibold">{upgrade.item}</span>{" "}
					<LevelText upgrade={upgrade} />
				</span>
				<span className="lg:order-last lg:text-right">
					<DonePill done={done} />
				</span>
			</div>
			<div className="flex flex-wrap items-center gap-2 lg:contents">
				<span className="border-line text-muted w-fit rounded-full border-[1.5px] px-2 py-0.5 font-mono text-[11px] whitespace-nowrap">
					{day}
				</span>
				<span className="text-kept font-mono lg:text-right">
					{t("power", { power: formatNumber(upgrade.power) })}
				</span>
			</div>
			<Cost upgrade={upgrade} />
		</li>
	);
}

interface PlannedUpgradesProps {
	chief: Playthrough;
	event: CoreEventId;
	groups: UpgradeGroup[];
}

export function PlannedUpgrades({ chief, event, groups }: PlannedUpgradesProps) {
	const t = useTranslations("history");
	const total = groups.reduce((sum, group) => sum + group.upgrades.length, 0);
	const done = groups.reduce((sum, group) => sum + group.done, 0);
	const checkable = groups.some((group) => group.checkable);

	return (
		<Card className="flex flex-col gap-4 p-5">
			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-semibold">
					{t("upgrades.titleCount", { count: formatNumber(total) })}
				</h2>
				<p className="text-muted">
					{checkable
						? t("upgrades.summary", {
								done: formatNumber(done),
								count: formatNumber(total),
							})
						: t("upgrades.summaryUnchecked")}
				</p>
			</div>
			{groups.map((group) => {
				const stats = {
					done: formatNumber(group.done),
					count: formatNumber(group.upgrades.length),
					power: formatNumber(group.power),
					fireCrystals: formatNumber(group.fireCrystals),
				};
				return (
					<section key={group.page} className="flex flex-col">
						<h3 className="text-base font-semibold">
							{t("upgrades.groupTitle", {
								name: isKnownUpgradePage(group.page)
									? t(`pages.${group.page}`)
									: group.page,
								count: formatNumber(group.upgrades.length),
							})}
						</h3>
						<p className="text-muted font-mono text-sm">
							{group.checkable
								? t("upgrades.groupStats", stats)
								: t("upgrades.groupStatsUnchecked", stats)}
						</p>
						<ul className="mt-2">
							{group.upgrades.map((upgrade, index) => (
								<UpgradeRow
									key={`${upgrade.itemId}:${upgrade.to}:${index}`}
									chief={chief}
									event={event}
									upgrade={upgrade}
								/>
							))}
						</ul>
					</section>
				);
			})}
		</Card>
	);
}

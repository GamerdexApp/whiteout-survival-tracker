"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import type { ReactNode } from "react";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { StarStats } from "@/service/calcHeroUpgrade";
import { formatStars } from "@/service/heroes";
import { heroUpgradeEvents } from "@/data/game/calcHeroUpgrade";
import type {
	ExclusiveWeaponSkill,
	Hero,
	HeroUpgradeCalculation,
} from "@/data/game/calcHeroUpgrade";
import { generalShardItemId, shardItemIdOf } from "@/data/game/heroes";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { StatTile } from "@/comps/ui/StatTile";
import { UnknownValue } from "../../UnknownValue";

interface HeroUpgradeResultProps {
	hero: Hero;
	result: HeroUpgradeCalculation;
	powerGain: number | null;
	stats: StarStats;
}

export function HeroUpgradeResult({ hero, result, powerGain, stats }: HeroUpgradeResultProps) {
	const t = useTranslations("calcHeroUpgrade.result");
	const titleId = useId();
	const hasWeapon = hero.exclusiveWeapon !== undefined;

	return (
		<section className="flex flex-col gap-4" aria-labelledby={titleId}>
			<h2 id={titleId} className="text-lg font-semibold">
				{t("title")}
			</h2>
			{result.unmetRequirements.length > 0 && (
				<Note tone="warning" title={t("unmetTitle")}>
					{t("unmet", {
						items: result.unmetRequirements
							.map((requirement) =>
								t("unmetItem", {
									skill: requirement.skill,
									level: formatNumber(requirement.level),
									star: formatNumber(requirement.starRequired),
								})
							)
							.join("; "),
					})}
				</Note>
			)}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<StatTile value={formatNumber(result.stars.steps)} label={t("tiles.starSteps")} />
				<StatTile value={formatNumber(result.stars.shards)} label={t("tiles.shards")} />
				<StatTile
					value={formatNumber(result.skills.levels)}
					label={t("tiles.skillLevels")}
				/>
				{hasWeapon && (
					<StatTile
						value={formatNumber(result.widgets.levels)}
						label={t("tiles.weaponLevels")}
					/>
				)}
				{hasWeapon && (
					<StatTile
						value={formatNumber(result.widgets.widgets)}
						label={t("tiles.widgets")}
					/>
				)}
				<StatTile
					value={powerGain === null ? <UnknownValue /> : formatNumber(powerGain)}
					label={t("tiles.powerGain")}
					emphasis
				/>
			</div>
			<p className="text-muted text-xs">{t("powerNote")}</p>
			<ResourcesCard hero={hero} result={result} />
			{hero.exclusiveWeapon && result.widgets.unlockedSkills.length > 0 && (
				<UnlockedSkills
					skills={hero.exclusiveWeapon.skills.filter((skill) =>
						result.widgets.unlockedSkills.includes(skill.name)
					)}
				/>
			)}
			<StatsCard stats={stats} />
			<EventsCard result={result} />
		</section>
	);
}

function ResultCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{title}</h3>
			{children}
		</Card>
	);
}

function HeadCell({ children, numeric = false }: { children: ReactNode; numeric?: boolean }) {
	return (
		<th scope="col" className={`pb-1 ${numeric ? "text-end" : "text-start"}`}>
			<SectionLabel className="text-muted">{children}</SectionLabel>
		</th>
	);
}

const rowClasses = "border-line border-t-[1.5px]";
const numberCellClasses = "py-1.5 text-end font-mono whitespace-nowrap";

function ResourcesCard({ hero, result }: { hero: Hero; result: HeroUpgradeCalculation }) {
	const t = useTranslations("calcHeroUpgrade.result.resources");
	const nothingNeeded = result.resources.length === 0 && result.widgets.widgets === 0;
	const ownShardId = shardItemIdOf(hero);
	const ownShardItem = ownShardId ? findItem(ownShardId) : undefined;
	const showOwnShards = ownShardItem !== undefined && result.stars.shards > 0;

	return (
		<ResultCard title={t("title")}>
			{nothingNeeded ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<table className="w-full">
					<thead>
						<tr>
							<HeadCell>{t("item")}</HeadCell>
							<HeadCell numeric>{t("amount")}</HeadCell>
						</tr>
					</thead>
					<tbody>
						{result.resources.map(({ itemId, amount }) => {
							const item = findItem(itemId);
							return (
								<tr key={itemId} className={rowClasses}>
									<td className="py-1.5 pe-3">
										<span className="flex items-center gap-2">
											<ItemIcon src={item?.img} size={28} />
											{item?.name ?? itemId}
										</span>
									</td>
									<td className={numberCellClasses}>{formatNumber(amount)}</td>
								</tr>
							);
						})}
						{result.widgets.widgets > 0 && (
							<tr className={rowClasses}>
								<td className="py-1.5 pe-3">
									<span className="flex items-center gap-2">
										<ItemIcon size={28} />
										{t("widgets")}
									</span>
								</td>
								<td className={numberCellClasses}>
									{formatNumber(result.widgets.widgets)}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			)}
			{showOwnShards && (
				<p className="text-muted text-xs">
					{t("ownShards", {
						own: ownShardItem.name,
						general: findItem(generalShardItemId(hero.rarity))!.name,
					})}
				</p>
			)}
		</ResultCard>
	);
}

function UnlockedSkills({ skills }: { skills: ExclusiveWeaponSkill[] }) {
	const t = useTranslations("calcHeroUpgrade.result.unlocked");

	return (
		<ResultCard title={t("title")}>
			<ul className="flex flex-col gap-3">
				{skills.map((skill) => (
					<li key={skill.name} className="flex items-start gap-3">
						<ItemIcon src={skill.img} size={32} />
						<span className="flex flex-col">
							<span className="font-medium">{skill.name}</span>
							<span className="text-muted text-xs">{skill.description}</span>
						</span>
					</li>
				))}
			</ul>
		</ResultCard>
	);
}

type StatRow = {
	id: string;
	group: "exploration" | "expedition";
	stat: "attack" | "defense" | "health";
	pick: (estimate: StarStats["current"]) => number;
};

const STAT_ROWS: StatRow[] = [
	{
		id: "explorationAttack",
		group: "exploration",
		stat: "attack",
		pick: (e) => e.exploration.attack,
	},
	{
		id: "explorationDefense",
		group: "exploration",
		stat: "defense",
		pick: (e) => e.exploration.defense,
	},
	{
		id: "explorationHealth",
		group: "exploration",
		stat: "health",
		pick: (e) => e.exploration.health,
	},
	{
		id: "expeditionAttack",
		group: "expedition",
		stat: "attack",
		pick: (e) => e.expedition.attack,
	},
	{
		id: "expeditionDefense",
		group: "expedition",
		stat: "defense",
		pick: (e) => e.expedition.defense,
	},
];

function StatsCard({ stats }: { stats: StarStats }) {
	const t = useTranslations("calcHeroUpgrade.result.stats");
	const columns = [stats.current, stats.goal];
	const anyEstimated = columns.some((estimate) => estimate.estimated);
	const valueText = (row: StatRow, estimate: StarStats["current"]) =>
		row.group === "expedition"
			? t("percent", { value: formatDecimal(row.pick(estimate)) })
			: formatNumber(row.pick(estimate));

	return (
		<ResultCard title={t("title")}>
			<table className="w-full">
				<thead>
					<tr>
						<HeadCell>{t("stat")}</HeadCell>
						{columns.map((estimate, index) => (
							<HeadCell key={index} numeric>
								{formatStars(estimate)}
							</HeadCell>
						))}
					</tr>
				</thead>
				<tbody>
					{STAT_ROWS.map((row) => (
						<tr key={row.id} className={rowClasses}>
							<td className="py-1.5 pe-3">
								<span className="text-muted">{t(row.group)}</span> {t(row.stat)}
							</td>
							{columns.map((estimate, index) => (
								<td key={index} className={`${numberCellClasses} ps-3`}>
									{valueText(row, estimate)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			{anyEstimated && <p className="text-muted text-xs">{t("estimateNote")}</p>}
		</ResultCard>
	);
}

function EventsCard({ result }: { result: HeroUpgradeCalculation }) {
	const t = useTranslations("calcHeroUpgrade.result.events");

	return (
		<ResultCard title={t("title")}>
			<table className="w-full">
				<thead>
					<tr>
						<HeadCell>{t("event")}</HeadCell>
						<HeadCell numeric>{t("points")}</HeadCell>
					</tr>
				</thead>
				<tbody>
					{heroUpgradeEvents.map((event) => (
						<tr key={event.key} className={rowClasses}>
							<td className="py-1.5 pe-3">{event.name}</td>
							<td className={numberCellClasses}>
								{formatNumber(result.eventPoints[event.key])}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</ResultCard>
	);
}

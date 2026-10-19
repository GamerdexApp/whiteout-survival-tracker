"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { useStaticUrlTab } from "@/lib/hooks/useUrlTab";
import { DEFAULT_RESET_TIME } from "@/service/dailies";
import {
	ALL_LEVELS_ACTIVENESS,
	dailyMissionList,
	isActivenessItem,
	itemName,
	LEVEL_ONE_ACTIVENESS,
	missionActiveness,
	missionActivenessThrough,
	rewardLevels,
	routineTasks,
	TOP_REWARD_ACTIVENESS,
} from "@/data/game/dailies";
import type { DailyMission, DailyMissionLevel } from "@/data/game/dailies";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { StatTile } from "@/comps/ui/StatTile";
import { Tabs } from "@/comps/ui/Tabs";
import { RecordSection } from "../records/RecordParts";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

type DailiesTab = "missions" | "routine";

const TABS: DailiesTab[] = ["missions", "routine"];
const LEVEL_COUNT = dailyMissionList.reduce((sum, mission) => sum + mission.levels.length, 0);
const LEVELS_PER_MISSION = dailyMissionList.map((mission) => mission.levels.length);
const MISSION_COLUMNS =
	"lg:grid lg:grid-cols-[3.5rem_1fr_6rem_6rem_1.2fr] lg:items-baseline lg:gap-4";

function RewardText({ itemId, amount }: { itemId: string; amount: number }) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<ItemIcon src={findItem(itemId)?.img} size={20} />
			{formatNumber(amount)} {itemName(itemId)}
		</span>
	);
}

function RewardList({ rewards }: { rewards: { itemId: string; amount: number }[] }) {
	return (
		<ul className="flex flex-wrap gap-x-4 gap-y-1">
			{rewards.map((reward) => (
				<li key={reward.itemId}>
					<RewardText {...reward} />
				</li>
			))}
		</ul>
	);
}

function TotalsCard() {
	const t = useTranslations("wikiDailies");
	const missions = formatNumber(dailyMissionList.length);

	return (
		<RecordSection title={t("totals.title")}>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile value={missions} label={t("totals.missions")} />
				<StatTile value={formatNumber(LEVEL_ONE_ACTIVENESS)} label={t("totals.levelOne")} />
				<StatTile
					value={formatNumber(ALL_LEVELS_ACTIVENESS)}
					label={t("totals.allLevels")}
				/>
				<StatTile
					value={formatNumber(TOP_REWARD_ACTIVENESS)}
					label={t("totals.topReward")}
				/>
			</div>
			<p className="text-muted">
				{t("totals.explanation", {
					missions,
					levelOne: formatNumber(LEVEL_ONE_ACTIVENESS),
					allLevels: formatNumber(ALL_LEVELS_ACTIVENESS),
				})}
			</p>
		</RecordSection>
	);
}

function ActivityBarCard() {
	const t = useTranslations("wikiDailies.bar");

	return (
		<RecordSection title={t("title")}>
			<div aria-hidden="true" className="relative mx-5 h-12">
				<div className="bg-track absolute top-2 right-0 left-0 h-2 rounded-full" />
				{rewardLevels.map((level) => (
					<div
						key={level.activeness}
						style={{ left: `${(level.activeness / TOP_REWARD_ACTIVENESS) * 100}%` }}
						className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1"
					>
						<span className="bg-primary h-4 w-0.5" />
						<span className="font-mono text-xs">{formatNumber(level.activeness)}</span>
					</div>
				))}
			</div>
			<Card className="flex flex-col gap-2 p-3">
				<div className="text-muted hidden px-2 lg:grid lg:grid-cols-[6rem_1fr] lg:gap-4">
					<SectionLabel>{t("activeness")}</SectionLabel>
					<SectionLabel>{t("rewards")}</SectionLabel>
				</div>
				<ul className="flex flex-col">
					{rewardLevels.map((level) => (
						<li
							key={level.activeness}
							className="border-line flex flex-col gap-1 border-t px-2 py-2 lg:grid lg:grid-cols-[6rem_1fr] lg:gap-4"
						>
							<span className="font-mono font-semibold">
								{formatNumber(level.activeness)}
							</span>
							<RewardList rewards={level.rewards} />
						</li>
					))}
				</ul>
			</Card>
		</RecordSection>
	);
}

function MissionLevelRow({ level }: { level: DailyMissionLevel }) {
	const t = useTranslations("wikiDailies.missions");
	const otherRewards = level.rewards.filter((reward) => !isActivenessItem(reward.itemId));

	return (
		<li className={`border-line flex flex-col gap-1 border-t px-2 py-2 ${MISSION_COLUMNS}`}>
			<span className="font-mono font-semibold">
				{t("levelLabel", { level: formatNumber(level.level) })}
			</span>
			<span>{level.task}</span>
			<span className="font-mono lg:text-end">{formatNumber(level.target)}</span>
			<span className="font-mono lg:text-end">
				{t("plus", { amount: formatNumber(missionActiveness(level)) })}
			</span>
			{otherRewards.length > 0 ? (
				<RewardList rewards={otherRewards} />
			) : (
				<span className="text-muted">{t("noOtherRewards")}</span>
			)}
		</li>
	);
}

function MissionGroup({ mission }: { mission: DailyMission }) {
	const t = useTranslations("wikiDailies.missions");
	const total = formatNumber(missionActivenessThrough(mission, mission.levels.length));
	const parts = mission.levels.map((level) => formatNumber(missionActiveness(level))).join(" + ");
	const count = mission.levels.length;

	return (
		<li className="flex flex-col">
			<div className="bg-tint flex flex-wrap items-baseline justify-between gap-x-4 rounded-md px-2 py-2">
				<h3 className="font-semibold">{mission.name}</h3>
				<span className="text-muted font-mono text-xs">
					{count === 1
						? t("sumOne", { total })
						: t("sumMany", { count: formatNumber(count), parts, total })}
				</span>
			</div>
			<ul>
				{mission.levels.map((level) => (
					<MissionLevelRow key={level.level} level={level} />
				))}
			</ul>
		</li>
	);
}

function MissionsCard() {
	const t = useTranslations("wikiDailies.missions");
	const tRoot = useTranslations("wikiDailies");

	return (
		<RecordSection
			title={t("title")}
			meta={t("summary", {
				missions: tRoot("missionCount", {
					count: dailyMissionList.length,
					amount: formatNumber(dailyMissionList.length),
				}),
				levels: t("levelCount", {
					count: LEVEL_COUNT,
					amount: formatNumber(LEVEL_COUNT),
				}),
			})}
		>
			<Card className="flex flex-col gap-3 p-3">
				<div aria-hidden="true" className={`text-muted hidden px-2 ${MISSION_COLUMNS}`}>
					<SectionLabel>{t("level")}</SectionLabel>
					<SectionLabel>{t("task")}</SectionLabel>
					<SectionLabel className="text-end">{t("target")}</SectionLabel>
					<SectionLabel className="text-end">{t("activeness")}</SectionLabel>
					<SectionLabel>{t("otherRewards")}</SectionLabel>
				</div>
				<ul className="flex flex-col gap-3">
					{dailyMissionList.map((mission) => (
						<MissionGroup key={mission.id} mission={mission} />
					))}
				</ul>
			</Card>
		</RecordSection>
	);
}

function RoutineCard() {
	const t = useTranslations("wikiDailies.routine");

	return (
		<RecordSection
			title={t("title")}
			meta={t("count", {
				count: routineTasks.length,
				amount: formatNumber(routineTasks.length),
			})}
		>
			<Card className="p-3">
				<ol className="flex flex-col">
					{routineTasks.map((task) => (
						<li
							key={task.id}
							className="border-line border-t px-2 py-2 first:border-t-0"
						>
							{task.name}
						</li>
					))}
				</ol>
			</Card>
		</RecordSection>
	);
}

function MissingDataBlock() {
	const t = useTranslations("wikiDailies.missing");

	return (
		<Card className="flex flex-col gap-2 border-dashed p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<p className="text-muted">
				{t("levels", {
					min: formatNumber(Math.min(...LEVELS_PER_MISSION)),
					max: formatNumber(Math.max(...LEVELS_PER_MISSION)),
				})}
			</p>
			<p className="text-muted">{t("reset", { time: DEFAULT_RESET_TIME })}</p>
		</Card>
	);
}

export function DailiesPage({ recordId }: WikiPageProps) {
	if (recordId !== undefined) return <WikiRecordMissing id="dailies" />;

	return <DailiesPageContent />;
}

function DailiesPageContent() {
	const t = useTranslations("wikiDailies");
	const [tab, setTab] = useStaticUrlTab(TABS, "missions");

	return (
		<WikiPageShell
			id="dailies"
			line={t("line", { missions: formatNumber(dailyMissionList.length) })}
		>
			<Tabs
				label={t("tabs.label")}
				tabs={TABS.map((id) => ({
					id,
					label: t(`tabs.${id}`),
					count: id === "missions" ? dailyMissionList.length : routineTasks.length,
				}))}
				activeId={tab}
				onChange={setTab}
			>
				{tab === "missions" ? (
					<>
						<TotalsCard />
						<ActivityBarCard />
						<MissionsCard />
					</>
				) : (
					<RoutineCard />
				)}
			</Tabs>
			<MissingDataBlock />
		</WikiPageShell>
	);
}

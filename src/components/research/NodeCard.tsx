"use client";

import { translator } from "@/i18n/formatter";
import type { ResearchNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import type { ResearchQueueId } from "@/types/app";
import { formatDuration, formatNumber } from "@/lib/format";
import type { ResearchNodeView } from "@/service/research";
import { bonusText, tabLockText } from "@/service/research";
import { tierLabel } from "@/data/game/research";
import { TimeLeftPill } from "@/comps/queues/TimeLeftPill";
import { Button } from "@/comps/ui/Button";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { ProgressBar } from "@/comps/ui/ProgressBar";

export interface NodeCardProps {
	view: ResearchNodeView;
	onLevelChange: (nodeId: string, level: number) => void;
	onOpen: (nodeId: string) => void;
	onManageJob: (queue: ResearchQueueId) => void;
}

const levelStopsOf = (node: ResearchNode) =>
	Array.from({ length: node.levels.length + 1 }, (_, level) => ({
		value: String(level),
		label: String(level),
	}));

const nextTimeText = (view: ResearchNodeView) => {
	const t = translator("research");
	if (view.maxed || !view.next) return t("nodeCard.allResearched");
	const seconds = view.next.researchTimeSeconds;
	return t("nodeCard.nextTime", {
		level: formatNumber(view.next.level),
		time: seconds === undefined ? t("unknown") : formatDuration(seconds),
	});
};

/**
 * The power of every researched level, and the power the next level adds. A placeholder has no
 * cost or bonus but still carries a power value in the package.
 */
const powerText = (view: ResearchNodeView) => {
	const researched = view.node.levels
		.filter((item) => item.level <= view.level)
		.reduce((sum, item) => sum + item.power, 0);
	const t = translator("research");
	const parts = [
		researched > 0 ? t("nodeCard.power.researched", { power: formatNumber(researched) }) : null,
		view.next ? t("nodeCard.power.next", { power: formatNumber(view.next.power) }) : null,
	].filter(Boolean);
	return parts.length > 0
		? t("nodeCard.power.some", { parts: parts.join(" · ") })
		: t("nodeCard.power.none");
};

export function NodeCard({ view, onLevelChange, onOpen, onManageJob }: NodeCardProps) {
	const t = useTranslations("research.nodeCard");
	const { node, level, max, goal, hasGoal, tabLock, lockedBy, placeholder } = view;
	const dashed = view.locked || placeholder ? "border-dashed" : "";
	const surface = view.locked ? "bg-tint" : "bg-surface";
	const bonus = view.maxed
		? t("maxed", { bonus: bonusText(node.levels[max - 1]) || t("noBonus") })
		: view.next
			? bonusText(view.next) || t("noBonus")
			: "";

	return (
		<li
			className={`border-line ${surface} flex flex-col gap-3 rounded-md border-[1.5px] p-3 ${dashed}`}
		>
			<div className="flex items-start gap-3">
				<ItemIcon src={node.img} />
				<button
					type="button"
					onClick={() => onOpen(node.id)}
					className="hover:text-link min-h-11 min-w-0 flex-1 text-start font-semibold lg:min-h-9"
				>
					{node.name}
				</button>
				<span className="border-line text-muted shrink-0 rounded-sm border-[1.5px] px-1.5 py-0.5 font-mono text-[11px]">
					{tierLabel(node)}
				</span>
			</div>
			<div className="flex items-baseline justify-between gap-3">
				<span className="font-mono">
					{t("level", { level: formatNumber(level), max: formatNumber(max) })}
				</span>
				<span
					className={
						hasGoal ? "text-primary font-mono font-medium" : "text-muted font-mono"
					}
				>
					{hasGoal ? t("goal", { goal: formatNumber(goal) }) : t("noGoal")}
				</span>
			</div>
			<ProgressBar value={view.progress} label={t("progress", { name: node.name })} />
			{tabLock ? (
				<p className="text-muted">
					{t("lockedByTab", { reason: tabLockText(view.tab, tabLock) })}
				</p>
			) : lockedBy ? (
				<p className="text-muted">{t("lockedByRequirement", { requirement: lockedBy })}</p>
			) : placeholder ? (
				<p className="text-muted">{t("placeholder")}</p>
			) : (
				<p className="text-muted">{bonus}</p>
			)}
			{!placeholder && <p className="text-muted font-mono text-xs">{nextTimeText(view)}</p>}
			<p className="font-mono text-xs">{powerText(view)}</p>
			{!tabLock && view.blockedBy.length > 0 && !lockedBy && (
				<p className="text-muted text-xs">
					{t("needsFirst", { names: view.blockedBy.join(", ") })}
				</p>
			)}
			{view.job && (
				<TimeLeftPill
					job={view.job}
					label={t("researching", { name: node.name })}
					onClick={() => onManageJob(view.job!.queue)}
					fullWidth
				/>
			)}
			<div className="mt-auto flex items-center justify-between gap-2">
				<LevelStepper
					label={t("levelStepper", { name: node.name })}
					stops={levelStopsOf(node)}
					value={String(level)}
					disabled={tabLock !== null || (lockedBy !== null && level === 0)}
					limitValue={String(view.reachable)}
					onChange={(value) => onLevelChange(node.id, Number(value))}
				/>
				<Button
					onClick={() => onOpen(node.id)}
					aria-label={t("detailsOf", { name: node.name })}
				>
					{t("details")}
				</Button>
			</div>
		</li>
	);
}

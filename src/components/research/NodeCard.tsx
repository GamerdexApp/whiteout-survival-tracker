"use client";

import type { ResearchNode } from "whiteout-survival-data";
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
	if (view.maxed || !view.next) return "All levels researched";
	const seconds = view.next.researchTimeSeconds;
	return `Level ${view.next.level} time: ${seconds === undefined ? "Unknown" : formatDuration(seconds)}`;
};

/**
 * The power of every researched level, and the power the next level adds. A placeholder has no
 * cost or bonus but still carries a power value in the package.
 */
const powerText = (view: ResearchNodeView) => {
	const researched = view.node.levels
		.filter((item) => item.level <= view.level)
		.reduce((sum, item) => sum + item.power, 0);
	const parts = [
		researched > 0 ? `${formatNumber(researched)} researched` : null,
		view.next ? `+${formatNumber(view.next.power)} next level` : null,
	].filter(Boolean);
	return parts.length > 0 ? `Power ${parts.join(" · ")}` : "Power 0";
};

export function NodeCard({ view, onLevelChange, onOpen, onManageJob }: NodeCardProps) {
	const { node, level, max, goal, hasGoal, tabLock, lockedBy, placeholder } = view;
	const dashed = view.locked || placeholder ? "border-dashed" : "";
	const bonus = view.maxed
		? `Maxed. ${bonusText(node.levels[max - 1]) || "No bonus in the data"}`
		: view.next
			? bonusText(view.next) || "No bonus in the data"
			: "";

	return (
		<li
			className={`border-line bg-surface flex flex-col gap-3 rounded-md border-[1.5px] p-3 ${dashed} ${view.locked ? "opacity-80" : ""}`}
		>
			<div className="flex items-start gap-3">
				<ItemIcon src={node.img} />
				<button
					type="button"
					onClick={() => onOpen(node.id)}
					className="hover:text-link min-w-0 flex-1 text-left font-semibold"
				>
					{node.name}
				</button>
				<span className="border-line text-muted shrink-0 rounded-sm border-[1.5px] px-1.5 py-0.5 font-mono text-[11px]">
					{tierLabel(node)}
				</span>
			</div>
			<div className="flex items-baseline justify-between gap-3">
				<span className="font-mono">
					Level {level} / {max}
				</span>
				<span
					className={
						hasGoal ? "text-primary font-mono font-medium" : "text-muted font-mono"
					}
				>
					{hasGoal ? `Goal ${goal}` : "No goal"}
				</span>
			</div>
			<ProgressBar value={view.progress} label={`${node.name} progress`} />
			{tabLock ? (
				<p className="text-muted">Locked: {tabLockText(view.tab, tabLock)}</p>
			) : lockedBy ? (
				<p className="text-muted">Locked: requires {lockedBy}</p>
			) : placeholder ? (
				<p className="text-muted">Placeholder. Cost and bonus are empty in the package.</p>
			) : (
				<p className="text-muted">{bonus}</p>
			)}
			{!placeholder && <p className="text-muted font-mono text-xs">{nextTimeText(view)}</p>}
			<p className="font-mono text-xs">{powerText(view)}</p>
			{!tabLock && view.blockedBy.length > 0 && !lockedBy && (
				<p className="text-muted text-xs">Needs {view.blockedBy.join(", ")} first</p>
			)}
			{view.job && (
				<TimeLeftPill
					job={view.job}
					label={`${node.name} researching`}
					onClick={() => onManageJob(view.job!.queue)}
					fullWidth
				/>
			)}
			<div className="mt-auto flex items-center justify-between gap-2">
				<LevelStepper
					label={`${node.name} level`}
					stops={levelStopsOf(node)}
					value={String(level)}
					disabled={tabLock !== null || (lockedBy !== null && level === 0)}
					limitValue={String(view.reachable)}
					onChange={(value) => onLevelChange(node.id, Number(value))}
				/>
				<Button onClick={() => onOpen(node.id)} aria-label={`Details of ${node.name}`}>
					Details
				</Button>
			</div>
		</li>
	);
}

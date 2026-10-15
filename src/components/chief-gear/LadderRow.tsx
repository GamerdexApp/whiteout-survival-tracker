import type { ReactNode } from "react";
import { formatCompact, formatNumber } from "@/lib/format";
import type { LadderItem } from "@/service/chiefGear";
import {
	ladderRows,
	ladderStops,
	NONE_STOP,
	positionOf,
	progressOf,
	rowOf,
	stepsToGoal,
} from "@/service/chiefGear";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { ProgressBar } from "@/comps/ui/ProgressBar";

interface LadderRowProps {
	item: LadderItem;
	title: string;
	subtitle?: string;
	troopLabel?: string;
	iconSrc?: string;
	iconBadge?: ReactNode;
	onChange: (current: string | null) => void;
}

export function LadderRow({
	item,
	title,
	subtitle,
	troopLabel,
	iconSrc,
	iconBadge,
	onChange,
}: LadderRowProps) {
	const total = ladderRows(item.kind).length;
	const row = rowOf(item.kind, item.current);
	const goalRow = rowOf(item.kind, item.goal);
	const steps = stepsToGoal(item);
	const capacityKnown = row?.troopsDeploymentCapacity !== undefined;

	return (
		<li className="border-line grid items-center gap-3 border-t-[1.5px] px-4 py-3 first:border-t-0 lg:grid-cols-[11rem_6rem_22rem_1fr_1fr]">
			<div className="flex items-center gap-3">
				<span className="relative shrink-0">
					<ItemIcon src={iconSrc} size={iconBadge ? 48 : 36} />
					{iconBadge}
				</span>
				<div className="flex flex-col">
					<span className="font-semibold">{title}</span>
					{subtitle && <span className="text-muted font-mono text-xs">{subtitle}</span>}
				</div>
			</div>
			<span className="text-muted max-lg:hidden">{troopLabel}</span>
			<LevelStepper
				wide
				label={`${title} level`}
				stops={ladderStops(item.kind)}
				value={item.current ?? NONE_STOP}
				onChange={(value) => onChange(value === NONE_STOP ? null : value)}
			/>
			<span
				className={
					goalRow
						? "text-primary font-mono text-xs font-medium"
						: "text-muted font-mono text-xs"
				}
			>
				{goalRow ? `Goal ${goalRow.name}` : "No goal"}
			</span>
			<div className="flex flex-col gap-1">
				<ProgressBar
					value={progressOf(item) / total}
					label={`${title} progress in ${total} rows`}
				/>
				<span className="font-mono text-xs">
					{progressOf(item)} of {total}
					{steps > 0 ? ` · ${steps} to goal` : ""}
				</span>
				<span className="text-muted font-mono text-xs">
					Stat {row ? `${row.statTotalPercent}%` : "None"} · Power{" "}
					{row ? formatCompact(row.powerTotal) : "None"}
					{item.kind === "gear" && row && !capacityKnown && " · Capacity Unknown"}
					{item.kind === "gear" &&
						capacityKnown &&
						` · Capacity ${formatNumber(row.troopsDeploymentCapacity ?? 0)}`}
				</span>
			</div>
		</li>
	);
}

export const positionLabel = (item: LadderItem) => positionOf(item.kind, item.current) + 1;

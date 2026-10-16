import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Playthrough } from "@/types/app";
import { formatCompact, formatDecimal, formatNumber } from "@/lib/format";
import type { LadderItem } from "@/service/chiefGear";
import {
	ladderRows,
	ladderStops,
	NONE_STOP,
	positionOf,
	progressOf,
	rowOf,
	stepsToGoal,
	unlockedLimitStop,
} from "@/service/chiefGear";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { ProgressBar } from "@/comps/ui/ProgressBar";

interface LadderRowProps {
	chief: Playthrough;
	item: LadderItem;
	title: string;
	subtitle?: string;
	troopLabel?: string;
	iconSrc?: string;
	iconBadge?: ReactNode;
	onChange: (current: string | null) => void;
}

export function LadderRow({
	chief,
	item,
	title,
	subtitle,
	troopLabel,
	iconSrc,
	iconBadge,
	onChange,
}: LadderRowProps) {
	const t = useTranslations("chiefGear");
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
				label={t("row.level", { title })}
				stops={ladderStops(item.kind, chief)}
				limitValue={unlockedLimitStop(chief, item.kind)}
				value={item.lockedCurrent?.id ?? item.current ?? NONE_STOP}
				onChange={(value) => onChange(value === NONE_STOP ? null : value)}
			/>
			<span
				className={
					goalRow
						? "text-primary font-mono text-xs font-medium"
						: "text-muted font-mono text-xs"
				}
			>
				{goalRow ? t("row.goal", { name: goalRow.name }) : t("row.noGoal")}
			</span>
			<div className="flex flex-col gap-1">
				{(item.lockedCurrent || item.lockedGoal) && (
					<div className="text-muted flex flex-col gap-0.5 text-xs">
						{item.lockedCurrent && (
							<span>
								{t("row.lockedCurrent", {
									name: item.lockedCurrent.name,
									requirement: item.lockedCurrent.requirement,
								})}
							</span>
						)}
						{item.lockedGoal && (
							<span>
								{t("row.lockedGoal", {
									name: item.lockedGoal.name,
									requirement: item.lockedGoal.requirement,
								})}
							</span>
						)}
					</div>
				)}
				<ProgressBar
					value={progressOf(item) / total}
					label={t("row.progressLabel", { title, total: formatNumber(total) })}
				/>
				<span className="font-mono text-xs">
					{t("row.progress", {
						progress: formatNumber(progressOf(item)),
						total: formatNumber(total),
					})}
					{steps > 0 ? t("row.stepsToGoal", { steps: formatNumber(steps) }) : ""}
				</span>
				<span className="text-muted font-mono text-xs">
					{t("row.stats", {
						stat: row
							? t("row.statPercent", { percent: formatDecimal(row.statTotalPercent) })
							: t("none"),
						power: row ? formatCompact(row.powerTotal) : t("none"),
					})}
					{item.kind === "gear" && row && !capacityKnown && t("row.capacityUnknown")}
					{item.kind === "gear" &&
						capacityKnown &&
						t("row.capacity", {
							capacity: formatNumber(row.troopsDeploymentCapacity ?? 0),
						})}
				</span>
			</div>
		</li>
	);
}

export const positionLabel = (item: LadderItem) => positionOf(item.kind, item.current) + 1;

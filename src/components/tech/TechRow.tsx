"use client";

import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import { requirementsMet } from "@/service/allianceTech";
import type { TechStatus, TechView } from "@/service/allianceTech";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { costText, unmetNeedsText } from "./techText";

export const TECH_ROW_GRID =
	"lg:grid-cols-[minmax(0,2.4fr)_9rem_minmax(0,1fr)_minmax(0,1.8fr)_5rem_minmax(0,1.5fr)]";

const statusTone: Record<TechStatus, string> = {
	maxed: "text-kept",
	inProgress: "text-primary",
	notStarted: "text-muted",
	locked: "text-locked",
};

interface TechRowProps {
	view: TechView;
	onLevelChange: (nodeId: string, level: number) => void;
	onOpen: (nodeId: string) => void;
}

export function TechRow({ view, onLevelChange, onOpen }: TechRowProps) {
	const t = useTranslations("tech");
	const { node, level, maxLevel, status, next } = view;
	const locked = status === "locked";
	const unmet = next ? unmetNeedsText(next.requirements) : "";

	return (
		<li
			className={`border-line grid items-center gap-x-4 gap-y-2 border-t-[1.5px] px-4 py-3 first:border-t-0 ${TECH_ROW_GRID} ${locked ? "bg-tint" : ""}`}
		>
			<div className="flex min-w-0 items-center gap-3">
				<ItemIcon src={node.img} size={40} className={locked ? "opacity-60" : ""} />
				<span className="flex min-w-0 flex-col">
					<button
						type="button"
						aria-label={t("node.open", { name: node.name })}
						onClick={() => onOpen(node.id)}
						className="text-ink hover:text-primary min-h-11 truncate text-left font-semibold lg:min-h-9"
					>
						{node.name}
					</button>
					<span className="text-muted truncate text-xs">
						{t("node.tierDescription", {
							tier: formatNumber(node.tier),
							description: node.description,
						})}
					</span>
				</span>
			</div>
			<div className="flex flex-col gap-0.5">
				<ValueStepper
					label={t("node.levelLabel", { name: node.name })}
					value={level}
					min={0}
					max={maxLevel}
					disabled={locked}
					display={t("node.levelOf", {
						level: formatNumber(level),
						max: formatNumber(maxLevel),
					})}
					onChange={(value) => onLevelChange(node.id, value)}
				/>
				<span className={`text-xs font-medium ${statusTone[status]}`}>
					{t(`status.${status}`)}
				</span>
			</div>
			<span className="font-mono text-xs">
				{view.bonusAtMax === null
					? t("node.noBonus")
					: view.bonusNow === null
						? t("node.bonusNone", { max: view.bonusAtMax })
						: t("node.bonusOf", { now: view.bonusNow, max: view.bonusAtMax })}
			</span>
			<span className="font-mono text-xs">
				{next ? costText(next.cost) : <span className="text-muted">{t("node.maxed")}</span>}
			</span>
			<span className="font-mono text-xs">
				{next &&
					(next.timeSeconds > 0 ? (
						formatDuration(next.timeSeconds)
					) : (
						<span className="text-muted">{t("node.noTime")}</span>
					))}
			</span>
			<span className="text-xs">
				{next === null ? (
					<span className="text-muted">{t("node.nothingNeeded")}</span>
				) : requirementsMet(next.requirements) ? (
					<span className="text-kept">{t("node.readyToUpgrade")}</span>
				) : (
					<span className="text-changed">{unmet}</span>
				)}
			</span>
		</li>
	);
}

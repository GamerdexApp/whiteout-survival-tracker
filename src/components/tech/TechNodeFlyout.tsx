"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatDuration, formatNumber } from "@/lib/format";
import { buildTechView, remainingToMax, requiredByOf } from "@/service/allianceTech";
import { findTechNode } from "@/data/game/alliance";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { costText } from "./techText";

interface TechNodeFlyoutProps {
	chief: Playthrough;
	nodeId: string | null;
	onLevelChange: (nodeId: string, level: number) => void;
	onOpenNode: (nodeId: string) => void;
	onClose: () => void;
}

const linkClass = "text-link text-start font-semibold underline";

export function TechNodeFlyout({
	chief,
	nodeId,
	onLevelChange,
	onOpenNode,
	onClose,
}: TechNodeFlyoutProps) {
	const t = useTranslations("tech");
	const tf = useTranslations("tech.flyout");
	const node = nodeId ? findTechNode(nodeId) : undefined;
	const view = node ? buildTechView(chief, node) : null;

	return (
		<Flyout
			open={view !== null}
			onClose={onClose}
			title={node?.name ?? ""}
			description={
				node
					? tf("subtitle", {
							category: t(`categories.${node.category}`),
							tier: formatNumber(node.tier),
							description: node.description,
						})
					: ""
			}
			footer={<Button onClick={onClose}>{tf("close")}</Button>}
		>
			{view && node && (
				<>
					<Card className="flex items-center justify-between gap-3 p-4">
						<div className="flex items-center gap-3">
							<ItemIcon src={node.img} size={40} />
							<div className="flex flex-col gap-1">
								<span className="text-muted font-mono text-xs uppercase">
									{tf("level")}
								</span>
								<ValueStepper
									label={t("node.levelLabel", { name: node.name })}
									value={view.level}
									min={0}
									max={view.maxLevel}
									disabled={view.status === "locked"}
									display={t("node.levelOf", {
										level: formatNumber(view.level),
										max: formatNumber(view.maxLevel),
									})}
									onChange={(value) => onLevelChange(node.id, value)}
								/>
							</div>
						</div>
						<div className="flex flex-col items-end gap-1">
							<span className="text-muted font-mono text-xs uppercase">
								{tf("bonusNow")}
							</span>
							<span className="font-mono text-lg font-semibold">
								{view.bonusAtMax === null
									? t("node.noBonus")
									: view.bonusNow === null
										? t("node.bonusNone", { max: view.bonusAtMax })
										: t("node.bonusOf", {
												now: view.bonusNow,
												max: view.bonusAtMax,
											})}
							</span>
						</div>
					</Card>

					<Card className="flex flex-col gap-2 p-4">
						<h3 className="font-semibold">
							{view.next
								? tf("needsFor", { level: formatNumber(view.next.level) })
								: tf("needsNothing")}
						</h3>
						{view.next && view.next.requirements.length === 0 && (
							<p className="text-muted">{tf("needsNothing")}</p>
						)}
						{view.next?.requirements.map((requirement) => (
							<div
								key={requirement.nodeId}
								className="border-line flex items-start justify-between gap-3 border-t-[1.5px] pt-2 first:border-t-0 first:pt-0"
							>
								<span className="flex flex-col">
									<button
										type="button"
										className={linkClass}
										onClick={() => onOpenNode(requirement.nodeId)}
									>
										{requirement.nodeName}
									</button>
									<span className="text-muted text-xs">
										{tf("needsLine", {
											need: formatNumber(requirement.level),
											have: formatNumber(requirement.have),
										})}
									</span>
								</span>
								<span
									className={`text-xs font-medium ${requirement.met ? "text-kept" : "text-changed"}`}
								>
									{requirement.met ? tf("met") : tf("notMet")}
								</span>
							</div>
						))}
					</Card>

					<Card className="flex flex-col gap-2 p-4">
						<h3 className="font-semibold">{tf("requiredBy")}</h3>
						{requiredByOf(node.id).length === 0 ? (
							<p className="text-muted">{tf("requiredByNone")}</p>
						) : (
							requiredByOf(node.id).map((other) => (
								<div
									key={other.nodeId}
									className="border-line flex flex-col border-t-[1.5px] pt-2 first:border-t-0 first:pt-0"
								>
									<button
										type="button"
										className={linkClass}
										onClick={() => onOpenNode(other.nodeId)}
									>
										{other.nodeName}
									</button>
									<span className="text-muted text-xs">
										{tf("requiredByLine", {
											category: t(`categories.${other.category as "Growth"}`),
											tier: formatNumber(other.tier),
											from: formatNumber(other.fromLevel),
											name: node.name,
											need: formatNumber(other.needsLevel),
										})}
									</span>
								</div>
							))
						)}
					</Card>

					<Card className="flex flex-col gap-1 p-4">
						<h3 className="font-semibold">{tf("allLevels")}</h3>
						{node.levels.map((level) => {
							const state =
								level.level <= view.level
									? "done"
									: level.level === view.level + 1
										? "next"
										: "later";
							const needs = level.prerequisites
								.map((requirement) =>
									t("node.requirementPart", {
										name: findTechNode(requirement.id)?.name ?? requirement.id,
										level: formatNumber(requirement.level),
									})
								)
								.join(", ");
							return (
								<div
									key={level.level}
									className={`border-line grid grid-cols-[4.5rem_3.5rem_4rem_1fr_3rem] items-start gap-2 border-t-[1.5px] py-2 text-xs first:border-t-0 ${state === "next" ? "bg-tint" : ""}`}
								>
									<span className="font-semibold">
										{tf("levelRow", { level: formatNumber(level.level) })}
									</span>
									<span className="font-mono">
										{level.bonus ?? t("node.noBonus")}
									</span>
									<span className="font-mono">
										{level.timeSeconds > 0
											? formatDuration(level.timeSeconds)
											: t("node.noTime")}
									</span>
									<span className="flex flex-col gap-0.5 font-mono">
										<span>{costText(level.cost)}</span>
										{needs && <span className="text-muted">{needs}</span>}
									</span>
									<span
										className={`text-end font-medium ${state === "done" ? "text-kept" : state === "next" ? "text-primary" : "text-muted"}`}
									>
										{tf(state)}
									</span>
								</div>
							);
						})}
					</Card>

					<Card className="flex flex-col gap-2 p-4">
						<div className="flex items-center justify-between gap-3">
							<h3 className="font-semibold">{tf("remaining")}</h3>
						</div>
						{view.next === null ? (
							<p className="text-muted">{tf("remainingNone")}</p>
						) : (
							<RemainingBlock view={view} />
						)}
					</Card>
				</>
			)}
		</Flyout>
	);
}

function RemainingBlock({ view }: { view: NonNullable<ReturnType<typeof buildTechView>> }) {
	const tf = useTranslations("tech.flyout");
	const remaining = remainingToMax(view);

	return (
		<>
			<span className="font-mono">{costText(remaining.cost)}</span>
			<span className="text-muted font-mono">
				{remaining.timeSeconds > 0 ? formatDuration(remaining.timeSeconds) : ""}
			</span>
			<span className="sr-only">{tf("remaining")}</span>
		</>
	);
}

"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatDuration, formatNumber } from "@/lib/format";
import type { ResearchNodeView } from "@/service/research";
import { bonusText, requirementStatus } from "@/service/research";
import { findItem } from "@/data/game/items";
import { levelData, maxLevelOf } from "@/data/game/research";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const LEVELS_SHOWN = 5;

const upcomingHeads = ["level", "bonus", "time", "power"] as const;

interface NodeFlyoutProps {
	view: ResearchNodeView | null;
	chief: Playthrough;
	onClose: () => void;
	onOpenPlan: () => void;
}

export function NodeFlyout({ view, chief, onClose, onOpenPlan }: NodeFlyoutProps) {
	const t = useTranslations("research.nodeFlyout");

	return (
		<Flyout
			open={view !== null}
			onClose={onClose}
			title={view?.node.name ?? t("fallbackTitle")}
			description={
				view
					? t("description", {
							category: view.node.category,
							tier: formatNumber(view.node.tier),
							levels: formatNumber(maxLevelOf(view.node)),
						})
					: undefined
			}
			footer={<Button onClick={onClose}>{t("close")}</Button>}
		>
			{view && <NodeContent view={view} chief={chief} onOpenPlan={onOpenPlan} />}
		</Flyout>
	);
}

function NodeContent({
	view,
	chief,
	onOpenPlan,
}: {
	view: ResearchNodeView;
	chief: Playthrough;
	onOpenPlan: () => void;
}) {
	const t = useTranslations("research.nodeFlyout");
	const timeText = (seconds: number | undefined) =>
		seconds === undefined ? t("unknown") : formatDuration(seconds);
	const { node, level, max, goal, hasGoal, placeholder } = view;
	const upcomingTitle =
		level === 0 ? t("upcoming.first") : t("upcoming.after", { level: formatNumber(level) });
	const upcoming = node.levels.filter((item) => item.level > level).slice(0, LEVELS_SHOWN);
	const itemIds = [...new Set(upcoming.flatMap((item) => item.cost.map((cost) => cost.itemId)))];
	const toGoal = hasGoal
		? node.levels.filter((item) => item.level > level && item.level <= goal)
		: [];
	const totals = new Map<string, number>();
	toGoal.forEach((item) =>
		item.cost.forEach((cost) =>
			totals.set(cost.itemId, (totals.get(cost.itemId) ?? 0) + cost.amount)
		)
	);
	const missingTimes = toGoal.filter((item) => item.researchTimeSeconds === undefined).length;
	const nextLevel = levelData(node, level + 1);
	const requirements =
		nextLevel?.prerequisites.map((item) => requirementStatus(item, chief)) ?? [];
	const nextTexts = new Set(requirements.map((item) => item.text));
	const later = [
		...new Set(
			node.levels
				.filter((item) => item.level > level + 1)
				.flatMap((item) =>
					item.prerequisites.map((req) => requirementStatus(req, chief).text)
				)
		),
	].filter((text) => !nextTexts.has(text));

	return (
		<>
			<Card className="flex flex-wrap items-center justify-between gap-3 p-3">
				<div className="flex items-center gap-3">
					<ItemIcon src={node.img} size={40} />
					<span>
						<span className="font-mono font-medium">
							{t("levelOf", { level: formatNumber(level), max: formatNumber(max) })}
						</span>{" "}
						<span className="text-muted">
							(
							{level === 0
								? t("status.notStarted")
								: level === max
									? t("status.maxed")
									: t("status.inProgress")}
							)
						</span>
					</span>
				</div>
				<span className="flex items-center gap-3">
					<span className={hasGoal ? "text-primary font-medium" : "text-muted"}>
						{hasGoal ? t("goal", { goal: formatNumber(goal) }) : t("noGoal")}
					</span>
					<Button onClick={onOpenPlan}>{t("openPlan")}</Button>
				</span>
			</Card>

			{view.maxed ? (
				<Card className="flex flex-col gap-1 p-4">
					<h3 className="font-semibold">{t("maxLevel.title")}</h3>
					<p className="text-muted">{t("maxLevel.nothingLeft")}</p>
					<p>{bonusText(node.levels[max - 1]) || t("maxLevel.noBonus")}</p>
				</Card>
			) : placeholder ? (
				<Card className="flex flex-col gap-1 border-dashed p-4">
					<h3 className="font-semibold">{t("placeholder.title")}</h3>
					<p className="text-muted">{t("placeholder.description")}</p>
				</Card>
			) : (
				<>
					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{upcomingTitle}</h3>
						<ScrollRegion label={upcomingTitle}>
							<table className="w-full min-w-104 text-left">
								<thead>
									<tr>
										{upcomingHeads.map((head) => (
											<th key={head} className="py-1 pr-3">
												<SectionLabel className="text-muted">
													{t(`upcoming.heads.${head}`)}
												</SectionLabel>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{upcoming.map((item) => {
										const inGoal = hasGoal && item.level <= goal;
										return (
											<tr
												key={item.level}
												className={inGoal ? "bg-tint" : ""}
											>
												<td className="py-2 pr-3 font-mono">
													{item.level}{" "}
													{hasGoal && item.level === goal && (
														<Badge tone="added">
															{t("upcoming.goalBadge")}
														</Badge>
													)}
												</td>
												<td className="py-2 pr-3">
													{bonusText(item) || t("upcoming.noBonus")}
												</td>
												<td className="py-2 pr-3 font-mono">
													{timeText(item.researchTimeSeconds)}
												</td>
												<td className="py-2 font-mono">
													{formatNumber(item.power)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</ScrollRegion>
						{hasGoal && <p className="text-muted text-xs">{t("upcoming.shaded")}</p>}
					</Card>

					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{t("cost.title")}</h3>
						<ScrollRegion label={t("cost.title")}>
							<table className="w-full min-w-104 text-right">
								<thead>
									<tr>
										<th className="py-1 pr-3 text-left">
											<SectionLabel className="text-muted">
												{t("cost.level")}
											</SectionLabel>
										</th>
										{itemIds.map((id) => (
											<th key={id} className="py-1 pl-3">
												<SectionLabel className="text-muted">
													{findItem(id)?.name ?? id}
												</SectionLabel>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{upcoming.map((item) => (
										<tr
											key={item.level}
											className="border-line border-t-[1.5px]"
										>
											<td className="py-2 pr-3 text-left font-mono">
												{item.level}
											</td>
											{itemIds.map((id) => (
												<td key={id} className="py-2 pl-3 font-mono">
													{formatNumber(
														item.cost.find((cost) => cost.itemId === id)
															?.amount ?? 0
													)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</ScrollRegion>
					</Card>

					{hasGoal && (
						<Card className="flex flex-col gap-2 p-4">
							<h3 className="font-semibold">
								{t("total.title", {
									level: formatNumber(level),
									goal: formatNumber(goal),
								})}
							</h3>
							<ul className="flex flex-col">
								{[...totals].map(([id, amount]) => (
									<li
										key={id}
										className="flex items-center justify-between gap-3 py-1"
									>
										<span className="flex items-center gap-2">
											<ItemIcon src={findItem(id)?.img} size={20} />
											{findItem(id)?.name ?? id}
										</span>
										<span className="font-mono">{formatNumber(amount)}</span>
									</li>
								))}
							</ul>
							<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-2">
								<span>{t("total.knownTime")}</span>
								<span className="font-mono">
									{formatDuration(
										toGoal.reduce(
											(sum, item) => sum + (item.researchTimeSeconds ?? 0),
											0
										)
									)}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span>{t("total.power")}</span>
								<span className="font-mono">
									{formatNumber(
										toGoal.reduce((sum, item) => sum + item.power, 0)
									)}
								</span>
							</div>
							{missingTimes > 0 && (
								<p className="text-muted text-xs">
									{t("total.missingTimes", {
										count: missingTimes,
										amount: formatNumber(missingTimes),
									})}
								</p>
							)}
						</Card>
					)}

					<Card className="flex flex-col gap-2 p-4">
						<h3 className="font-semibold">
							{t("requirements.title", { level: formatNumber(level + 1) })}
						</h3>
						{requirements.length === 0 ? (
							<p className="text-muted">{t("requirements.none")}</p>
						) : (
							<ul className="flex flex-col">
								{requirements.map((item) => (
									<li
										key={item.text}
										className="flex items-center justify-between gap-3 py-1"
									>
										<span>
											{item.text}{" "}
											<span className="text-muted text-xs">{item.yours}</span>
										</span>
										<Badge tone={item.met ? "kept" : "changed"}>
											{item.met
												? t("requirements.met")
												: t("requirements.notMet")}
										</Badge>
									</li>
								))}
							</ul>
						)}
						{later.length > 0 && (
							<p className="text-muted text-xs">
								{t("requirements.later", { list: later.join(", ") })}
							</p>
						)}
					</Card>
				</>
			)}
		</>
	);
}

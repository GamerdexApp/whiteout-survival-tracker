"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { tabLockOf, tabLockText } from "@/service/research";
import type { MassSetPlan } from "@/service/researchMassSet";
import { planMassSet } from "@/service/researchMassSet";
import type { ResearchTab } from "@/data/game/research";
import { findResearch, gameOrder, maxLevelOf, nodesOfTab, tabName } from "@/data/game/research";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Dialog } from "@/comps/ui/Dialog";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";

interface ResearchMassSetDialogProps {
	open: boolean;
	chief: Playthrough;
	tab: ResearchTab;
	onClose: () => void;
	onSave: (plan: MassSetPlan) => void;
}

const PREVIEW_ROWS = 6;

export function ResearchMassSetDialog({
	open,
	chief,
	tab,
	onClose,
	onSave,
}: ResearchMassSetDialogProps) {
	const t = useTranslations("research");
	const nodes = useMemo(() => [...nodesOfTab(tab)].sort(gameOrder), [tab]);
	const [wasOpen, setWasOpen] = useState(false);
	const [nodeId, setNodeId] = useState(nodes[0].id);
	const [level, setLevel] = useState(1);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setNodeId(nodes[nodes.length - 1].id);
			setLevel(maxLevelOf(nodes[nodes.length - 1]));
		}
	}

	const node = findResearch(nodeId) ?? nodes[0];
	const safeLevel = Math.min(level, maxLevelOf(node));
	const plan = useMemo(
		() => planMassSet(chief, node, safeLevel, tab),
		[chief, node, safeLevel, tab]
	);
	const lock = tabLockOf(tab, chief);
	const canSave = !lock && plan.changes.length > 0 && plan.blockers.length === 0;
	const shown = plan.changes.slice(0, PREVIEW_ROWS);
	const hidden = plan.changes.length - shown.length;
	const stops = Array.from({ length: maxLevelOf(node) }, (_, index) => ({
		value: String(index + 1),
		label: t("massSet.stop", {
			level: formatNumber(index + 1),
			max: formatNumber(maxLevelOf(node)),
		}),
	}));

	return (
		<Dialog
			open={open}
			onClose={onClose}
			variant="wide"
			title={t("massSet.title", { tab: tabName(tab) })}
			description={t("massSet.description")}
			footer={
				<>
					<Button onClick={onClose}>{t("massSet.cancel")}</Button>
					<Button variant="primary" disabled={!canSave} onClick={() => onSave(plan)}>
						{t("massSet.set", {
							nodes: t("nodeCount", {
								count: plan.changes.length,
								amount: formatNumber(plan.changes.length),
							}),
						})}
					</Button>
				</>
			}
		>
			{lock && <Note tone="warning">{tabLockText(tab, lock)}</Note>}
			<div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
				<div className="flex flex-col gap-1.5">
					<SectionLabel className="text-muted">{t("massSet.node")}</SectionLabel>
					<Select
						data-autofocus
						aria-label={t("massSet.node")}
						value={node.id}
						onChange={(event) => {
							const next = findResearch(event.target.value) ?? node;
							setNodeId(next.id);
							setLevel(maxLevelOf(next));
						}}
					>
						{nodes.map((item) => (
							<option key={item.id} value={item.id}>
								{item.name}
							</option>
						))}
					</Select>
				</div>
				<div className="flex flex-col gap-1.5">
					<SectionLabel className="text-muted">{t("massSet.level")}</SectionLabel>
					<LevelStepper
						label={t("massSet.levelToSet")}
						stops={stops}
						value={String(safeLevel)}
						onChange={(value) => setLevel(Number(value))}
					/>
				</div>
			</div>
			<Card className="flex flex-col gap-2 p-4">
				<h3 className="font-semibold">{t("massSet.whatChanges", { tab: tabName(tab) })}</h3>
				{plan.changes.length === 0 ? (
					<p className="text-muted">{t("massSet.nothingChanges")}</p>
				) : (
					<ul>
						{shown.map((change) => (
							<li
								key={change.node.id}
								className="border-line flex items-baseline justify-between gap-3 border-t-[1.5px] py-1.5 first:border-t-0"
							>
								<span className={change.node.id === node.id ? "font-semibold" : ""}>
									{change.node.name}
								</span>
								<span className="font-mono text-xs">
									{t("massSet.change", {
										from: formatNumber(change.from),
										to: formatNumber(change.to),
									})}
								</span>
							</li>
						))}
					</ul>
				)}
				{hidden > 0 && (
					<p className="text-muted">
						{t("massSet.hidden", { amount: formatNumber(hidden) })}
					</p>
				)}
				<p className="text-muted text-xs">
					{t("massSet.alreadyMax", {
						count: plan.alreadyMax,
						amount: formatNumber(plan.alreadyMax),
					})}
				</p>
			</Card>
			{plan.blockers.length > 0 && (
				<Note tone="warning" title={t("massSet.blockersTitle")}>
					{t("massSet.blockers", {
						list: plan.blockers
							.slice(0, 4)
							.map((blocker) =>
								t("massSet.blocker", {
									name: blocker.node.name,
									building: blocker.text,
								})
							)
							.join(". "),
						more:
							plan.blockers.length > 4
								? t("massSet.blockersMore", {
										amount: formatNumber(plan.blockers.length - 4),
									})
								: "",
					})}
				</Note>
			)}
			<p className="text-muted">{t("massSet.footnote")}</p>
		</Dialog>
	);
}

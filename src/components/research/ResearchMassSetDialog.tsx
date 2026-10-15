"use client";

import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { tabLockOf, tabLockText } from "@/service/research";
import type { MassSetPlan } from "@/service/researchMassSet";
import { planMassSet } from "@/service/researchMassSet";
import type { ResearchTab } from "@/data/game/research";
import { findResearch, gameOrder, maxLevelOf, nodesOfTab } from "@/data/game/research";
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
		label: `${index + 1} of ${maxLevelOf(node)}`,
	}));

	return (
		<Dialog
			open={open}
			onClose={onClose}
			variant="wide"
			title={`Mass set, ${tab.name}`}
			description="Pick a node and a level. Everything before it in the tree goes to max."
			footer={
				<>
					<Button onClick={onClose}>Cancel</Button>
					<Button variant="primary" disabled={!canSave} onClick={() => onSave(plan)}>
						Set {plan.changes.length} {plan.changes.length === 1 ? "node" : "nodes"}
					</Button>
				</>
			}
		>
			{lock && <Note tone="warning">{tabLockText(tab, lock)}</Note>}
			<div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
				<div className="flex flex-col gap-1.5">
					<SectionLabel className="text-muted">Node</SectionLabel>
					<Select
						data-autofocus
						aria-label="Node"
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
					<SectionLabel className="text-muted">Level</SectionLabel>
					<LevelStepper
						label="Level to set"
						stops={stops}
						value={String(safeLevel)}
						onChange={(value) => setLevel(Number(value))}
					/>
				</div>
			</div>
			<Card className="flex flex-col gap-2 p-4">
				<h3 className="font-semibold">What changes in the {tab.name} tab</h3>
				{plan.changes.length === 0 ? (
					<p className="text-muted">
						Nothing changes. Every node here is already at or above this.
					</p>
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
									{change.from} to {change.to}
								</span>
							</li>
						))}
					</ul>
				)}
				{hidden > 0 && <p className="text-muted">and {hidden} more earlier nodes</p>}
				<p className="text-muted text-xs">
					{plan.alreadyMax} earlier {plan.alreadyMax === 1 ? "node is" : "nodes are"}{" "}
					already at max and stay as they are. Nodes later in the tree are not touched. A
					level that is already higher stays.
				</p>
			</Card>
			{plan.blockers.length > 0 && (
				<Note tone="warning" title="Some nodes need a building first.">
					{plan.blockers
						.slice(0, 4)
						.map((blocker) => `${blocker.node.name} needs ${blocker.text}`)
						.join(". ")}
					{plan.blockers.length > 4 ? ` and ${plan.blockers.length - 4} more` : ""}. Pick
					an earlier node or raise the building on the Buildings page.
				</Note>
			)}
			<p className="text-muted">
				Mass set changes the saved levels of this tab only. It never lowers a level. Goals
				are not changed.
			</p>
		</Dialog>
	);
}

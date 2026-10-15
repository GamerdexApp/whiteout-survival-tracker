"use client";

import { RESEARCH_TREE_LAYOUT } from "whiteout-survival-data";
import type { ResearchTreeEdge, ResearchTreeNode } from "whiteout-survival-data";
import type { ResearchNodeView } from "@/service/research";
import { findItem } from "@/data/game/items";
import { researchTabs, treeTabs } from "@/data/game/research";
import { ItemIcon } from "@/comps/ui/ItemIcon";

const { nodeWidth, nodeHeight, labelHeight: layoutLabelHeight } = RESEARCH_TREE_LAYOUT;

// The layout reserves room for a one line label. Ours holds two lines of name and the level pill, so
// every line starts and ends this much further from the icon.
const CAPTION_PADDING = 18;
const labelHeight = layoutLabelHeight + CAPTION_PADDING;
const HALF_WIDTH = nodeWidth / 2;
const HALF_HEIGHT = nodeHeight / 2;
const DEFAULT_SPLIT = 0.5;

interface ResearchTreeProps {
	tabId: string;
	views: ResearchNodeView[];
	visibleIds: Set<string>;
	onOpen: (nodeId: string) => void;
}

type Point = { x: number; y: number };

/**
 * The line of a link. A vertical link leaves the bottom of the parent and enters the top of the
 * child, a horizontal one leaves the right side and enters the left side, and an up link leaves the
 * top and enters the bottom. The line bends once at `splitFraction` of the way.
 */
const edgePath = (edge: ResearchTreeEdge, parent: ResearchTreeNode, child: ResearchTreeNode) => {
	const split = edge.splitFraction ?? DEFAULT_SPLIT;
	const parentLabel = (below: boolean) => (below ? labelHeight : 0);

	if (edge.shape === "horizontal") {
		const start: Point = { x: parent.x + HALF_WIDTH, y: parent.y };
		const end: Point = { x: child.x - HALF_WIDTH, y: child.y };
		const middle = start.x + (end.x - start.x) * split;
		return `M ${start.x} ${start.y} H ${middle} V ${end.y} H ${end.x}`;
	}

	const goingUp = edge.shape === "up";
	const start: Point = {
		x: parent.x,
		y: goingUp
			? parent.y - HALF_HEIGHT - parentLabel(parent.labelAbove)
			: parent.y + HALF_HEIGHT + parentLabel(!parent.labelAbove),
	};
	const end: Point = {
		x: child.x,
		y: goingUp
			? child.y + HALF_HEIGHT + parentLabel(!child.labelAbove)
			: child.y - HALF_HEIGHT - parentLabel(child.labelAbove),
	};
	const middle = start.y + (end.y - start.y) * split;
	return `M ${start.x} ${start.y} V ${middle} H ${end.x} V ${end.y}`;
};

function Legend() {
	return (
		<ul className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-xs">
			<li className="flex items-center gap-1.5">
				<span className="border-primary bg-primary size-3 rounded-sm border-[1.5px]" />
				Max
			</li>
			<li className="flex items-center gap-1.5">
				<span className="border-primary bg-surface size-3 rounded-sm border-[1.5px]" />
				In progress
			</li>
			<li className="flex items-center gap-1.5">
				<span className="border-line bg-surface size-3 rounded-sm border-[1.5px]" />
				Not started
			</li>
			<li className="flex items-center gap-1.5">
				<span className="border-line size-3 rounded-sm border-[1.5px] border-dashed" />
				Locked
			</li>
		</ul>
	);
}

const pillText = (view: ResearchNodeView) => {
	if (view.locked && view.level === 0) return "Locked";
	if (view.maxed) return `Max ${view.max}`;
	return `Lv ${view.level} of ${view.max}`;
};

export function ResearchTree({ tabId, views, visibleIds, onOpen }: ResearchTreeProps) {
	const tab = treeTabs.find((item) => item.id === tabId);
	if (!tab) return null;

	const tabName = researchTabs.find((item) => item.id === tabId)?.name ?? tab.name;
	const nodesById = new Map(tab.nodes.map((node) => [node.id, node]));
	const viewsById = new Map(views.map((view) => [view.node.id, view]));

	return (
		<div className="border-line bg-surface flex flex-col gap-3 rounded-md border-[1.5px] p-3">
			<Legend />
			<div
				className="border-line bg-bg max-h-[70dvh] overflow-auto rounded-md border-[1.5px]"
				role="region"
				aria-label={`${tabName} research tree`}
				tabIndex={0}
			>
				<div className="relative" style={{ width: tab.width, height: tab.height }}>
					<svg
						aria-hidden="true"
						width={tab.width}
						height={tab.height}
						className="text-muted pointer-events-none absolute inset-0"
					>
						{tab.edges.map((edge) => {
							const parent = nodesById.get(edge.from);
							const child = nodesById.get(edge.to);
							if (!parent || !child) return null;
							return (
								<path
									key={`${edge.from}-${edge.to}`}
									d={edgePath(edge, parent, child)}
									fill="none"
									stroke="currentColor"
									strokeWidth={1.5}
								/>
							);
						})}
					</svg>
					{tab.nodes.map((node) => {
						const view = viewsById.get(node.id);
						const left = node.x - HALF_WIDTH;
						const top = node.labelAbove
							? node.y - HALF_HEIGHT - labelHeight
							: node.y - HALF_HEIGHT;

						if (node.kind === "hub" || !view) {
							const item = findItem(node.id);
							return (
								<div
									key={node.id}
									className="absolute flex flex-col items-center gap-1"
									style={{ left, top, width: nodeWidth }}
								>
									<div
										className="border-line bg-surface flex items-center justify-center rounded-md border-[1.5px]"
										style={{ width: nodeWidth, height: nodeHeight }}
									>
										<ItemIcon src={item?.img} size={36} />
									</div>
									<span className="text-center text-[11px] leading-tight">
										{item?.name ?? node.id}
									</span>
								</div>
							);
						}

						const dim = visibleIds.has(node.id) ? "" : "opacity-30";
						const state = view.maxed
							? "border-primary bg-tint"
							: view.level > 0
								? "border-primary bg-surface"
								: view.locked
									? "border-line border-dashed bg-surface"
									: "border-line bg-surface";
						const caption = (
							<>
								<span
									title={view.node.name}
									className="line-clamp-2 text-center text-[11px] leading-tight break-words"
								>
									{view.node.name}
								</span>
								<span
									className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap ${
										view.maxed
											? "bg-primary text-on-primary"
											: view.level > 0
												? "border-primary text-primary border-[1.5px]"
												: "text-muted bg-track"
									}`}
								>
									{pillText(view)}
								</span>
							</>
						);

						return (
							<button
								key={node.id}
								type="button"
								onClick={() => onOpen(node.id)}
								aria-label={`${view.node.name}, ${pillText(view)}. Open details`}
								className={`absolute flex flex-col items-center ${dim}`}
								style={{ left, top, width: nodeWidth }}
							>
								{node.labelAbove && (
									<span
										className="bg-bg flex flex-col items-center justify-end gap-1 pb-1"
										style={{ height: labelHeight }}
									>
										{caption}
									</span>
								)}
								<span
									className={`relative flex items-center justify-center rounded-md border-2 ${state}`}
									style={{ width: nodeWidth, height: nodeHeight }}
								>
									<ItemIcon src={view.node.img} size={36} />
									<span className="bg-surface text-muted absolute -top-2 -left-1 rounded-sm px-1 font-mono text-[10px]">
										T{view.node.tier}
									</span>
								</span>
								{!node.labelAbove && (
									<span
										className="bg-bg flex flex-col items-center justify-start gap-1 pt-1"
										style={{ height: labelHeight }}
									>
										{caption}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

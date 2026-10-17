"use client";

import { translator } from "@/i18n/formatter";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { ResearchNodeView } from "@/service/research";
import { findItem } from "@/data/game/items";
import { researchTabs, tabName, treeTabs } from "@/data/game/research";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import {
	edgePath,
	HALF_HEIGHT,
	HALF_WIDTH,
	labelHeight,
	nodeHeight,
	nodeWidth,
	spacedTab,
} from "./treeGeometry";

interface ResearchTreeProps {
	tabId: string;
	views: ResearchNodeView[];
	visibleIds: Set<string>;
	onOpen: (nodeId: string) => void;
}

function Legend() {
	const t = useTranslations("research.tree");

	return (
		<ul className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-xs">
			<li className="flex items-center gap-1.5">
				<span className="border-primary bg-primary size-3 rounded-sm border-[1.5px]" />
				{t("legend.max")}
			</li>
			<li className="flex items-center gap-1.5">
				<span className="border-primary bg-surface size-3 rounded-sm border-[1.5px]" />
				{t("legend.inProgress")}
			</li>
			<li className="flex items-center gap-1.5">
				<span className="border-line bg-surface size-3 rounded-sm border-[1.5px]" />
				{t("legend.notStarted")}
			</li>
			<li className="flex items-center gap-1.5">
				<span className="border-line size-3 rounded-sm border-[1.5px] border-dashed" />
				{t("legend.locked")}
			</li>
		</ul>
	);
}

const pillText = (view: ResearchNodeView) => {
	const t = translator("research");
	if (view.locked && view.level === 0) return t("tree.legend.locked");
	if (view.maxed) return t("tree.pillMax", { max: formatNumber(view.max) });
	return t("tree.pillLevel", { level: formatNumber(view.level), max: formatNumber(view.max) });
};

export function ResearchTree({ tabId, views, visibleIds, onOpen }: ResearchTreeProps) {
	const t = useTranslations("research.tree");
	const tab = treeTabs.find((item) => item.id === tabId);
	if (!tab) return null;

	const researchTab = researchTabs.find((item) => item.id === tabId);
	const name = researchTab ? tabName(researchTab) : tab.name;
	const spaced = spacedTab(tab.nodes, tab.height);
	const nodesById = new Map(spaced.nodes.map((node) => [node.id, node]));
	const viewsById = new Map(views.map((view) => [view.node.id, view]));

	return (
		<div className="border-line bg-surface flex flex-col gap-3 rounded-md border-[1.5px] p-3">
			<Legend />
			<div
				className="border-line bg-bg max-h-[70dvh] overflow-auto rounded-md border-[1.5px]"
				role="region"
				aria-label={t("region", { tab: name })}
				tabIndex={0}
			>
				<div className="relative" style={{ width: tab.width, height: spaced.height }}>
					<svg
						aria-hidden="true"
						width={tab.width}
						height={spaced.height}
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
					{spaced.nodes.map((node) => {
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
									className="line-clamp-2 text-center text-[11px] leading-tight wrap-break-word"
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
								aria-label={t("openNode", {
									name: view.node.name,
									pill: pillText(view),
								})}
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

import type { ResearchNode } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { findResearch, treeTabs } from "@/data/game/research";
import {
	edgePath,
	HALF_HEIGHT,
	HALF_WIDTH,
	labelHeight,
	nodeHeight,
	nodeWidth,
	spacedTab,
} from "@/comps/research/treeGeometry";
import { ItemIcon } from "@/comps/ui/ItemIcon";

interface WikiResearchTreeProps {
	treeTabId: string;
	matchingIds: Set<string>;
	onOpen: (node: ResearchNode) => void;
	regionLabel: string;
}

export function WikiResearchTree({
	treeTabId,
	matchingIds,
	onOpen,
	regionLabel,
}: WikiResearchTreeProps) {
	const t = useTranslations("wikiResearch");
	const tab = treeTabs.find((item) => item.id === treeTabId);
	if (!tab) return null;

	const spaced = spacedTab(tab.nodes, tab.height);
	const nodesById = new Map(spaced.nodes.map((node) => [node.id, node]));
	const levelsText = (node: ResearchNode) =>
		t("levels", { count: node.levels.length, amount: formatNumber(node.levels.length) });

	return (
		<div
			className="border-line bg-bg max-h-[70dvh] overflow-auto rounded-md border-[1.5px]"
			role="region"
			aria-label={regionLabel}
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
				{spaced.nodes.map((layoutNode) => {
					const left = layoutNode.x - HALF_WIDTH;
					const top = layoutNode.labelAbove
						? layoutNode.y - HALF_HEIGHT - labelHeight
						: layoutNode.y - HALF_HEIGHT;
					const node =
						layoutNode.kind === "hub" ? undefined : findResearch(layoutNode.id);

					if (!node) {
						const item = findItem(layoutNode.id);
						return (
							<div
								key={layoutNode.id}
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
									{item?.name ?? layoutNode.id}
								</span>
							</div>
						);
					}

					const caption = (
						<>
							<span
								title={node.name}
								className="line-clamp-2 text-center text-[11px] leading-tight wrap-break-word"
							>
								{node.name}
							</span>
							<span className="text-muted bg-track rounded-full px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap">
								{levelsText(node)}
							</span>
						</>
					);

					return (
						<button
							key={node.id}
							type="button"
							aria-haspopup="dialog"
							data-tree-node
							onClick={() => onOpen(node)}
							aria-label={t("tree.openNode", {
								name: node.name,
								levels: levelsText(node),
							})}
							className={`absolute flex flex-col items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring) ${
								matchingIds.has(node.id) ? "" : "opacity-30"
							}`}
							style={{ left, top, width: nodeWidth }}
						>
							{layoutNode.labelAbove && (
								<span
									className="bg-bg flex flex-col items-center justify-end gap-1 pb-1"
									style={{ height: labelHeight }}
								>
									{caption}
								</span>
							)}
							<span
								className="border-line bg-surface relative flex items-center justify-center rounded-md border-2"
								style={{ width: nodeWidth, height: nodeHeight }}
							>
								<ItemIcon src={node.img} size={36} />
								<span className="bg-surface text-muted absolute -top-2 -left-1 rounded-sm px-1 font-mono text-[10px]">
									{t("tree.tier", { tier: formatNumber(node.tier) })}
								</span>
							</span>
							{!layoutNode.labelAbove && (
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
	);
}

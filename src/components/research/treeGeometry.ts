import type {
  ResearchTreeEdge,
  ResearchTreeNode,
} from "whiteout-survival-data";
import { treeLayout } from "@/data/game/research";

export const { nodeWidth, nodeHeight } = treeLayout;
const layoutLabelHeight = treeLayout.labelHeight;

// The layout reserves room for a one line label. Ours holds two lines of name and the level pill, so
// every line starts and ends this much further from the icon.
const CAPTION_PADDING = 18;
export const labelHeight = layoutLabelHeight + CAPTION_PADDING;
export const HALF_WIDTH = nodeWidth / 2;
export const HALF_HEIGHT = nodeHeight / 2;
const DEFAULT_SPLIT = 0.5;

type Point = { x: number; y: number };

// Room to keep clear between a caption and the node under it, so the tier badge that hangs over the
// top of a node never touches the level pill above.
const STACK_GAP = 12;

/**
 * The layout of the package spaces nodes in a column for a one line label. A node with its two line
 * name and level pill is taller, so a column of nodes that are close together overlaps. This
 * stretches every vertical position by the smallest factor that clears the tightest column. A tab
 * with enough room is left as it is.
 */
export const spacedTab = (nodes: ResearchTreeNode[], height: number) => {
  const below = (node: ResearchTreeNode) => (node.labelAbove ? 0 : labelHeight);
  const above = (node: ResearchTreeNode) => (node.labelAbove ? labelHeight : 0);

  let factor = 1;
  for (const upper of nodes) {
    for (const lower of nodes) {
      const distance = lower.y - upper.y;
      if (distance <= 0 || Math.abs(lower.x - upper.x) >= nodeWidth) continue;
      const needed = nodeHeight + below(upper) + above(lower) + STACK_GAP;
      factor = Math.max(factor, needed / distance);
    }
  }

  return {
    nodes: nodes.map((node) => ({ ...node, y: node.y * factor })),
    height: height * factor,
  };
};

/**
 * The line of a link. A vertical link leaves the bottom of the parent and enters the top of the
 * child, a horizontal one leaves the right side and enters the left side, and an up link leaves the
 * top and enters the bottom. The line bends once at `splitFraction` of the way.
 */
export const edgePath = (
  edge: ResearchTreeEdge,
  parent: ResearchTreeNode,
  child: ResearchTreeNode,
) => {
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

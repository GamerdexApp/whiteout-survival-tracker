import type { ResearchNode } from "whiteout-survival-data";
import type { Playthrough } from "@/types/app";
import type { ResearchTab } from "@/data/game/research";
import { maxLevelOf, nodesOfTab } from "@/data/game/research";
import { levelOfNode, requirementStatus, withResearchLevels } from "./research";

/**
 * Every node of the tab that the picked node depends on, directly or through other nodes. Only the
 * tab counts, because Mass set works on the current tab.
 */
export const ancestorsOf = (node: ResearchNode, tab: ResearchTab) => {
  const inTab = new Map(nodesOfTab(tab).map((item) => [item.id, item]));
  const found = new Set<string>();
  const pending = [node];

  while (pending.length > 0) {
    const current = pending.pop() as ResearchNode;
    current.levels
      .flatMap((level) => level.prerequisites)
      .filter((requirement) => requirement.type === "research")
      .forEach((requirement) => {
        const parent = inTab.get(requirement.id);
        if (parent && parent.id !== node.id && !found.has(parent.id)) {
          found.add(parent.id);
          pending.push(parent);
        }
      });
  }

  return [...found].map((id) => inTab.get(id) as ResearchNode);
};

export interface MassSetChange {
  node: ResearchNode;
  from: number;
  to: number;
}

export interface MassSetPlan {
  changes: MassSetChange[];
  alreadyMax: number;
  blockers: { node: ResearchNode; text: string }[];
}

/**
 * The picked node goes to `level` and every node before it goes to its top level. A node that is
 * already higher stays, so Mass set never lowers a level. A changed node is blocked when a level
 * on the way needs a building that the chief does not have. Research requirements are met by the
 * nodes that the same Mass set raises.
 */
export const planMassSet = (
  chief: Playthrough,
  node: ResearchNode,
  level: number,
  tab: ResearchTab,
): MassSetPlan => {
  const ancestors = ancestorsOf(node, tab);
  const wanted: { node: ResearchNode; to: number }[] = [
    ...ancestors.map((ancestor) => ({
      node: ancestor,
      to: maxLevelOf(ancestor),
    })),
    { node, to: level },
  ];

  const changes: MassSetChange[] = [];
  let alreadyMax = 0;
  wanted.forEach(({ node: target, to }) => {
    const from = levelOfNode(chief, target);
    if (from >= to) {
      if (target.id !== node.id) alreadyMax += 1;
      return;
    }
    changes.push({ node: target, from, to });
  });

  const blockers = changes.flatMap((change) => {
    const unmet = change.node.levels
      .filter((item) => item.level <= change.to)
      .flatMap((item) => item.prerequisites)
      .filter((requirement) => requirement.type === "building")
      .map((requirement) => requirementStatus(requirement, chief))
      .find((status) => !status.met);
    return unmet ? [{ node: change.node, text: unmet.text }] : [];
  });

  return { changes, alreadyMax, blockers };
};

export const applyMassSet = (chief: Playthrough, plan: MassSetPlan) =>
  withResearchLevels(
    chief,
    Object.fromEntries(
      plan.changes.map((change) => [change.node.id, change.to]),
    ),
  );

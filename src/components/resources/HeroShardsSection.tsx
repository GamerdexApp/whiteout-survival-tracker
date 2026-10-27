"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { updateChiefById } from "@/service/chiefs";
import {
	EXPEDITION_MANUALS,
	EXPLORATION_MANUALS,
	GENERAL_HERO_SHARDS,
} from "@/service/coreResources";
import { buildHeroViews, hasEveryStar, withHeroShards } from "@/service/heroes";
import type { HeroView } from "@/service/heroes";
import { ownedCount, withOwnedCount } from "@/service/inventory";
import { MAX_STAR, skillLevelRange, skillsOf } from "@/data/game/heroes";
import { findItem } from "@/data/game/items";
import { CollapsibleSection } from "@/comps/ui/CollapsibleSection";
import { Note } from "@/comps/ui/Note";
import { SwitchRow } from "@/comps/ui/Switch";
import { CountCell, CountField, CountRow, FOUR_PER_ROW_COLUMNS, WRAPPING_LABEL } from "./CoreCells";

const hasMaxedSkills = (view: HeroView, branch: "exploration" | "expedition") =>
	skillsOf(view.hero)
		.filter((entry) => entry.branch === branch)
		.every(({ skill }) => view.skillLevels[skill.name] >= skillLevelRange(skill, MAX_STAR).max);

const byGeneration = (views: HeroView[]) => {
	const groups = new Map<number, HeroView[]>();
	views.forEach((view) => {
		groups.set(view.hero.generation, [...(groups.get(view.hero.generation) ?? []), view]);
	});
	return [...groups.entries()].sort(([a], [b]) => a - b);
};

export function HeroShardsSection({ chief }: { chief: Playthrough }) {
	const t = useTranslations("resources.core.heroShards");
	const tCount = useTranslations("resources.countControl");
	const { updateData } = usePlaythrough();
	const [showCompleted, setShowCompleted] = useState(false);

	const views = buildHeroViews(chief);
	const shown = showCompleted ? views : views.filter((view) => !hasEveryStar(view));
	const isRarityCompleted = (rarity: string) =>
		views.filter((view) => view.hero.rarity === rarity).every(hasEveryStar);
	const shownGeneralShards = GENERAL_HERO_SHARDS.filter(
		({ rarity }) => showCompleted || !isRarityCompleted(rarity)
	);
	const isRaritySkillsMaxed = (rarity: string, branch: "exploration" | "expedition") =>
		views
			.filter((view) => view.hero.rarity === rarity)
			.every((view) => hasMaxedSkills(view, branch));
	const shownManuals = (
		manuals: readonly { itemId: string; rarity: string }[],
		branch: "exploration" | "expedition"
	) => manuals.filter(({ rarity }) => showCompleted || !isRaritySkillsMaxed(rarity, branch));
	const shownExpeditionManuals = shownManuals(EXPEDITION_MANUALS, "expedition");
	const shownExplorationManuals = shownManuals(EXPLORATION_MANUALS, "exploration");
	const hiddenCount =
		views.length -
		shown.length +
		GENERAL_HERO_SHARDS.length -
		shownGeneralShards.length +
		EXPEDITION_MANUALS.length -
		shownExpeditionManuals.length +
		EXPLORATION_MANUALS.length -
		shownExplorationManuals.length;

	const setShards = (heroId: string, count: number) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) => withHeroShards(current, heroId, count))
		);
	};

	const setItemCount = (itemId: string, count: number) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) => withOwnedCount(current, itemId, count))
		);
	};

	return (
		<CollapsibleSection title={t("section")}>
			<SwitchRow
				label={t("showCompleted")}
				description={
					showCompleted ? t("hintShown") : t("hintHidden", { count: hiddenCount })
				}
				checked={showCompleted}
				onChange={setShowCompleted}
			/>
			{shown.length === 0 && <Note>{t("allCompleted")}</Note>}
			{shownGeneralShards.length > 0 && (
				<CountRow title={t("generalShards")} columns={FOUR_PER_ROW_COLUMNS}>
					{shownGeneralShards.map(({ itemId }) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={findItem(itemId)?.name ?? itemId}
							count={ownedCount(chief, itemId)}
							onChange={setItemCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
			)}
			{shownExpeditionManuals.length > 0 && (
				<CountRow title={t("expeditionManuals")} columns={FOUR_PER_ROW_COLUMNS}>
					{shownExpeditionManuals.map(({ itemId }) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={findItem(itemId)?.name ?? itemId}
							count={ownedCount(chief, itemId)}
							onChange={setItemCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
			)}
			{shownExplorationManuals.length > 0 && (
				<CountRow title={t("explorationManuals")} columns={FOUR_PER_ROW_COLUMNS}>
					{shownExplorationManuals.map(({ itemId }) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={findItem(itemId)?.name ?? itemId}
							count={ownedCount(chief, itemId)}
							onChange={setItemCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
			)}
			{byGeneration(shown).map(([generation, generationViews]) => (
				<CountRow
					key={generation}
					title={t("generation", { generation })}
					columns={FOUR_PER_ROW_COLUMNS}
				>
					{generationViews.map((view) => (
						<CountField
							key={view.hero.id}
							img={view.hero.shardImg ?? view.hero.img}
							label={view.hero.name}
							ownedLabel={tCount("owned", {
								name: t("shardName", { name: view.hero.name }),
							})}
							count={view.shards}
							onChange={(count) => setShards(view.hero.id, count)}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
			))}
		</CollapsibleSection>
	);
}

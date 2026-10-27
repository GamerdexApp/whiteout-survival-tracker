"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatCompact, formatDuration } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import {
	AFFINITY_GIFT_ITEM_IDS,
	BASE_RESOURCE_IDS,
	chestRows,
	CHIEF_CHARM_ITEM_IDS,
	CHIEF_GEAR_AND_CHARM_CHEST_ITEM_IDS,
	CHIEF_GEAR_ITEM_IDS,
	COMMON_EXPERT_ITEM_IDS,
	EXPERT_SIGILS,
	FIRE_CRYSTAL_ITEM_IDS,
	HERO_GEAR_ITEM_IDS,
	HERO_GEAR_MATERIAL_ITEM_IDS,
	packRows,
	PET_ADVANCEMENT_ITEM_IDS,
	PET_FOOD_AND_MARK_ITEM_IDS,
	speedupRows,
} from "@/service/coreResources";
import { ownedCount, withOwnedCount } from "@/service/inventory";
import { findExpert } from "@/data/game/experts";
import { findItem } from "@/data/game/items";
import { CollapsibleSection } from "@/comps/ui/CollapsibleSection";
import { CountCell, CountRow, FOUR_PER_ROW_COLUMNS, WRAPPING_LABEL } from "./CoreCells";
import { HeroShardsSection } from "./HeroShardsSection";

const PACK_COLUMNS = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";
const CHEST_COLUMNS = "grid-cols-1 sm:grid-cols-3";
const BASE_COLUMNS = "grid-cols-1 sm:grid-cols-2";
const FIRE_CRYSTAL_COLUMNS = "grid-cols-1 sm:grid-cols-3";
const SIGIL_COLUMNS = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";
const EXPERT_ITEM_COLUMNS = "grid-cols-1 sm:grid-cols-3";

export function CoreResourcesTab({ chief }: { chief: Playthrough }) {
	const t = useTranslations("resources.core");
	const tSpeedups = useTranslations("resources.view.speedups.types");
	const { updateData } = usePlaythrough();

	const setCount = (itemId: string, count: number) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) => withOwnedCount(current, itemId, count))
		);
	};

	const baseName = (resourceId: string) => findItem(resourceId)?.name ?? resourceId;

	return (
		<div className="flex flex-col gap-4">
			<CollapsibleSection title={t("resourcesSection")}>
				<CountRow title={t("counts")} columns={BASE_COLUMNS}>
					{BASE_RESOURCE_IDS.map((resourceId) => (
						<CountCell
							key={resourceId}
							itemId={resourceId}
							label={baseName(resourceId)}
							count={ownedCount(chief, resourceId)}
							onChange={setCount}
						/>
					))}
				</CountRow>

				<div className="flex flex-col gap-3">
					<h3 className="font-medium">{t("backpack")}</h3>
					{packRows.map((row) => (
						<CountRow
							key={`${row.resourceId}-${row.secured}`}
							title={
								row.secured
									? t("secured", { name: baseName(row.resourceId) })
									: baseName(row.resourceId)
							}
							columns={PACK_COLUMNS}
						>
							{row.cells.map((cell) => (
								<CountCell
									key={cell.itemId}
									itemId={cell.itemId}
									label={formatCompact(cell.size)}
									count={ownedCount(chief, cell.itemId)}
									onChange={setCount}
								/>
							))}
						</CountRow>
					))}
					{chestRows.map((row) => (
						<CountRow
							key={String(row.secured)}
							title={row.secured ? t("customSecuredChests") : t("customChests")}
							columns={CHEST_COLUMNS}
						>
							{row.cells.map((cell) => (
								<CountCell
									key={cell.itemId}
									itemId={cell.itemId}
									label={t("level", { level: cell.level })}
									count={ownedCount(chief, cell.itemId)}
									onChange={setCount}
								/>
							))}
						</CountRow>
					))}
				</div>
			</CollapsibleSection>
			<CollapsibleSection title={t("fireCrystalSection")}>
				<CountRow columns={FIRE_CRYSTAL_COLUMNS}>
					{FIRE_CRYSTAL_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName="shrink-0"
						/>
					))}
				</CountRow>
			</CollapsibleSection>
			<CollapsibleSection title={t("speedupsSection")}>
				{speedupRows.map((row) => (
					<CountRow key={row.type} title={tSpeedups(row.type)} columns={PACK_COLUMNS}>
						{row.cells.map((cell) => (
							<CountCell
								key={cell.itemId}
								itemId={cell.itemId}
								label={formatDuration(cell.minutes * 60)}
								count={ownedCount(chief, cell.itemId)}
								onChange={setCount}
								labelClassName="w-auto shrink-0"
							/>
						))}
					</CountRow>
				))}
			</CollapsibleSection>
			<CollapsibleSection title={t("expertsSection")}>
				<CountRow title={t("expertSigilsRow")} columns={SIGIL_COLUMNS}>
					{EXPERT_SIGILS.map(({ itemId, expertId }) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={findExpert(expertId)?.name ?? expertId}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName="w-auto shrink-0"
						/>
					))}
				</CountRow>
				<CountRow title={t("affinityGiftsRow")} columns={EXPERT_ITEM_COLUMNS}>
					{AFFINITY_GIFT_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName="shrink-0"
						/>
					))}
				</CountRow>
				<CountRow title={t("commonExpertRow")} columns={EXPERT_ITEM_COLUMNS}>
					{COMMON_EXPERT_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName="shrink-0"
						/>
					))}
				</CountRow>
			</CollapsibleSection>
			<CollapsibleSection title={t("petsSection")}>
				<CountRow title={t("petAdvancementRow")} columns={FOUR_PER_ROW_COLUMNS}>
					{PET_ADVANCEMENT_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
				<CountRow title={t("petFoodAndMarksRow")} columns={FOUR_PER_ROW_COLUMNS}>
					{PET_FOOD_AND_MARK_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
			</CollapsibleSection>
			<CollapsibleSection title={t("heroGearSection")}>
				<CountRow title={t("heroGearMaterialsRow")} columns={FOUR_PER_ROW_COLUMNS}>
					{HERO_GEAR_MATERIAL_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
				<CountRow title={t("heroGearRow")} columns={FOUR_PER_ROW_COLUMNS}>
					{HERO_GEAR_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
			</CollapsibleSection>
			<CollapsibleSection title={t("chiefGearSection")}>
				<CountRow title={t("chiefGearRow")} columns={FOUR_PER_ROW_COLUMNS}>
					{CHIEF_GEAR_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
				<CountRow title={t("chiefCharmRow")} columns={FOUR_PER_ROW_COLUMNS}>
					{CHIEF_CHARM_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
				<CountRow title={t("chiefChestsRow")} columns={FOUR_PER_ROW_COLUMNS}>
					{CHIEF_GEAR_AND_CHARM_CHEST_ITEM_IDS.map((itemId) => (
						<CountCell
							key={itemId}
							itemId={itemId}
							label={baseName(itemId)}
							count={ownedCount(chief, itemId)}
							onChange={setCount}
							labelClassName={WRAPPING_LABEL}
						/>
					))}
				</CountRow>
			</CollapsibleSection>
			<HeroShardsSection chief={chief} />
		</div>
	);
}

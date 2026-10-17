"use client";

import type { Pet, PetLevel, PetStatValue } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatDecimal, formatDuration, formatNumber } from "@/lib/format";
import { maxPowerOf, skillValueKindOf } from "@/service/wikiPets";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { RecordItems, RecordSection, RecordTile, RecordTiles } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";
import { useGameLabels } from "../useGameLabels";
import { petRarityTone } from "./petRarityTone";
import { unlockRequirementText } from "./petText";

export function PetDetail({ pet }: { pet: Pet }) {
	const t = useTranslations("wikiPets");
	const labels = useGameLabels();
	const { cooldownSeconds, cooldownSecondsByTier, durationSeconds } = pet.skill;
	const maxPower = maxPowerOf(pet);
	const valueKind = skillValueKindOf(pet);
	const skillValueText = (value: number) =>
		valueKind === "percent"
			? t("skill.percent", { value: formatDecimal(value) })
			: valueKind === "duration"
				? formatDuration(value)
				: formatDecimal(value);
	const cooldownText = cooldownSecondsByTier
		? cooldownSecondsByTier.map(formatDuration).join(" · ")
		: cooldownSeconds !== undefined
			? formatDuration(cooldownSeconds)
			: undefined;

	return (
		<div className="flex flex-col gap-6">
			<Card className="flex flex-col gap-4 p-4">
				<div className="flex items-center gap-3">
					<ItemIcon src={pet.img} size={64} />
					<div className="flex flex-col gap-2">
						<h2 className="text-xl font-semibold">{pet.name}</h2>
						<span>
							<Badge tone={petRarityTone[pet.rarity]}>
								{labels.rarity(pet.rarity)}
							</Badge>
						</span>
					</div>
				</div>
				<RecordTiles>
					<RecordTile value={formatNumber(pet.maxLevel)} label={t("detail.maxLevel")} />
					<RecordTile
						value={t("roster.percentValue", {
							value: formatDecimal(pet.maxRefinementPercent),
						})}
						label={t("detail.maxRefinement")}
					/>
					<RecordTile
						value={
							maxPower.total === null ? (
								<UnknownValue />
							) : (
								formatNumber(maxPower.total)
							)
						}
						label={t("detail.maxPower")}
					/>
					<RecordTile
						value={
							maxPower.levelPower === null ? (
								<UnknownValue />
							) : (
								formatNumber(maxPower.levelPower)
							)
						}
						label={t("detail.levelPower")}
					/>
					<RecordTile
						value={formatNumber(maxPower.refiningPower)}
						label={t("detail.refiningPower")}
					/>
					<RecordTile value={unlockRequirementText(pet)} label={t("detail.unlock")} />
					<RecordTile
						value={cooldownText ?? <UnknownValue />}
						label={t("detail.cooldown")}
					/>
					<RecordTile
						value={durationSeconds ? formatDuration(durationSeconds) : <UnknownValue />}
						label={t("detail.duration")}
					/>
				</RecordTiles>
			</Card>
			<RecordSection
				title={t("skill.title")}
				meta={t("skill.meta", {
					count: pet.skill.values.length,
					amount: formatNumber(pet.skill.values.length),
				})}
			>
				<Card className="flex flex-col gap-3 p-4">
					<div className="flex items-center gap-3">
						<ItemIcon src={pet.skill.img} size={40} />
						<h3 className="font-semibold">{pet.skill.name}</h3>
					</div>
					<p>{pet.skill.description}</p>
					<ul className="grid grid-cols-5 gap-2 lg:grid-cols-10">
						{pet.skill.values.map((value, index) => (
							<li
								key={index}
								className="border-line flex flex-col items-center rounded-md border-[1.5px] px-1 py-1.5 text-center"
							>
								<span className="text-muted font-mono text-xs">
									{t("skill.level", { level: formatNumber(index + 1) })}
								</span>
								<span className="font-mono">{skillValueText(value)}</span>
							</li>
						))}
					</ul>
				</Card>
			</RecordSection>
			<PetLevels levels={pet.levels} />
		</div>
	);
}

function PetLevels({ levels }: { levels: PetLevel[] }) {
	const t = useTranslations("wikiPets.levels");

	const statCell = (stat: PetStatValue, format: (value: number) => string) => (
		<span className="font-mono">
			{stat.refinedValue === undefined
				? format(stat.value)
				: t("refined", { value: format(stat.value), refined: format(stat.refinedValue) })}
		</span>
	);

	const columns: RecordColumn<PetLevel>[] = [
		{
			id: "level",
			header: t("columns.level"),
			heading: true,
			cell: (row) => (
				<span className="font-semibold">
					{t("level", { level: formatNumber(row.level) })}
				</span>
			),
		},
		{
			id: "food",
			header: t("columns.food"),
			cell: (row) => <span className="font-mono">{formatNumber(row.petFoodCost)}</span>,
		},
		{
			id: "attack",
			header: t("columns.attack"),
			cell: (row) => statCell(row.troopAttack, formatDecimal),
		},
		{
			id: "defense",
			header: t("columns.defense"),
			cell: (row) => statCell(row.troopDefense, formatDecimal),
		},
		{
			id: "power",
			header: t("columns.power"),
			cell: (row) => statCell(row.troopsPower, formatNumber),
		},
		{
			id: "materials",
			header: t("columns.materials"),
			cell: (row) =>
				row.advancementMaterials ? (
					<RecordItems items={row.advancementMaterials} />
				) : (
					t("none")
				),
		},
	];

	return (
		<RecordSection title={t("title")}>
			<RecordTable columns={columns} rows={levels} rowKey={(row) => String(row.level)} />
		</RecordSection>
	);
}

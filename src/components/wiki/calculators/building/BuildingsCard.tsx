"use client";

import { useTranslations } from "next-intl";
import { labelAt, levelPositions, levelsOf, withLevel } from "@/service/calcBuilding";
import type { BuildingCalculatorInputs, LevelKey } from "@/service/calcBuilding";
import type { Building } from "@/data/game/calcBuilding";
import { calculatorBuildings } from "@/data/game/calcBuilding";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";

interface BuildingsCardProps {
	inputs: BuildingCalculatorInputs;
	onChange: (inputs: BuildingCalculatorInputs) => void;
}

export function BuildingsCard({ inputs, onChange }: BuildingsCardProps) {
	const t = useTranslations("calcBuilding.buildings");

	const levelSelect = (building: Building, key: LevelKey) => {
		const levels = levelsOf(inputs, building.id);
		const from = key === "goal" ? levels.current : 0;
		return (
			<Select
				aria-label={t(`levelLabel.${key}`, { name: building.name })}
				value={levels[key]}
				onChange={(event) =>
					onChange(withLevel(inputs, building.id, key, Number(event.target.value)))
				}
			>
				{levelPositions(building, from).map((position) => (
					<option key={position} value={position}>
						{position === 0 ? t("notBuilt") : labelAt(building, position)}
					</option>
				))}
			</Select>
		);
	};

	const columns: StackColumn<Building>[] = [
		{
			id: "building",
			header: t("columns.building"),
			width: "minmax(0, 1fr)",
			render: (building) => (
				<span className="flex items-center gap-2">
					<ItemIcon src={building.img} size={32} />
					<span className="flex min-w-0 flex-col">
						<span className="font-medium">{building.name}</span>
						<span className="text-muted text-xs">{building.category}</span>
					</span>
				</span>
			),
		},
		{
			id: "current",
			header: t("columns.current"),
			width: "9rem",
			render: (building) => (
				<div className="w-36 lg:w-auto">{levelSelect(building, "current")}</div>
			),
		},
		{
			id: "goal",
			header: t("columns.goal"),
			width: "9rem",
			render: (building) => (
				<div className="w-36 lg:w-auto">{levelSelect(building, "goal")}</div>
			),
		},
	];

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<p className="text-muted">{t("description")}</p>
			<StackTable
				label={t("tableLabel")}
				columns={columns}
				rows={calculatorBuildings}
				rowKey={(building) => building.id}
			/>
		</Card>
	);
}

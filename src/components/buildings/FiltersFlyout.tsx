"use client";

import type { BuildingFilters, BuildingOrder } from "@/service/buildings";
import { buildingCategories } from "@/data/game/buildings";
import { allBuildings } from "@/data/game/buildings";
import { Button } from "@/comps/ui/Button";
import { CheckChip } from "@/comps/ui/CheckChip";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface FiltersFlyoutProps {
	open: boolean;
	filters: BuildingFilters;
	shown: number;
	onChange: (filters: BuildingFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const categoryOptions = [
	{ id: "all", label: `All, ${allBuildings.length}` },
	...buildingCategories.map((category) => ({
		id: category,
		label: `${category}, ${allBuildings.filter((building) => building.category === category).length}`,
	})),
] as { id: BuildingFilters["category"]; label: string }[];

const orderOptions: { id: BuildingOrder; label: string }[] = [
	{ id: "game", label: "Game order, Furnace first" },
	{ id: "name", label: "Name, A to Z" },
	{ id: "progress", label: "Progress, lowest first" },
];

export function FiltersFlyout({
	open,
	filters,
	shown,
	onChange,
	onReset,
	onClose,
}: FiltersFlyoutProps) {
	return (
		<Flyout
			open={open}
			onClose={onClose}
			title="Filters"
			description="Choose what the Buildings list shows"
			footer={
				<>
					<Button variant="link" onClick={onReset} className="mr-auto">
						Reset
					</Button>
					<Button variant="primary" onClick={onClose}>
						Show {shown} {shown === 1 ? "building" : "buildings"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Category</SectionLabel>
				<RadioGroup
					label="Category"
					options={categoryOptions}
					value={filters.category}
					onChange={(category) => onChange({ ...filters, category })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Show</SectionLabel>
				<CheckChip
					label="Hide maxed buildings"
					checked={filters.hideMaxed}
					onChange={(hideMaxed) => onChange({ ...filters, hideMaxed })}
				/>
				<CheckChip
					label="Hide locked buildings"
					checked={filters.hideLocked}
					onChange={(hideLocked) => onChange({ ...filters, hideLocked })}
				/>
				<CheckChip
					label="Only buildings with a goal"
					checked={filters.goalsOnly}
					onChange={(goalsOnly) => onChange({ ...filters, goalsOnly })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Order</SectionLabel>
				<RadioGroup
					label="Order"
					options={orderOptions}
					value={filters.order}
					onChange={(order) => onChange({ ...filters, order })}
				/>
			</div>
			<p className="text-muted">
				Furnace stays pinned at the top whatever the filter. Filters are not saved.
			</p>
		</Flyout>
	);
}

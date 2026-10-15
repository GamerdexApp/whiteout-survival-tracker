"use client";

import type { ResearchFilters, ResearchOrder, ResearchStatus } from "@/service/research";
import type { ResearchTab } from "@/data/game/research";
import { nodesOfTab } from "@/data/game/research";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface ResearchFiltersFlyoutProps {
	open: boolean;
	tab: ResearchTab;
	filters: ResearchFilters;
	shown: number;
	onChange: (filters: ResearchFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const statusOptions: { id: ResearchStatus; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "progress", label: "In progress" },
	{ id: "goal", label: "Has goal" },
	{ id: "maxed", label: "Maxed" },
	{ id: "locked", label: "Locked" },
	{ id: "notStarted", label: "Not started" },
];

const orderOptions: { id: ResearchOrder; label: string }[] = [
	{ id: "game", label: "Game order" },
	{ id: "name", label: "Name, A to Z" },
	{ id: "level", label: "Level, highest first" },
];

const T11_LINES = ["Infantry", "Marksman", "Lancer"];

export function ResearchFiltersFlyout({
	open,
	tab,
	filters,
	shown,
	onChange,
	onReset,
	onClose,
}: ResearchFiltersFlyoutProps) {
	const tiers = [...new Set(nodesOfTab(tab).map((node) => node.tier))].sort((a, b) => a - b);
	const tierOptions = [
		{ id: "all", label: "All" },
		...tiers.map((tier) => ({ id: String(tier), label: `Tier ${tier}` })),
	];
	const showTroopLine = tab.categories.some((category) => category.startsWith("T11"));

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title="Filters"
			description={`Choose what the ${tab.name} tab shows`}
			footer={
				<>
					<Button variant="link" onClick={onReset} className="mr-auto">
						Reset
					</Button>
					<Button variant="primary" onClick={onClose}>
						Show {shown} {shown === 1 ? "node" : "nodes"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Tier</SectionLabel>
				<RadioGroup
					label="Tier"
					options={tierOptions}
					value={String(filters.tier)}
					onChange={(value) =>
						onChange({ ...filters, tier: value === "all" ? "all" : Number(value) })
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Status</SectionLabel>
				<RadioGroup
					label="Status"
					options={statusOptions}
					value={filters.status}
					onChange={(status) => onChange({ ...filters, status })}
				/>
			</div>
			{showTroopLine && (
				<div className="flex flex-col gap-2">
					<SectionLabel className="text-muted">Troop line</SectionLabel>
					<RadioGroup
						label="Troop line"
						options={[
							{ id: "all", label: "All" },
							...T11_LINES.map((line) => ({ id: line, label: line })),
						]}
						value={filters.troopLine}
						onChange={(troopLine) => onChange({ ...filters, troopLine })}
					/>
				</div>
			)}
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Order</SectionLabel>
				<RadioGroup
					label="Order"
					options={orderOptions}
					value={filters.order}
					onChange={(order) => onChange({ ...filters, order })}
				/>
			</div>
			<p className="text-muted">Filters are not saved.</p>
		</Flyout>
	);
}

"use client";

import type { HeroFilters, HeroOrder, OwnedFilter } from "@/service/heroes";
import { heroClasses, heroRarities } from "@/data/game/heroes";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface HeroFiltersFlyoutProps {
	open: boolean;
	filters: HeroFilters;
	generations: number[];
	shown: number;
	onChange: (filters: HeroFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const ownershipOptions: { id: OwnedFilter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "owned", label: "Owned" },
	{ id: "notOwned", label: "Not owned" },
];

const orderOptions: { id: HeroOrder; label: string }[] = [
	{ id: "owned", label: "Owned first, then latest generation" },
	{ id: "generation", label: "Generation, latest first" },
	{ id: "name", label: "Name, A to Z" },
	{ id: "power", label: "Total power, highest first" },
];

const allOption = { id: "all", label: "All" };

export function HeroFiltersFlyout({
	open,
	filters,
	generations,
	shown,
	onChange,
	onReset,
	onClose,
}: HeroFiltersFlyoutProps) {
	return (
		<Flyout
			open={open}
			onClose={onClose}
			title="Filters"
			description="Choose which heroes the page shows"
			footer={
				<>
					<Button variant="link" onClick={onReset} className="mr-auto">
						Reset
					</Button>
					<Button variant="primary" onClick={onClose}>
						Show {shown} {shown === 1 ? "hero" : "heroes"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Generation</SectionLabel>
				<RadioGroup
					label="Generation"
					options={[
						allOption,
						...generations.map((generation) => ({
							id: String(generation),
							label: `Gen ${generation}`,
						})),
					]}
					value={String(filters.generation)}
					onChange={(value) =>
						onChange({
							...filters,
							generation: value === "all" ? "all" : Number(value),
						})
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Rarity</SectionLabel>
				<RadioGroup
					label="Rarity"
					options={[
						allOption,
						...heroRarities.map((rarity) => ({ id: rarity, label: rarity })),
					]}
					value={filters.rarity}
					onChange={(rarity) =>
						onChange({ ...filters, rarity: rarity as HeroFilters["rarity"] })
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Class</SectionLabel>
				<RadioGroup
					label="Class"
					options={[allOption, ...heroClasses.map((name) => ({ id: name, label: name }))]}
					value={filters.heroClass}
					onChange={(heroClass) =>
						onChange({ ...filters, heroClass: heroClass as HeroFilters["heroClass"] })
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Ownership</SectionLabel>
				<RadioGroup
					label="Ownership"
					options={ownershipOptions}
					value={filters.ownership}
					onChange={(ownership) => onChange({ ...filters, ownership })}
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
			<p className="text-muted">Filters are not saved.</p>
		</Flyout>
	);
}

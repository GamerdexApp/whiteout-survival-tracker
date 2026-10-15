"use client";

import { allTroopTypes, troopLabel } from "@/service/heroGear";
import type { GearHeroFilter, GearSetFilters, GearSetOrder } from "@/service/heroGear";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface GearSetFiltersFlyoutProps {
	open: boolean;
	filters: GearSetFilters;
	shown: number;
	onChange: (filters: GearSetFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const heroOptions: { id: GearHeroFilter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "linked", label: "Linked to a hero" },
	{ id: "unlinked", label: "Not linked" },
];

const orderOptions: { id: GearSetOrder; label: string }[] = [
	{ id: "power", label: "Total power, highest first" },
	{ id: "created", label: "Order added" },
	{ id: "name", label: "Name, A to Z" },
	{ id: "hero", label: "Hero name, A to Z" },
];

export function GearSetFiltersFlyout({
	open,
	filters,
	shown,
	onChange,
	onReset,
	onClose,
}: GearSetFiltersFlyoutProps) {
	return (
		<Flyout
			open={open}
			onClose={onClose}
			title="Filters"
			description="Choose which gear sets the list shows"
			footer={
				<>
					<Button variant="link" onClick={onReset} className="mr-auto">
						Reset
					</Button>
					<Button variant="primary" onClick={onClose}>
						Show {shown} {shown === 1 ? "set" : "sets"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Troop type</SectionLabel>
				<RadioGroup
					label="Troop type"
					options={[
						{ id: "all", label: "All" },
						...allTroopTypes.map((troop) => ({ id: troop, label: troopLabel(troop) })),
					]}
					value={filters.troopType}
					onChange={(troopType) => onChange({ ...filters, troopType })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Linked hero</SectionLabel>
				<RadioGroup
					label="Linked hero"
					options={heroOptions}
					value={filters.hero}
					onChange={(hero) => onChange({ ...filters, hero })}
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

"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { formatNumber } from "@/lib/format";
import type { PetAdvancedFilter, PetFilters, PetOrder, PetStatusFilter } from "@/service/pets";
import { petRarities } from "@/data/game/pets";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface PetFiltersFlyoutProps {
	open: boolean;
	filters: PetFilters;
	rarityCounts: Map<string, number>;
	total: number;
	shown: number;
	onChange: (filters: PetFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const statusIds: PetStatusFilter[] = ["all", "unlocked", "locked"];
const advancedIds: PetAdvancedFilter[] = ["any", "advanced", "notAdvanced"];
const orderIds: PetOrder[] = ["game", "name", "level"];

export function PetFiltersFlyout({
	open,
	filters,
	rarityCounts,
	total,
	shown,
	onChange,
	onReset,
	onClose,
}: PetFiltersFlyoutProps) {
	const t = useTranslations("pets.filters");
	const groupName = useId();
	const rarityOptions = [
		{ id: "all", label: t("rarityAll", { amount: formatNumber(total) }) },
		...petRarities.map((rarity) => ({
			id: rarity,
			label: t("rarityOption", {
				rarity: t(`rarities.${rarity}`),
				amount: formatNumber(rarityCounts.get(rarity) ?? 0),
			}),
		})),
	];

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					<Button variant="link" onClick={onReset} className="me-auto">
						{t("reset")}
					</Button>
					<Button variant="primary" onClick={onClose}>
						{t("show", { count: shown, amount: formatNumber(shown) })}
					</Button>
				</>
			}
		>
			<fieldset className="flex flex-col gap-2">
				<legend className="sr-only">{t("rarity")}</legend>
				<SectionLabel className="text-muted">{t("rarity")}</SectionLabel>
				<div className="flex flex-wrap gap-2">
					{rarityOptions.map((option) => {
						const selected = filters.rarity === option.id;
						return (
							<label
								key={option.id}
								className={`flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] px-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-[:focus-visible]:outline-(--ring) lg:min-h-9 ${
									selected
										? "border-primary bg-tint font-medium"
										: "border-line bg-surface"
								}`}
							>
								<input
									type="radio"
									name={groupName}
									checked={selected}
									onChange={() =>
										onChange({
											...filters,
											rarity: option.id as PetFilters["rarity"],
										})
									}
									className="sr-only"
								/>
								{option.label}
							</label>
						);
					})}
				</div>
			</fieldset>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("status")}</SectionLabel>
				<RadioGroup
					label={t("status")}
					options={statusIds.map((id) => ({ id, label: t(`statusOptions.${id}`) }))}
					value={filters.status}
					onChange={(status) => onChange({ ...filters, status })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("advanced")}</SectionLabel>
				<RadioGroup
					label={t("advanced")}
					options={advancedIds.map((id) => ({ id, label: t(`advancedOptions.${id}`) }))}
					value={filters.advanced}
					onChange={(advanced) => onChange({ ...filters, advanced })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("order")}</SectionLabel>
				<RadioGroup
					label={t("order")}
					options={orderIds.map((id) => ({ id, label: t(`orderOptions.${id}`) }))}
					value={filters.order}
					onChange={(order) => onChange({ ...filters, order })}
				/>
			</div>
			<p className="text-muted">{t("notSaved")}</p>
		</Flyout>
	);
}

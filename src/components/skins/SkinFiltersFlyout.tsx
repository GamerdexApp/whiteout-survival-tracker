"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { formatNumber } from "@/lib/format";
import type { BonusFilter, OwnedFilter, SkinFilters, SkinOrder } from "@/service/skins";
import { skinTypes } from "@/data/game/skins";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface SkinFiltersFlyoutProps {
	open: boolean;
	filters: SkinFilters;
	typeCounts: Map<string, number>;
	total: number;
	shown: number;
	onChange: (filters: SkinFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const ownedIds: OwnedFilter[] = ["all", "owned", "notOwned"];
const bonusIds: BonusFilter[] = ["any", "has", "none"];
const orderIds: SkinOrder[] = ["game", "name", "owned"];

export function SkinFiltersFlyout({
	open,
	filters,
	typeCounts,
	total,
	shown,
	onChange,
	onReset,
	onClose,
}: SkinFiltersFlyoutProps) {
	const t = useTranslations("skins.filters");
	const groupName = useId();
	const typeOptions = [
		{ id: "all", label: t("typeAll", { amount: formatNumber(total) }) },
		...skinTypes.map((skinType) => ({
			id: skinType,
			label: t("typeOption", {
				type: skinType,
				amount: formatNumber(typeCounts.get(skinType) ?? 0),
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
					<Button variant="link" onClick={onReset} className="mr-auto">
						{t("reset")}
					</Button>
					<Button variant="primary" onClick={onClose}>
						{t("showButton", { count: shown, amount: formatNumber(shown) })}
					</Button>
				</>
			}
		>
			<fieldset className="flex flex-col gap-2">
				<legend className="sr-only">{t("skinType")}</legend>
				<SectionLabel className="text-muted">{t("skinType")}</SectionLabel>
				<div className="flex flex-wrap gap-2">
					{typeOptions.map((option) => {
						const selected = filters.skinType === option.id;
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
											skinType: option.id as SkinFilters["skinType"],
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
				<SectionLabel className="text-muted">{t("owned")}</SectionLabel>
				<RadioGroup
					label={t("owned")}
					options={ownedIds.map((id) => ({ id, label: t(`ownedOptions.${id}`) }))}
					value={filters.owned}
					onChange={(owned) => onChange({ ...filters, owned })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("bonus")}</SectionLabel>
				<RadioGroup
					label={t("bonus")}
					options={bonusIds.map((id) => ({ id, label: t(`bonusOptions.${id}`) }))}
					value={filters.bonus}
					onChange={(bonus) => onChange({ ...filters, bonus })}
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

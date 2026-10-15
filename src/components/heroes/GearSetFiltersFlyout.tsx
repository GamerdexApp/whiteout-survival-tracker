"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
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

const heroFilterIds: GearHeroFilter[] = ["all", "linked", "unlinked"];

const orderIds: GearSetOrder[] = ["power", "created", "name", "hero"];

export function GearSetFiltersFlyout({
	open,
	filters,
	shown,
	onChange,
	onReset,
	onClose,
}: GearSetFiltersFlyoutProps) {
	const t = useTranslations("heroGear.filters");

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
						{t("show", { count: shown, amount: formatNumber(shown) })}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("troopType")}</SectionLabel>
				<RadioGroup
					label={t("troopType")}
					options={[
						{ id: "all", label: t("all") },
						...allTroopTypes.map((troop) => ({ id: troop, label: troopLabel(troop) })),
					]}
					value={filters.troopType}
					onChange={(troopType) => onChange({ ...filters, troopType })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("linkedHero")}</SectionLabel>
				<RadioGroup
					label={t("linkedHero")}
					options={heroFilterIds.map((id) => ({ id, label: t(`heroOptions.${id}`) }))}
					value={filters.hero}
					onChange={(hero) => onChange({ ...filters, hero })}
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

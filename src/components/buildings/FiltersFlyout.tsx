"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
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

const orderIds: BuildingOrder[] = ["game", "name", "progress"];

export function FiltersFlyout({
	open,
	filters,
	shown,
	onChange,
	onReset,
	onClose,
}: FiltersFlyoutProps) {
	const t = useTranslations("buildings.filters");
	const categoryOptions = [
		{ id: "all", label: t("categoryAll", { count: formatNumber(allBuildings.length) }) },
		...buildingCategories.map((category) => ({
			id: category,
			label: t("categoryOption", {
				category,
				count: formatNumber(
					allBuildings.filter((building) => building.category === category).length
				),
			}),
		})),
	] as { id: BuildingFilters["category"]; label: string }[];
	const orderOptions = orderIds.map((id) => ({ id, label: t(`orders.${id}`) }));

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
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("category")}</SectionLabel>
				<RadioGroup
					label={t("category")}
					options={categoryOptions}
					value={filters.category}
					onChange={(category) => onChange({ ...filters, category })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("showSection")}</SectionLabel>
				<CheckChip
					label={t("hideMaxed")}
					checked={filters.hideMaxed}
					onChange={(hideMaxed) => onChange({ ...filters, hideMaxed })}
				/>
				<CheckChip
					label={t("hideLocked")}
					checked={filters.hideLocked}
					onChange={(hideLocked) => onChange({ ...filters, hideLocked })}
				/>
				<CheckChip
					label={t("goalsOnly")}
					checked={filters.goalsOnly}
					onChange={(goalsOnly) => onChange({ ...filters, goalsOnly })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("order")}</SectionLabel>
				<RadioGroup
					label={t("order")}
					options={orderOptions}
					value={filters.order}
					onChange={(order) => onChange({ ...filters, order })}
				/>
			</div>
			<p className="text-muted">{t("pinned")}</p>
		</Flyout>
	);
}

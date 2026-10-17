"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { formatNumber } from "@/lib/format";
import type { DecorationFilters, DecorationOrder } from "@/service/daybreak";
import { decorationCategories } from "@/data/game/daybreak";
import { Button } from "@/comps/ui/Button";
import { CheckChip } from "@/comps/ui/CheckChip";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface DaybreakFiltersFlyoutProps {
	open: boolean;
	filters: DecorationFilters;
	categoryCounts: Map<string, number>;
	total: number;
	shown: number;
	onChange: (filters: DecorationFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const orderIds: DecorationOrder[] = ["game", "name", "level"];

export function DaybreakFiltersFlyout({
	open,
	filters,
	categoryCounts,
	total,
	shown,
	onChange,
	onReset,
	onClose,
}: DaybreakFiltersFlyoutProps) {
	const t = useTranslations("daybreak");
	const groupName = useId();
	const categoryOptions = [
		{ id: "all", label: t("filters.categoryAll", { amount: formatNumber(total) }) },
		...decorationCategories.map((category) => ({
			id: category,
			label: t("filters.categoryOption", {
				category: t(`categories.${category}`),
				amount: formatNumber(categoryCounts.get(category) ?? 0),
			}),
		})),
	];

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("filters.title")}
			description={t("filters.description")}
			footer={
				<>
					<Button variant="link" onClick={onReset} className="me-auto">
						{t("filters.reset")}
					</Button>
					<Button variant="primary" onClick={onClose}>
						{t("filters.showButton", { count: shown, amount: formatNumber(shown) })}
					</Button>
				</>
			}
		>
			<fieldset className="flex flex-col gap-2">
				<legend className="sr-only">{t("filters.category")}</legend>
				<SectionLabel className="text-muted">{t("filters.category")}</SectionLabel>
				<div className="flex flex-wrap gap-2">
					{categoryOptions.map((option) => {
						const selected = filters.category === option.id;
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
											category: option.id as DecorationFilters["category"],
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
				<SectionLabel className="text-muted">{t("filters.show")}</SectionLabel>
				<div className="flex flex-wrap gap-2">
					<CheckChip
						label={t("filters.ownedOnly")}
						checked={filters.ownedOnly}
						onChange={(ownedOnly) =>
							onChange({ ...filters, ownedOnly, notOwnedOnly: false })
						}
					/>
					<CheckChip
						label={t("filters.notOwnedOnly")}
						checked={filters.notOwnedOnly}
						onChange={(notOwnedOnly) =>
							onChange({ ...filters, notOwnedOnly, ownedOnly: false })
						}
					/>
					<CheckChip
						label={t("filters.limitedOnly")}
						checked={filters.limitedOnly}
						onChange={(limitedOnly) =>
							onChange({ ...filters, limitedOnly, nonLimitedOnly: false })
						}
					/>
					<CheckChip
						label={t("filters.nonLimitedOnly")}
						checked={filters.nonLimitedOnly}
						onChange={(nonLimitedOnly) =>
							onChange({ ...filters, nonLimitedOnly, limitedOnly: false })
						}
					/>
					<CheckChip
						label={t("filters.unknownBuffOnly")}
						checked={filters.unknownBuffOnly}
						onChange={(unknownBuffOnly) => onChange({ ...filters, unknownBuffOnly })}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("filters.sort")}</SectionLabel>
				<RadioGroup
					label={t("filters.sort")}
					options={orderIds.map((id) => ({ id, label: t(`filters.order.${id}`) }))}
					value={filters.order}
					onChange={(order) => onChange({ ...filters, order })}
				/>
			</div>
		</Flyout>
	);
}

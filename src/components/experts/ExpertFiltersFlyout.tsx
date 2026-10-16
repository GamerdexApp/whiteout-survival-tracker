"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { ExpertFilters, ExpertOrder, ShowFilter } from "@/service/experts";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface ExpertFiltersFlyoutProps {
	open: boolean;
	filters: ExpertFilters;
	generations: number[];
	shown: number;
	onChange: (filters: ExpertFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const showIds: ShowFilter[] = ["everything", "recruited", "notRecruited"];
const orderIds: ExpertOrder[] = ["generation", "affinity", "power", "name"];

export function ExpertFiltersFlyout({
	open,
	filters,
	generations,
	shown,
	onChange,
	onReset,
	onClose,
}: ExpertFiltersFlyoutProps) {
	const t = useTranslations("experts.filtersFlyout");
	const tc = useTranslations("experts.common");

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
						{t("showButton", {
							experts: tc("expertCount", {
								count: shown,
								amount: formatNumber(shown),
							}),
						})}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("generation")}</SectionLabel>
				<RadioGroup
					label={t("generation")}
					options={[
						{ id: "all", label: t("all") },
						...generations.map((generation) => ({
							id: String(generation),
							label: tc("generation", { generation: formatNumber(generation) }),
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
				<SectionLabel className="text-muted">{t("show")}</SectionLabel>
				<RadioGroup
					label={t("show")}
					options={showIds.map((id) => ({ id, label: t(`showOptions.${id}`) }))}
					value={filters.show}
					onChange={(show) => onChange({ ...filters, show })}
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

"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { ResearchFilters, ResearchOrder, ResearchStatus } from "@/service/research";
import type { ResearchTab } from "@/data/game/research";
import { nodesOfTab, tabName } from "@/data/game/research";
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

const statusIds: ResearchStatus[] = ["all", "progress", "goal", "maxed", "locked", "notStarted"];

const orderIds: ResearchOrder[] = ["game", "name", "level"];

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
	const t = useTranslations("research");
	const statusOptions = statusIds.map((id) => ({ id, label: t(`filters.status.${id}`) }));
	const orderOptions = orderIds.map((id) => ({ id, label: t(`filters.order.${id}`) }));
	const tiers = [...new Set(nodesOfTab(tab).map((node) => node.tier))].sort((a, b) => a - b);
	const tierOptions = [
		{ id: "all", label: t("filters.all") },
		...tiers.map((tier) => ({
			id: String(tier),
			label: t("tier.plain", { tier: formatNumber(tier) }),
		})),
	];
	const showTroopLine = tab.categories.some((category) => category.startsWith("T11"));

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("filters.title")}
			description={t("filters.description", { tab: tabName(tab) })}
			footer={
				<>
					<Button variant="link" onClick={onReset} className="mr-auto">
						{t("filters.reset")}
					</Button>
					<Button variant="primary" onClick={onClose}>
						{t("filters.show", {
							nodes: t("nodeCount", { count: shown, amount: formatNumber(shown) }),
						})}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("filters.tier")}</SectionLabel>
				<RadioGroup
					label={t("filters.tier")}
					options={tierOptions}
					value={String(filters.tier)}
					onChange={(value) =>
						onChange({ ...filters, tier: value === "all" ? "all" : Number(value) })
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("filters.statusLabel")}</SectionLabel>
				<RadioGroup
					label={t("filters.statusLabel")}
					options={statusOptions}
					value={filters.status}
					onChange={(status) => onChange({ ...filters, status })}
				/>
			</div>
			{showTroopLine && (
				<div className="flex flex-col gap-2">
					<SectionLabel className="text-muted">{t("filters.troopLine")}</SectionLabel>
					<RadioGroup
						label={t("filters.troopLine")}
						options={[
							{ id: "all", label: t("filters.all") },
							...T11_LINES.map((line) => ({ id: line, label: line })),
						]}
						value={filters.troopLine}
						onChange={(troopLine) => onChange({ ...filters, troopLine })}
					/>
				</div>
			)}
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("filters.orderLabel")}</SectionLabel>
				<RadioGroup
					label={t("filters.orderLabel")}
					options={orderOptions}
					value={filters.order}
					onChange={(order) => onChange({ ...filters, order })}
				/>
			</div>
			<p className="text-muted">{t("filters.notSaved")}</p>
		</Flyout>
	);
}

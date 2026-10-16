"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { TechFilters, TechStatus } from "@/service/allianceTech";
import { TECH_TIERS } from "@/data/game/alliance";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";

const statusIds: TechStatus[] = ["maxed", "inProgress", "notStarted", "locked"];

interface TechFilterFieldsProps {
	filters: TechFilters;
	onChange: (filters: TechFilters) => void;
	className?: string;
}

export function TechFilterFields({ filters, onChange, className = "" }: TechFilterFieldsProps) {
	const t = useTranslations("tech.filters");
	const ts = useTranslations("tech.status");

	return (
		<div className={className}>
			<label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
				<span className="text-muted">{t("search")}</span>
				<Input
					type="search"
					aria-label={t("searchLabel")}
					placeholder={t("searchPlaceholder")}
					value={filters.search}
					onChange={(event) => onChange({ ...filters, search: event.target.value })}
				/>
			</label>
			<label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
				<span className="text-muted">{t("tier")}</span>
				<Select
					value={String(filters.tier)}
					onChange={(event) =>
						onChange({
							...filters,
							tier: event.target.value === "all" ? "all" : Number(event.target.value),
						})
					}
				>
					<option value="all">{t("allTiers")}</option>
					{TECH_TIERS.map((tier) => (
						<option key={tier} value={tier}>
							{t("tierOption", { tier: formatNumber(tier) })}
						</option>
					))}
				</Select>
			</label>
			<label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
				<span className="text-muted">{t("status")}</span>
				<Select
					value={filters.status}
					onChange={(event) =>
						onChange({
							...filters,
							status: event.target.value as TechFilters["status"],
						})
					}
				>
					<option value="all">{t("allStatuses")}</option>
					{statusIds.map((id) => (
						<option key={id} value={id}>
							{ts(id)}
						</option>
					))}
				</Select>
			</label>
		</div>
	);
}

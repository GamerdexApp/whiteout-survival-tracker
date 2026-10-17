"use client";

import type { AllianceFortressKind } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuListFilter } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import {
	countFortressFilters,
	defaultFortressFilters,
	filterFortresses,
	rewardChoices,
} from "@/service/allianceFacilities";
import type { FortressFilters } from "@/service/allianceFacilities";
import { fortresses, fortressKinds } from "@/data/game/alliance";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Flyout } from "@/comps/ui/Flyout";
import { Note } from "@/comps/ui/Note";
import { Select } from "@/comps/ui/Select";

const REWARDS = rewardChoices();

function FilterFields({
	filters,
	onChange,
	className,
}: {
	filters: FortressFilters;
	onChange: (filters: FortressFilters) => void;
	className: string;
}) {
	const t = useTranslations("facilities.fortress");

	return (
		<div className={className}>
			<label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
				<span className="text-muted">{t("kindLabel")}</span>
				<Select
					value={filters.kind}
					onChange={(event) =>
						onChange({
							...filters,
							kind: event.target.value as FortressFilters["kind"],
						})
					}
				>
					<option value="all">{t("allKinds")}</option>
					{fortressKinds.map((kind) => (
						<option key={kind} value={kind}>
							{t(`kind.${kind}`)}
						</option>
					))}
				</Select>
			</label>
			<label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
				<span className="text-muted">{t("rewardLabel")}</span>
				<Select
					value={filters.reward}
					onChange={(event) => onChange({ ...filters, reward: event.target.value })}
				>
					<option value="all">{t("allRewards")}</option>
					{REWARDS.map((reward) => (
						<option key={reward} value={reward}>
							{reward}
						</option>
					))}
				</Select>
			</label>
		</div>
	);
}

export function FortressesTab() {
	const t = useTranslations("facilities.fortress");
	const [filters, setFilters] = useState<FortressFilters>(defaultFortressFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const visible = filterFortresses(filters);
	const active = countFortressFilters(filters);
	const reset = () => setFilters(defaultFortressFilters());

	return (
		<>
			<Note tone="info">{t("referenceNote")}</Note>
			<div className="flex flex-wrap items-center gap-3">
				<FilterFields
					filters={filters}
					onChange={setFilters}
					className="flex flex-wrap items-center gap-4 max-lg:hidden"
				/>
				<Button className="w-full lg:hidden" onClick={() => setFiltersOpen(true)}>
					<LuListFilter size={16} aria-hidden="true" />
					{t("filters")}
					{active > 0 && (
						<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
							{active}
						</span>
					)}
				</Button>
				<span role="status" className="text-muted">
					{t("shown", {
						shown: formatNumber(visible.length),
						total: formatNumber(fortresses.length),
					})}
				</span>
			</div>

			{visible.length === 0 ? (
				<EmptyState
					title={t("empty")}
					description=""
					actions={<Button onClick={reset}>{t("reset")}</Button>}
				/>
			) : (
				<ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{visible.map((structure) => (
						<li key={structure.id}>
							<Card className="flex flex-col gap-2 p-4">
								<div className="flex items-baseline justify-between gap-3">
									<h3 className="font-semibold">{structure.name}</h3>
									<span className="text-muted font-mono text-xs">
										{t(`kind.${structure.kind as AllianceFortressKind}`)}
									</span>
								</div>
								<span className="text-muted font-mono text-xs">
									{t("coordinates", {
										x: formatNumber(structure.x),
										y: formatNumber(structure.y),
									})}
								</span>
								{structure.rewards.length === 0 ? (
									<p className="text-muted">{t("noRewards")}</p>
								) : (
									<>
										<span className="text-muted font-mono text-xs uppercase">
											{t("rewardsHeading")}
										</span>
										<ul className="grid grid-cols-2 gap-x-3 gap-y-1">
											{structure.rewards.map((entry) => (
												<li key={entry.phase} className="flex gap-2">
													<span className="text-muted font-mono">
														{formatNumber(entry.phase)}
													</span>
													<span>{entry.reward}</span>
												</li>
											))}
										</ul>
									</>
								)}
							</Card>
						</li>
					))}
				</ul>
			)}

			<Flyout
				open={filtersOpen}
				onClose={() => setFiltersOpen(false)}
				title={t("filtersTitle")}
				description={t("filtersDescription")}
				footer={
					<>
						<Button variant="link" onClick={reset} className="me-auto">
							{t("reset")}
						</Button>
						<Button variant="primary" onClick={() => setFiltersOpen(false)}>
							{t("done", { count: formatNumber(visible.length) })}
						</Button>
					</>
				}
			>
				<FilterFields
					filters={filters}
					onChange={setFilters}
					className="flex flex-col gap-4"
				/>
			</Flyout>
		</>
	);
}

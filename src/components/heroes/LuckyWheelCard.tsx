"use client";

import { useTranslations } from "next-intl";
import type { LuckyWheelPlan } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { HeroView } from "@/service/heroes";
import {
	bonusShards,
	clampSpins,
	estimatedShards,
	GEMS_PER_SPIN,
	GEMS_PER_TEN_SPINS,
	gemsNeeded,
	MAX_SPINS,
	SHARDS_PER_SPIN,
} from "@/service/luckyWheel";
import { CountInput } from "@/comps/resources/CountControl";
import { Card } from "@/comps/ui/Card";
import { Select } from "@/comps/ui/Select";

interface LuckyWheelCardProps {
	plannedViews: HeroView[];
	wheel: LuckyWheelPlan;
	onChange: (wheel: LuckyWheelPlan) => void;
}

export function LuckyWheelCard({ plannedViews, wheel, onChange }: LuckyWheelCardProps) {
	const t = useTranslations("heroes.plan.luckyWheel");
	const selected = plannedViews.find((view) => view.hero.id === wheel.heroId) ?? plannedViews[0];

	if (!selected) {
		return (
			<Card className="flex flex-col gap-2 p-4">
				<h3 className="font-semibold">{t("title")}</h3>
				<p className="text-muted">{t("noHero")}</p>
			</Card>
		);
	}

	const total = estimatedShards(wheel.spins);
	const bonus = bonusShards(wheel.spins);
	const gems = gemsNeeded(wheel.spins, wheel.tokens);
	const spinsOnTokens = Math.min(wheel.spins, wheel.tokens);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<p className="text-muted">
				{t("description", {
					perSpin: formatDecimal(SHARDS_PER_SPIN, 4),
				})}
			</p>
			<div className="grid gap-3 sm:grid-cols-3">
				<label className="flex flex-col gap-1">
					<span className="text-muted text-xs">{t("hero")}</span>
					<Select
						value={selected.hero.id}
						onChange={(event) => onChange({ ...wheel, heroId: event.target.value })}
					>
						{plannedViews.map((view) => (
							<option key={view.hero.id} value={view.hero.id}>
								{view.hero.name}
							</option>
						))}
					</Select>
				</label>
				<div className="flex flex-col gap-1">
					<span className="text-muted text-xs">
						{t("spins", { max: formatNumber(MAX_SPINS) })}
					</span>
					<CountInput
						label={t("spins", { max: formatNumber(MAX_SPINS) })}
						value={wheel.spins}
						onChange={(spins) =>
							onChange({
								...wheel,
								heroId: selected.hero.id,
								spins: clampSpins(spins),
							})
						}
						className="w-full"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-muted text-xs">{t("tokens")}</span>
					<CountInput
						label={t("tokens")}
						value={wheel.tokens}
						onChange={(tokens) =>
							onChange({ ...wheel, heroId: selected.hero.id, tokens })
						}
						className="w-full"
					/>
				</div>
			</div>
			<p className="font-mono text-sm">
				{t("estimate", {
					hero: selected.hero.name,
					total: formatNumber(total),
					bonus: formatNumber(bonus),
					spins: formatNumber(total - bonus),
				})}
			</p>
			<p className="font-mono text-sm">
				{gems === 0 ? t("gemsNone") : t("gems", { gems: formatNumber(gems) })}
			</p>
			<p className="text-muted text-xs">
				{t("gemsNote", {
					covered: formatNumber(spinsOnTokens),
					single: formatNumber(GEMS_PER_SPIN),
					ten: formatNumber(GEMS_PER_TEN_SPINS),
				})}
			</p>
		</Card>
	);
}

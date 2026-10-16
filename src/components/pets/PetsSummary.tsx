import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { PetsSummary as Summary, TroopTotals } from "@/service/pets";
import { unlockRuleText } from "@/service/pets";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

function SummaryTile({
	label,
	value,
	note,
	emphasis = false,
}: {
	label: string;
	value: ReactNode;
	note: string;
	emphasis?: boolean;
}) {
	return (
		<Card className="flex flex-col gap-1 px-4 py-3">
			<SectionLabel className="text-muted">{label}</SectionLabel>
			<span
				className={`font-mono text-xl sm:text-2xl ${emphasis ? "text-primary" : "text-ink"}`}
			>
				{value}
			</span>
			<span className="text-muted text-xs">{note}</span>
		</Card>
	);
}

export function PetsSummaryTiles({ summary }: { summary: Summary }) {
	const t = useTranslations("pets.summary");

	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
			<SummaryTile
				label={t("unlocked")}
				value={t("unlockedValue", {
					count: formatNumber(summary.unlocked),
					total: formatNumber(summary.total),
				})}
				note={t("unlockedNote")}
			/>
			<SummaryTile
				label={t("power")}
				value={formatNumber(summary.power)}
				note={
					summary.unknownPower === 0
						? t("powerNote")
						: t("powerUnknown", { amount: formatNumber(summary.unknownPower) })
				}
				emphasis
			/>
			<div className="col-span-2 lg:col-span-1">
				<SummaryTile
					label={t("next")}
					value={summary.next ? summary.next.pet.name : t("allUnlocked")}
					note={summary.next ? unlockRuleText(summary.next.pet) : t("allUnlockedNote")}
				/>
			</div>
		</div>
	);
}

function TotalsCard({ label, rows }: { label: string; rows: { name: string; value: string }[] }) {
	return (
		<Card className="flex flex-col gap-1 px-4 py-3">
			<SectionLabel className="text-muted">{label}</SectionLabel>
			{rows.map((row) => (
				<div key={row.name} className="flex items-baseline justify-between gap-2">
					<span className="text-muted">{row.name}</span>
					<span className="font-mono font-medium">{row.value}</span>
				</div>
			))}
		</Card>
	);
}

export function PetsTroopTotals({ totals }: { totals: TroopTotals }) {
	const t = useTranslations("pets.totals");
	const gain = (value: number) => t("gain", { value: formatDecimal(value) });
	const troopTypes = ["infantry", "lancer", "marksman"] as const;

	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<TotalsCard
				label={t("attackDefense")}
				rows={[
					{ name: t("attack"), value: gain(totals.attack) },
					{ name: t("defense"), value: gain(totals.defense) },
				]}
			/>
			{troopTypes.map((type) => (
				<TotalsCard
					key={type}
					label={t(`types.${type}`)}
					rows={[
						{ name: t("lethality"), value: gain(totals[type].lethality) },
						{ name: t("health"), value: gain(totals[type].health) },
					]}
				/>
			))}
		</div>
	);
}

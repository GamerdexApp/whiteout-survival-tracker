import { useTranslations } from "next-intl";
import type { TroopId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { MAX_TROOPS, visibleTiers } from "@/service/troops";
import type { TierRequirement, TroopTierView, TroopTypeView } from "@/service/troops";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { CountInput } from "./CountInput";
import { TroopSegmented } from "./TroopSegmented";
import { TypeDetails } from "./TroopTypeCards";

interface TroopTiersProps {
	view: TroopTypeView;
	views: TroopTypeView[];
	hideLowAvailable: boolean;
	hideLow: boolean;
	furnaceText: string;
	onSelect: (id: TroopId) => void;
	onHideLowChange: (value: boolean) => void;
	onCountChange: (tier: number, count: number) => void;
}

const COST_ORDER = ["lg:order-4", "lg:order-5", "lg:order-6", "lg:order-7"];

const COLUMNS =
	"lg:grid-cols-[minmax(8rem,1.4fr)_8rem_4.5rem_repeat(4,minmax(0,1fr))_minmax(0,1.3fr)]";

export function TroopTiers({
	view,
	views,
	hideLowAvailable,
	hideLow,
	furnaceText,
	onSelect,
	onHideLowChange,
	onCountChange,
}: TroopTiersProps) {
	const t = useTranslations("troops.tiers");
	const tiers = visibleTiers(view, hideLow);

	return (
		<section className="border-line bg-surface flex flex-col gap-3 lg:rounded-md lg:border-[1.5px] lg:p-5">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<h2 className="font-semibold max-lg:sr-only">{t("title", { name: view.name })}</h2>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
					{hideLowAvailable && (
						<div className="flex items-center gap-3 max-lg:order-last">
							<Switch
								checked={hideLow}
								onChange={onHideLowChange}
								labelledBy="hide-low-tiers-label"
							/>
							<span id="hide-low-tiers-label">{t("hideLow")}</span>
						</div>
					)}
					<TroopSegmented
						label={t("typeLabel")}
						options={views.map((item) => ({ id: item.id, label: item.name }))}
						value={view.id}
						onChange={onSelect}
					/>
				</div>
			</div>
			{hideLow && <p className="text-muted">{t("hiddenNote", { furnace: furnaceText })}</p>}
			<Card className="flex flex-col gap-3 p-4 lg:hidden">
				<TypeDetails view={view} />
			</Card>
			<div
				className={`border-line hidden items-end gap-x-3 border-b-[1.5px] px-2 pb-2 lg:grid ${COLUMNS}`}
			>
				<SectionLabel className="text-muted">{t("heads.tier")}</SectionLabel>
				<SectionLabel className="text-muted text-right">{t("heads.troops")}</SectionLabel>
				<SectionLabel className="text-muted">{t("heads.train")}</SectionLabel>
				{view.tiers[0].cost.map((material) => (
					<SectionLabel key={material.itemId} className="text-muted">
						{findItem(material.itemId)?.name ?? material.itemId}
					</SectionLabel>
				))}
				<SectionLabel className="text-muted text-right">{t("heads.power")}</SectionLabel>
			</div>
			<ul className="flex flex-col gap-3 lg:gap-0">
				{tiers.map((tier) => (
					<TierRow
						key={tier.tier}
						tier={tier}
						highest={tier.tier === view.highestTier}
						name={view.name}
						onCountChange={(count) => onCountChange(tier.tier, count)}
					/>
				))}
			</ul>
		</section>
	);
}

function requirementText(
	t: ReturnType<typeof useTranslations<"troops.tiers">>,
	requirement: TierRequirement
) {
	if (requirement.kind === "camp") {
		return t("requires.camp", { name: requirement.troopName, level: requirement.level });
	}
	if (requirement.kind === "building") {
		return t("requires.building", { name: requirement.name, level: requirement.level });
	}
	return t("requires.research", {
		name: requirement.name,
		level: formatNumber(requirement.level),
	});
}

function TierRow({
	tier,
	highest,
	name,
	onCountChange,
}: {
	tier: TroopTierView;
	highest: boolean;
	name: string;
	onCountChange: (count: number) => void;
}) {
	const t = useTranslations("troops.tiers");
	const tierLabel = t("tier", { tier: formatNumber(tier.tier) });

	return (
		<li
			className={`border-line grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-md border-[1.5px] p-4 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:px-2 lg:py-2 ${COLUMNS} ${
				highest ? "bg-tint" : "bg-surface"
			} ${tier.locked ? "text-locked" : ""}`}
		>
			<div className="flex flex-col gap-0.5 lg:order-1">
				<span className="flex items-center gap-2">
					<span className={`font-semibold ${tier.locked ? "" : "text-ink"}`}>
						{tierLabel}
					</span>
					{tier.locked && (
						<span className="border-locked rounded-full border-[1.5px] border-dashed px-2 py-0.5 font-mono text-[11px]">
							{t("locked")}
						</span>
					)}
				</span>
				{tier.locked && (
					<span className="text-xs">
						{t("requires.list", {
							list: tier.requirements
								.map((requirement) => requirementText(t, requirement))
								.join(", "),
						})}
					</span>
				)}
			</div>
			<div className="w-36 justify-self-end lg:order-2 lg:w-full">
				<CountInput
					label={t("countLabel", { name, tier: tierLabel })}
					value={tier.count}
					max={MAX_TROOPS}
					dashed={tier.locked}
					onCommit={onCountChange}
				/>
			</div>
			<div className="col-span-2 flex flex-wrap gap-x-3 font-mono text-xs lg:contents lg:text-sm">
				{tier.cost.map((material, index) => (
					<span key={material.itemId} className={COST_ORDER[index]}>
						<span className="font-sans lg:hidden">
							{findItem(material.itemId)?.name ?? material.itemId}{" "}
						</span>
						{formatNumber(material.amount)}
					</span>
				))}
			</div>
			<span className="col-span-2 font-mono text-xs lg:contents lg:text-sm">
				<span className="mr-3 lg:order-3 lg:mr-0">
					<span className="font-sans lg:hidden">{t("train")} </span>
					{t("seconds", { value: formatNumber(tier.seconds) })}
					<span className="font-sans lg:hidden"> {t("each")}</span>
				</span>
				<span className="lg:order-8 lg:text-right">
					<span className="font-sans lg:hidden">{t("mobilePower")} </span>
					{formatNumber(tier.power)}
				</span>
			</span>
		</li>
	);
}

import { useTranslations } from "next-intl";
import type { TroopId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { TroopTypeView } from "@/service/troops";
import { campOf } from "@/service/troops";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";

interface TroopTypeCardsProps {
	views: TroopTypeView[];
	selectedId: TroopId;
	totalTroops: number;
	totalPower: number;
}

export function TroopTypeCards({
	views,
	selectedId,
	totalTroops,
	totalPower,
}: TroopTypeCardsProps) {
	const t = useTranslations("troops.cards");

	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{views.map((view) => (
				<Card
					key={view.id}
					highlighted={view.id === selectedId}
					className="flex flex-col gap-1 p-3 lg:gap-3 lg:p-4"
				>
					<div className="flex flex-col lg:hidden">
						<span className="text-muted">{view.name}</span>
						<span className="font-mono text-xl">{formatNumber(view.total)}</span>
						<span className="text-muted text-xs">
							{t("tileSummary", { power: formatNumber(view.power) })}
						</span>
					</div>
					<TypeDetails view={view} className="max-lg:hidden" />
				</Card>
			))}
			<Card className="flex flex-col gap-1 p-3 lg:gap-3 lg:p-4">
				<div className="flex flex-col lg:hidden">
					<span className="text-muted">{t("allTroops")}</span>
					<span className="font-mono text-xl">{formatNumber(totalTroops)}</span>
					<span className="text-muted text-xs">
						{t("tileSummary", { power: formatNumber(totalPower) })}
					</span>
				</div>
				<div className="flex flex-col gap-3 max-lg:hidden">
					<div className="flex items-center gap-3">
						<ItemIcon size={32} />
						<h2 className="font-semibold">{t("totalPower")}</h2>
					</div>
					<StatLine label={t("troops")} value={formatNumber(totalTroops)} />
					<StatLine label={t("power")} value={formatNumber(totalPower)} />
					<p className="text-muted text-xs">{t("powerNote")}</p>
				</div>
			</Card>
		</div>
	);
}

export function TypeDetails({ view, className = "" }: { view: TroopTypeView; className?: string }) {
	const t = useTranslations("troops.cards");

	return (
		<div className={`flex flex-col gap-3 ${className}`}>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<ItemIcon src={campOf(view.id).img} size={32} />
					<h2 className="font-semibold">{view.name}</h2>
				</div>
				<span className="text-muted font-mono text-xs">
					{view.campLabel ? t("campLevel", { level: view.campLabel }) : t("campNotBuilt")}
				</span>
			</div>
			{view.campAgeLock && (
				<p className="text-muted text-xs">
					{t("campAgeLocked", { text: view.campAgeLock })}
				</p>
			)}
			<div className="flex items-baseline justify-between gap-3">
				<span className="text-muted">{t("highestTier")}</span>
				<span className="font-mono font-medium">
					{view.highestTier > 0
						? t("tierShort", { tier: formatNumber(view.highestTier) })
						: t("noTier")}
				</span>
			</div>
			<StatLine label={t("troops")} value={formatNumber(view.total)} />
			<StatLine label={t("power")} value={formatNumber(view.power)} />
		</div>
	);
}

function StatLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<span className="text-muted">{label}</span>
			<span className="font-mono text-xl font-medium lg:text-2xl">{value}</span>
		</div>
	);
}

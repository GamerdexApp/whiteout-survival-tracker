import { eventBuff } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const columnKeys = [
	"cityBonusWarsBuffs",
	"deploymentCapacity",
	"territoryBonuses",
	"marchAccelerator",
] as const;

export function EventBuffRules() {
	const t = useTranslations("bonuses.eventRules");
	const events = eventBuff().get();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="text-base font-semibold">{t("title")}</h2>
				<span className="text-muted font-mono text-xs">
					{t("rows", { count: formatNumber(events.length) })}
				</span>
			</div>
			<p className="text-muted">{t("intro")}</p>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[32rem] text-left">
					<thead>
						<tr>
							<th className="py-1 pr-3">
								<SectionLabel className="text-muted">{t("event")}</SectionLabel>
							</th>
							{columnKeys.map((column) => (
								<th key={column} className="py-1 pr-3">
									<SectionLabel className="text-muted">
										{t(`columns.${column}`)}
									</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{events.map((event) => (
							<tr key={event.id} className="border-line border-t-[1.5px]">
								<td className="py-2 pr-3 font-medium">{event.name}</td>
								{columnKeys.map((column) => (
									<td key={column} className="py-2 pr-3">
										{t(`applicability.${event[column]}`)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

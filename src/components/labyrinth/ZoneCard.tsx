import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { ZoneView } from "@/service/labyrinth";
import { CountInput } from "@/comps/troops/CountInput";
import { ProgressBar } from "@/comps/ui/ProgressBar";

interface ZoneCardProps {
	view: ZoneView;
	onStagesChange: (stages: number) => void;
}

export function ZoneCard({ view, onStagesChange }: ZoneCardProps) {
	const t = useTranslations("labyrinth.zones");
	const { zone, stagesCleared, glowstonePerWeek } = view;

	return (
		<li className="border-line flex flex-col gap-3 border-t-[1.5px] py-4 first:border-t-0 first:pt-0 last:pb-0">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col">
					<h3 className="font-semibold">{zone.name}</h3>
					<span className="text-muted">{t("opens", { days: zone.days.join(", ") })}</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-24">
						<CountInput
							label={t("stageLabel", { zone: zone.name })}
							value={stagesCleared}
							max={zone.stages}
							onCommit={onStagesChange}
						/>
					</span>
					<span className="text-muted font-mono">
						{t("ofTotal", { total: formatNumber(zone.stages) })}
					</span>
				</div>
			</div>
			<ProgressBar
				value={stagesCleared / zone.stages}
				label={t("progress", { zone: zone.name })}
			/>
			<span className="font-mono text-sm">
				{t("perWeek", { amount: formatNumber(glowstonePerWeek) })}
			</span>
			<div className="text-muted flex flex-col gap-0.5 text-sm">
				<span>{t("counts", { sources: zone.statSources })}</span>
				{zone.troops && <span>{t("troops", { troops: zone.troops })}</span>}
				{zone.unlock && <span>{t("unlock", { unlock: zone.unlock })}</span>}
				{zone.note && <span>{zone.note}</span>}
			</div>
		</li>
	);
}

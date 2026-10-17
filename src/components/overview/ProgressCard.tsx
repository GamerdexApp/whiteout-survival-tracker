import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Playthrough } from "@/types/app";
import { formatFurnaceLevel, formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { areaProgressOf, furnaceProgressOf, lockedAreasOf } from "@/service/overview";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { OverviewCard } from "./OverviewCard";

interface ProgressRowProps {
	href: string;
	label: string;
	ratio: number;
	value: string;
}

function ProgressRow({ href, label, ratio, value }: ProgressRowProps) {
	return (
		<li>
			<Link
				href={href}
				className="grid min-h-11 grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto]"
			>
				<span>{label}</span>
				<ProgressBar value={ratio} label={label} />
				<span className="text-end font-mono text-sm">{value}</span>
			</Link>
		</li>
	);
}

export function ProgressCard({ chief, className }: { chief: Playthrough; className?: string }) {
	const t = useTranslations("overview.progress");
	const { ui } = useUiSettings();
	const furnace = furnaceProgressOf(chief);
	const areas = areaProgressOf(chief);
	const locked = lockedAreasOf(chief);

	return (
		<OverviewCard title={t("title")} className={className}>
			<p className="text-muted -mt-2">{t("hint")}</p>
			<ul className="grid gap-x-10 lg:grid-cols-2">
				<ProgressRow
					href="/buildings"
					label={t("furnace")}
					ratio={furnace.ratio}
					value={
						furnace.level
							? t("furnaceOf", {
									level: formatFurnaceLevel(
										furnace.level,
										ui.furnaceFullLabels ?? false
									),
									max: furnace.maxLevel,
								})
							: t("furnaceUnknown")
					}
				/>
				{areas.map((area) => (
					<ProgressRow
						key={area.id}
						href={area.href}
						label={t(`areas.${area.id}`)}
						ratio={area.total === 0 ? 0 : area.owned / area.total}
						value={t("count", {
							owned: formatNumber(area.owned),
							total: formatNumber(area.total),
						})}
					/>
				))}
			</ul>
			{locked.length > 0 && (
				<ul className="border-line divide-line divide-y-[1.5px] border-t-[1.5px]">
					{locked.map((area) => (
						<li key={area.id}>
							<Link
								href={area.href}
								className="flex min-h-11 flex-wrap items-center justify-between gap-x-4"
							>
								<span className="text-muted">{t(`locked.${area.id}`)}</span>
								<span className="text-muted text-sm">
									{t("locked.requirement", {
										level: area.furnaceLevel,
										count: area.levelsMissing,
										amount: formatNumber(area.levelsMissing),
									})}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</OverviewCard>
	);
}

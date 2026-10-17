import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatCalendarDate, formatNumber } from "@/lib/format";
import { serverAgeOf } from "@/service/overviewEvents";
import type { UnlockState } from "@/service/overviewEvents";
import { areaUnlockRow, nextGenerationOf } from "@/service/overviewUnlocks";
import type { AreaUnlockRow, NextUnlock } from "@/service/overviewUnlocks";
import { formatUnlockDate } from "@/service/unlocks";
import { SERVER_AGE_TOLERANCE_DAYS } from "@/data/game/overviewTotals";
import { OverviewCard } from "./OverviewCard";

function UnlockLine({ label, state }: { label: string; state: UnlockState | null }) {
	const t = useTranslations("overview.server");
	const text = !state
		? t("unknownUnlock")
		: state.open
			? t("open")
			: t("opensIn", { days: formatNumber(state.daysLeft) });

	return (
		<div className="flex items-baseline justify-between gap-3 py-2.5">
			<dt>{label}</dt>
			<dd className={`font-mono text-sm ${state?.open ? "text-kept" : ""}`}>{text}</dd>
		</div>
	);
}

function NextLine({ next, names }: { next: NextUnlock; names: string }) {
	const t = useTranslations("overview.server.next");
	const values = {
		names,
		day: formatNumber(next.day),
		date: next.date ? formatUnlockDate(next.date) : "",
		days: formatNumber(next.daysLeft ?? 0),
	};
	const text = next.passed
		? t("passed", values)
		: next.daysLeft === null
			? t("unknownAge", values)
			: next.date
				? t("withDate", values)
				: t("noDate", values);

	return <p className="text-muted text-xs">{text}</p>;
}

function AreaRow({ row }: { row: AreaUnlockRow }) {
	const t = useTranslations("overview.server");
	const status = row.unknown
		? t("unknownUnlock")
		: row.area === "fireCrystal"
			? row.latest
				? t("fcUpTo", { level: row.latest })
				: t("nothingYet")
			: t("countOf", {
					unlocked: formatNumber(row.unlocked),
					total: formatNumber(row.total),
				});

	return (
		<div className="flex flex-col gap-0.5 py-2.5">
			<div className="flex items-baseline justify-between gap-3">
				<dt>{t(`areas.${row.area}`)}</dt>
				<dd className="font-mono text-sm">{status}</dd>
			</div>
			{!row.unknown &&
				(row.next ? (
					<NextLine next={row.next} names={row.next.names.join(", ")} />
				) : (
					<p className="text-muted text-xs">{t("allUnlocked")}</p>
				))}
		</div>
	);
}

export function ServerAgeCard({
	chief,
	now,
	className,
}: {
	chief: Playthrough;
	now: number;
	className?: string;
}) {
	const t = useTranslations("overview.server");
	const age = serverAgeOf(chief, now);
	const generation = nextGenerationOf(chief, now);

	return (
		<OverviewCard title={t("title")} href="/chiefs" linkLabel={t("edit")} className={className}>
			<div className="flex flex-col gap-1">
				<span className="font-mono text-sm">
					{age.days === null
						? t("unknown")
						: t("age", {
								days: formatNumber(age.days),
								tolerance: formatNumber(SERVER_AGE_TOLERANCE_DAYS),
							})}
				</span>
				{age.startDate && (
					<span className="text-muted">
						{t("fromDate", { date: formatCalendarDate(age.startDate) })}
					</span>
				)}
			</div>
			<dl className="divide-line border-line divide-y-[1.5px] border-t-[1.5px]">
				<UnlockLine label={t("warAcademy")} state={age.warAcademy} />
				<UnlockLine label={t("t12")} state={age.t12} />
				<div className="flex flex-col gap-0.5 py-2.5">
					<div className="flex items-baseline justify-between gap-3">
						<dt>{t("heroes")}</dt>
						<dd className="font-mono text-sm">
							{t("generation", { number: formatNumber(age.heroGeneration) })}
						</dd>
					</div>
					{generation ? (
						<NextLine
							next={generation.next}
							names={t("generationName", {
								number: formatNumber(generation.generation),
							})}
						/>
					) : (
						<p className="text-muted text-xs">{t("allGenerations")}</p>
					)}
				</div>
				<AreaRow row={areaUnlockRow(chief, "fireCrystal", now)} />
				<AreaRow row={areaUnlockRow(chief, "pets", now)} />
				<AreaRow row={areaUnlockRow(chief, "experts", now)} />
			</dl>
			<p className="text-muted">{t("estimate")}</p>
		</OverviewCard>
	);
}

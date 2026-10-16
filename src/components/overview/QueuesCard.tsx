import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Playthrough } from "@/types/app";
import { formatNumber, formatTimeLeft } from "@/lib/format";
import { queueRowsOf, runningCountOf } from "@/service/overviewQueues";
import type { QueueRow } from "@/service/overviewQueues";
import { jobProgress, secondsLeft } from "@/service/queues";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { CountBadge, OverviewCard } from "./OverviewCard";

type QueuesTranslator = ReturnType<typeof useTranslations<"overview.queues">>;

const labelOf = (t: QueuesTranslator, row: QueueRow) => {
	if (row.kind === "construction")
		return t("construction", { number: formatNumber(Number(row.slot)) });
	if (row.kind === "research") {
		return row.slot === "warAcademy" ? t("researchWarAcademy") : t("researchMain");
	}
	if (row.kind === "training") return t("training", { name: row.subject ?? "" });
	return t("learning");
};

const taskOf = (t: QueuesTranslator, row: QueueRow) => {
	const name = row.subject ?? "";
	const target = row.target ?? "";
	if (row.kind === "construction") return t("task.construction", { name, level: target });
	if (row.kind === "research") return t("task.research", { name, level: target });
	if (row.kind === "training") return t("task.training", { tier: target });
	return t("task.learning", { name, skill: target });
};

const idleTextOf = (t: QueuesTranslator, row: QueueRow) =>
	row.kind === "construction" ? t("idleBuildings") : t("idleResearch");

function QueueRowView({ row, now }: { row: QueueRow; now: number }) {
	const t = useTranslations("overview.queues");
	const label = labelOf(t, row);
	const left = row.job ? secondsLeft(row.job, now) : 0;
	const task = row.job ? taskOf(t, row) : idleTextOf(t, row);

	return (
		<li>
			<Link href={row.href} className="flex min-h-11 flex-col gap-1.5 py-1">
				<span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
					<span className="flex flex-wrap items-baseline gap-x-3">
						<span className="flex items-center gap-2 font-semibold">
							<span aria-hidden="true" className="bg-primary size-2.5 rounded-full" />
							{label}
						</span>
						<span className="text-muted">{task}</span>
					</span>
					<span
						className={`font-mono text-sm ${row.job ? (left === 0 ? "text-kept" : "text-ink") : "text-muted"}`}
					>
						{row.job ? formatTimeLeft(left) : t("idle")}
					</span>
				</span>
				<ProgressBar
					value={row.job ? jobProgress(row.job, now) : 0}
					label={t("progress", { title: label })}
				/>
			</Link>
		</li>
	);
}

export function QueuesCard({
	chief,
	now,
	className,
}: {
	chief: Playthrough;
	now: number;
	className?: string;
}) {
	const t = useTranslations("overview.queues");
	const rows = queueRowsOf(chief);

	return (
		<OverviewCard
			title={t("title")}
			className={className}
			badge={
				<CountBadge>
					{t("running", { count: formatNumber(runningCountOf(rows)) })}
				</CountBadge>
			}
		>
			<ul className="divide-line flex flex-col divide-y-[1.5px]">
				{rows.map((row) => (
					<QueueRowView key={row.key} row={row} now={now} />
				))}
			</ul>
		</OverviewCard>
	);
}

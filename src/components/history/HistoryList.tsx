import { useTranslations } from "next-intl";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import type { HistoryRow } from "@/service/historyEvents";
import { gameEventOf } from "@/data/game/coreEvents";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { DiffText } from "./DiffText";
import { useHistoryText } from "./useHistoryText";

const DESKTOP_COLUMNS =
	"lg:grid-cols-[minmax(0,1fr)_7rem_7rem_12rem_4rem_5rem_4rem] lg:items-center lg:gap-x-4";

export const entryHref = (row: HistoryRow) =>
	`/history/${row.event}/${encodeURIComponent(row.entry.id)}`;

export function HistoryList({ rows }: { rows: HistoryRow[] }) {
	const t = useTranslations("history.list");
	const { titleOf, endedOf, rankOf } = useHistoryText();

	return (
		<div className="bg-surface border-line overflow-hidden rounded-md border-[1.5px]">
			<div
				aria-hidden="true"
				className={`border-line text-muted hidden border-b-[1.5px] px-5 py-3 font-mono text-[11px] tracking-[0.08em] uppercase lg:grid ${DESKTOP_COLUMNS}`}
			>
				<span>{t("event")}</span>
				<span className="text-end">{t("plan")}</span>
				<span className="text-end">{t("actual")}</span>
				<span className="text-end">{t("diff")}</span>
				<span className="text-end">{t("rank")}</span>
				<span className="text-end">{t("alliance")}</span>
				<span />
			</div>
			<ul className="divide-line divide-y-[1.5px]">
				{rows.map((row) => {
					const title = titleOf(row.event, row.entry);
					return (
						<li
							key={`${row.event}:${row.entry.id}`}
							className={`grid grid-cols-3 gap-x-4 gap-y-2 p-4 lg:px-5 lg:py-5 ${DESKTOP_COLUMNS}`}
						>
							<div className="col-span-3 flex items-center gap-3 lg:col-span-1">
								<ItemIcon src={gameEventOf(row.event).img} size={36} />
								<div className="flex min-w-0 flex-col">
									<span className="font-semibold">{title}</span>
									<span className="text-muted">{endedOf(row.entry)}</span>
								</div>
							</div>
							<div className="flex flex-col lg:block lg:text-end">
								<span className="text-muted lg:sr-only">{t("plan")}</span>
								<span className="font-mono">{formatNumber(row.plan)}</span>
							</div>
							<div className="flex flex-col lg:block lg:text-end">
								<span className="text-muted lg:sr-only">{t("actual")}</span>
								<span className="font-mono font-semibold">
									{formatNumber(row.actual)}
								</span>
							</div>
							<div className="flex flex-col lg:block lg:text-end">
								<span className="text-muted lg:sr-only">{t("diff")}</span>
								<DiffText difference={row.difference} percent={row.percent} />
							</div>
							<span className="col-span-2 lg:hidden">
								{t("rankLine", {
									rank: rankOf(row.rank),
									alliance: rankOf(row.allianceRank),
								})}
							</span>
							<span className="hidden text-end font-mono lg:block">
								{rankOf(row.rank)}
							</span>
							<span className="hidden text-end font-mono lg:block">
								{rankOf(row.allianceRank)}
							</span>
							<Link
								href={entryHref(row)}
								aria-label={t("openEvent", { name: title })}
								className="text-link flex min-h-11 items-center justify-end hover:underline lg:min-h-9"
							>
								{t("open")}
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

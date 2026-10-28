import { useTranslations } from "next-intl";
import type { CoreEventId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { rankTableOf } from "@/service/coreEvents";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";

export function RankCard({ event, dayId }: { event: CoreEventId; dayId: string }) {
	const t = useTranslations("coreEvents.ranks");
	const table = rankTableOf(event, dayId);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			{!table ? (
				<p className="text-muted">{t("noneShowdown")}</p>
			) : (
				<>
					<div className="text-muted flex flex-col gap-1">
						<p>{table.basedOn}</p>
						<p>{t("note")}</p>
					</div>
					<table className="w-full text-start">
						<thead className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
							<tr>
								<th className="w-24 py-1 font-normal">{t("rank")}</th>
								<th className="py-1 font-normal">{t("reward")}</th>
							</tr>
						</thead>
						<tbody>
							{table.rows.map((row) => (
								<tr key={row.rank} className="border-line border-t-[1.5px]">
									<td className="py-2 font-mono">{row.rank}</td>
									<td className="py-2 font-medium">
										{row.gems === null ? (
											<span className="text-muted font-normal">
												{t("unknown")}
											</span>
										) : (
											<span className="inline-flex items-center gap-1.5">
												<ItemIcon src={findItem("gems")?.img} size={16} />
												{t("gems", { amount: formatNumber(row.gems) })}
											</span>
										)}
										{row.notConfirmed && (
											<span className="text-muted ms-2 font-mono text-xs font-normal">
												{t("notConfirmed")}
											</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
		</Card>
	);
}

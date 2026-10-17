import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { PieceResult, runChiefGearPlan } from "@/service/calcChiefGear";
import { chiefGearEventList } from "@/data/game/calcChiefGear";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { StatTile } from "@/comps/ui/StatTile";
import { StackTable } from "@/comps/wiki/tables/StackTable";
import type { StackColumn } from "@/comps/wiki/tables/StackTable";
import { useLevelName } from "./useLevelName";

interface ChiefGearResultsProps {
	plan: ReturnType<typeof runChiefGearPlan>;
}

export function ChiefGearResults({ plan }: ChiefGearResultsProps) {
	const t = useTranslations("calcChiefGear");
	const { total, byPiece } = plan;

	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-lg font-semibold">{t("results.heading")}</h2>
			<div className="grid gap-3 sm:grid-cols-3">
				<StatTile emphasis value={formatNumber(total.score)} label={t("results.score")} />
				<StatTile value={formatNumber(total.power)} label={t("results.power")} />
				<StatTile value={formatNumber(total.steps)} label={t("results.steps")} />
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<Card className="flex flex-col gap-2 p-4">
					<h3 className="font-semibold">{t("results.materials")}</h3>
					{total.materials.length === 0 ? (
						<p className="text-muted">{t("results.noMaterials")}</p>
					) : (
						<ul className="flex flex-col">
							{total.materials.map(({ itemId, amount }) => {
								const item = findItem(itemId);
								return (
									<li
										key={itemId}
										className="border-line flex items-center justify-between gap-3 border-t-[1.5px] py-2 first:border-t-0"
									>
										<span className="flex min-w-0 items-center gap-2">
											<ItemIcon src={item?.img} size={28} />
											{item?.name ?? itemId}
										</span>
										<span className="font-mono">{formatNumber(amount)}</span>
									</li>
								);
							})}
						</ul>
					)}
				</Card>

				<Card className="flex flex-col gap-2 p-4">
					<h3 className="font-semibold">{t("results.events")}</h3>
					<ul className="flex flex-col">
						{chiefGearEventList.map(({ key, name }) => (
							<li
								key={key}
								className="border-line flex items-center justify-between gap-3 border-t-[1.5px] py-2 first:border-t-0"
							>
								<span>{name}</span>
								<span className="font-mono">
									{formatNumber(total.eventPoints[key])}
								</span>
							</li>
						))}
					</ul>
				</Card>
			</div>
			<Note>{t("results.eventsNote")}</Note>

			{byPiece.length > 0 && <PieceTable rows={byPiece} />}
		</section>
	);
}

function PieceTable({ rows }: { rows: PieceResult[] }) {
	const t = useTranslations("calcChiefGear.byPiece");
	const levelName = useLevelName();

	const columns: StackColumn<PieceResult>[] = [
		{
			id: "piece",
			header: t("piece"),
			width: "minmax(0,0.8fr)",
			render: (row) => <span className="font-semibold">{row.piece.name}</span>,
		},
		{
			id: "levels",
			header: t("levels"),
			width: "minmax(0,2fr)",
			render: (row) =>
				t("levelRange", {
					from: row.current === null ? t("noLevel") : levelName(row.current),
					to: levelName(row.goal),
				}),
		},
		{
			id: "steps",
			header: t("steps"),
			width: "4rem",
			render: (row) => <span className="font-mono">{formatNumber(row.result.steps)}</span>,
		},
		{
			id: "score",
			header: t("score"),
			width: "minmax(0,0.7fr)",
			render: (row) => <span className="font-mono">{formatNumber(row.result.score)}</span>,
		},
		{
			id: "power",
			header: t("power"),
			width: "minmax(0,0.9fr)",
			render: (row) => <span className="font-mono">{formatNumber(row.result.power)}</span>,
		},
		{
			id: "stats",
			header: t("stats"),
			width: "minmax(0,1.1fr)",
			render: (row) => (
				<span className="font-mono">
					{t("statRange", {
						from: formatDecimal(row.current?.statTotalPercent ?? 0),
						to: formatDecimal(row.goal.statTotalPercent),
					})}
				</span>
			),
		},
	];

	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-semibold">{t("heading")}</h3>
			<StackTable
				label={t("heading")}
				columns={columns}
				rows={rows}
				rowKey={(row) => row.piece.id}
			/>
		</section>
	);
}

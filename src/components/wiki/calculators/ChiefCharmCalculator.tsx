"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { CharmBreakdownRow, CharmChoice, CharmChoices } from "@/service/calcChiefCharm";
import { choiceForAll, EMPTY_CHOICE, planCharms } from "@/service/calcChiefCharm";
import { charmEventList, gearPieceList } from "@/data/game/calcChiefCharm";
import type { UpgradeResult } from "@/data/game/calcChiefCharm";
import { findItem } from "@/data/game/items";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { StatTile } from "@/comps/ui/StatTile";
import { ResourceList } from "../tables/ResourceList";
import { StackTable } from "../tables/StackTable";
import type { StackColumn } from "../tables/StackTable";
import { CharmPieceSection } from "./chiefcharm/CharmPieceSection";
import { CharmRangeFields } from "./chiefcharm/CharmRangeFields";

export function ChiefCharmCalculator() {
	const t = useTranslations("calcChiefCharm");
	const [choices, setChoices] = useState<CharmChoices>(() => choiceForAll(EMPTY_CHOICE));
	const [allChoice, setAllChoice] = useState<CharmChoice>(EMPTY_CHOICE);
	const plan = planCharms(choices);

	const changeCharm = (key: string, choice: CharmChoice) =>
		setChoices((current) => ({ ...current, [key]: choice }));

	const resetAll = () => {
		setAllChoice(EMPTY_CHOICE);
		setChoices(choiceForAll(EMPTY_CHOICE));
	};

	return (
		<div className="flex flex-col gap-6">
			<Card className="flex flex-col gap-3 p-4">
				<div>
					<h2 className="font-semibold">{t("setAll.title")}</h2>
					<p className="text-muted">{t("setAll.hint")}</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
					<CharmRangeFields
						choice={allChoice}
						fromLabel={t("setAll.fromLabel")}
						toLabel={t("setAll.toLabel")}
						onChange={setAllChoice}
					/>
					<div className="flex gap-2">
						<Button
							variant="primary"
							className="flex-1"
							onClick={() => setChoices(choiceForAll(allChoice))}
						>
							{t("setAll.apply")}
						</Button>
						<Button className="flex-1" onClick={resetAll}>
							{t("setAll.reset")}
						</Button>
					</div>
				</div>
			</Card>

			<ResultSection total={plan.total} charmCount={plan.breakdown.length} />

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">{t("charms.title")}</h2>
				<p className="text-muted">{t("charms.hint")}</p>
				<Card>
					{gearPieceList.map((piece) => (
						<CharmPieceSection
							key={piece.id}
							piece={piece}
							choices={choices}
							onChange={changeCharm}
						/>
					))}
				</Card>
			</section>

			<BreakdownSection rows={plan.breakdown} />
		</div>
	);
}

function ResultSection({ total, charmCount }: { total: UpgradeResult; charmCount: number }) {
	const t = useTranslations("calcChiefCharm");

	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-lg font-semibold">{t("result.title")}</h2>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile value={formatNumber(total.score)} label={t("result.score")} emphasis />
				<StatTile value={formatNumber(total.power)} label={t("result.power")} />
				<StatTile value={formatNumber(total.steps)} label={t("result.steps")} />
				<StatTile value={formatNumber(charmCount)} label={t("result.charms")} />
			</div>
			<div className="grid items-start gap-3 lg:grid-cols-2">
				<Card className="flex flex-col gap-2 p-4">
					<h3 className="font-semibold">{t("result.materials")}</h3>
					{total.materials.length === 0 ? (
						<p className="text-muted">{t("result.noMaterials")}</p>
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
					<h3 className="font-semibold">{t("result.eventPoints")}</h3>
					<ul className="flex flex-col">
						{charmEventList.map(({ key, name }) => (
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
					<p className="text-muted text-xs">{t("result.eventPointsNote")}</p>
				</Card>
			</div>
		</section>
	);
}

function BreakdownSection({ rows }: { rows: CharmBreakdownRow[] }) {
	const t = useTranslations("calcChiefCharm");

	const percent = (value: number) => t("breakdown.percent", { value: formatDecimal(value) });

	const columns: StackColumn<CharmBreakdownRow>[] = [
		{
			id: "charm",
			header: t("breakdown.charm"),
			width: "minmax(0,1fr)",
			render: ({ row }) => (
				<span className="font-semibold">
					{t("charms.charmName", {
						piece: row.piece.name,
						number: formatNumber(row.number),
					})}
				</span>
			),
		},
		{
			id: "levels",
			header: t("breakdown.levels"),
			width: "minmax(0,1.4fr)",
			render: ({ from, to }) =>
				t("breakdown.levelRange", {
					from: from?.name ?? t("breakdown.none"),
					to: to.name,
				}),
		},
		{
			id: "stat",
			header: t("breakdown.stat"),
			width: "minmax(0,1fr)",
			render: ({ from, to }) =>
				t("breakdown.levelRange", {
					from: from === null ? t("breakdown.none") : percent(from.statTotalPercent),
					to: percent(to.statTotalPercent),
				}),
		},
		{
			id: "steps",
			header: t("breakdown.steps"),
			width: "4rem",
			render: ({ result }) => <span className="font-mono">{formatNumber(result.steps)}</span>,
		},
		{
			id: "score",
			header: t("breakdown.score"),
			width: "5rem",
			render: ({ result }) => <span className="font-mono">{formatNumber(result.score)}</span>,
		},
		{
			id: "power",
			header: t("breakdown.power"),
			width: "7rem",
			render: ({ result }) => <span className="font-mono">{formatNumber(result.power)}</span>,
		},
		{
			id: "materials",
			header: t("breakdown.materials"),
			width: "minmax(0,2fr)",
			render: ({ result }) => (
				<ResourceList entries={result.materials} exact emptyText={t("breakdown.none")} />
			),
		},
	];

	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-lg font-semibold">{t("breakdown.title")}</h2>
			{rows.length === 0 ? (
				<Note>{t("breakdown.empty")}</Note>
			) : (
				<StackTable
					label={t("breakdown.title")}
					columns={columns}
					rows={rows}
					rowKey={({ row }) => row.key}
				/>
			)}
		</section>
	);
}

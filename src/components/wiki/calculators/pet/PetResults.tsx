"use client";

import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import { hasProgress, knownPower } from "@/service/calcPet";
import type { Pet, PetCalculation, PetItemResult } from "@/data/game/calcPet";
import { findPet, hallOfChiefName, PET_EVENT_KEYS, petEventName } from "@/data/game/calcPet";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { StatTile } from "@/comps/ui/StatTile";
import { ResourceList } from "../../tables/ResourceList";
import { StackTable } from "../../tables/StackTable";
import type { StackColumn } from "../../tables/StackTable";

export function PetResults({ result }: { result: PetCalculation }) {
	const t = useTranslations("calcPet.results");
	const percent = (value: number) => t("percent", { value: formatDecimal(value) });
	const power = (value: number | null) => (value === null ? t("unknown") : formatNumber(value));
	const totalPower = knownPower(result);
	const progressItems = result.items.filter(hasProgress);
	const hasUnknownPower = progressItems.some((item) => knownPower(item) === null);

	const stats = [
		{ id: "levels", value: formatNumber(result.levels) },
		{ id: "advancements", value: formatNumber(result.advancements) },
		{ id: "troopAttack", value: percent(result.troopAttack) },
		{ id: "troopDefense", value: percent(result.troopDefense) },
		{ id: "power", value: power(totalPower) },
		{ id: "advancementScore", value: formatNumber(result.advancementScore) },
	] as const;

	const columns: StackColumn<PetItemResult>[] = [
		{
			id: "pet",
			header: t("byPet.heads.pet"),
			width: "minmax(10rem, 1.4fr)",
			render: (item) => (
				<span className="flex items-center gap-2 font-semibold">
					<ItemIcon src={(findPet(item.id) as Pet).img} size={28} />
					{item.name}
				</span>
			),
		},
		{
			id: "levels",
			header: t("byPet.heads.levels"),
			width: "minmax(4rem, 0.6fr)",
			render: (item) => <span className="font-mono">{formatNumber(item.levels)}</span>,
		},
		{
			id: "advancements",
			header: t("byPet.heads.advancements"),
			width: "minmax(6rem, 0.8fr)",
			render: (item) => <span className="font-mono">{formatNumber(item.advancements)}</span>,
		},
		{
			id: "score",
			header: t("byPet.heads.score"),
			width: "minmax(4rem, 0.7fr)",
			render: (item) => (
				<span className="font-mono">{formatNumber(item.advancementScore)}</span>
			),
		},
		{
			id: "resources",
			header: t("byPet.heads.resources"),
			width: "minmax(12rem, 2fr)",
			render: (item) => (
				<ResourceList entries={item.resources} exact emptyText={t("byPet.noResources")} />
			),
		},
		{
			id: "troopAttack",
			header: t("byPet.heads.troopAttack"),
			width: "minmax(5rem, 0.8fr)",
			render: (item) => <span className="font-mono">{percent(item.troopAttack)}</span>,
		},
		{
			id: "troopDefense",
			header: t("byPet.heads.troopDefense"),
			width: "minmax(5rem, 0.8fr)",
			render: (item) => <span className="font-mono">{percent(item.troopDefense)}</span>,
		},
		{
			id: "power",
			header: t("byPet.heads.power"),
			width: "minmax(5rem, 0.9fr)",
			render: (item) => <span className="font-mono">{power(knownPower(item))}</span>,
		},
	];

	return (
		<section className="flex flex-col gap-4">
			<h2 className="text-lg font-semibold">{t("title")}</h2>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				{stats.map((stat) => (
					<StatTile key={stat.id} value={stat.value} label={t(`stats.${stat.id}`)} />
				))}
			</div>
			{hasUnknownPower && <Note>{t("unknownPowerNote")}</Note>}
			<div className="grid gap-4 lg:grid-cols-2 lg:items-start">
				<Card className="flex flex-col p-4">
					<h3 className="pb-2 font-semibold">{t("resources.title")}</h3>
					{result.resources.length === 0 ? (
						<p className="text-muted">{t("resources.empty")}</p>
					) : (
						<ul className="flex flex-col">
							{result.resources.map((resource) => {
								const item = findItem(resource.itemId);
								return (
									<li
										key={resource.itemId}
										className="border-line flex min-h-11 items-center gap-2 border-t-[1.5px] py-1 first:border-t-0"
									>
										<ItemIcon src={item?.img} size={28} />
										<span className="min-w-0 flex-1">
											{item?.name ?? resource.itemId}
										</span>
										<span className="font-mono">
											{formatNumber(resource.amount)}
										</span>
									</li>
								);
							})}
						</ul>
					)}
				</Card>
				<Card className="flex flex-col gap-2 p-4">
					<h3 className="font-semibold">{t("events.title")}</h3>
					<ul className="flex flex-col">
						{PET_EVENT_KEYS.map((key) => (
							<li
								key={key}
								className="border-line flex min-h-11 items-center justify-between gap-2 border-t-[1.5px] py-1 first:border-t-0"
							>
								<span>{petEventName(key)}</span>
								<span className="font-mono">
									{formatNumber(result.eventPoints[key])}
								</span>
							</li>
						))}
						<li className="border-line flex min-h-11 items-center justify-between gap-2 border-t-[1.5px] py-1">
							<span>{hallOfChiefName()}</span>
							<span className="text-muted">{t("events.noPoints")}</span>
						</li>
					</ul>
					<p className="text-muted text-xs">
						{t("events.note", { hallOfChief: hallOfChiefName() })}
					</p>
				</Card>
			</div>
			<div className="flex flex-col gap-2">
				<h3 className="font-semibold">{t("byPet.title")}</h3>
				{progressItems.length === 0 ? (
					<Card className="p-4">
						<p className="text-muted">{t("byPet.empty")}</p>
					</Card>
				) : (
					<StackTable
						label={t("byPet.tableLabel")}
						columns={columns}
						rows={progressItems}
						rowKey={(item) => item.id}
					/>
				)}
			</div>
		</section>
	);
}

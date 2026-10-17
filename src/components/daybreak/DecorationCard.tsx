"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import type { BuffText, DecorationView } from "@/service/daybreak";
import { isCounted } from "@/service/daybreak";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Switch } from "@/comps/ui/Switch";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { CountField } from "./CountField";
import { RarityBadge } from "./RarityBadge";

interface DecorationCardProps {
	view: DecorationView;
	locked: boolean;
	onOwned: (owned: boolean) => void;
	onLevel: (level: number) => void;
	onCount: (count: number) => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<span className="text-muted">{label}</span>
			<span className="text-end font-mono">{children}</span>
		</div>
	);
}

function Unknown() {
	const t = useTranslations("daybreak.card");
	return <span className="text-muted">{t("unknown")}</span>;
}

function BuffValue({ buff }: { buff: BuffText | null }) {
	const t = useTranslations("daybreak.card");
	return buff ? <>{t("buffValue", { value: buff.value, stat: buff.stat })}</> : <Unknown />;
}

function KnownNumber({ value }: { value: number | undefined }) {
	return value === undefined ? <Unknown /> : <>{formatNumber(value)}</>;
}

export function DecorationCard({ view, locked, onOwned, onLevel, onCount }: DecorationCardProps) {
	const t = useTranslations("daybreak");
	const { decoration, owned } = view;
	const counted = isCounted(decoration);
	const levelled = view.maxLevel > 0;
	const controlsOff = locked || !owned;
	const cost = decoration.cost?.[0];
	const costBased = cost !== undefined;

	return (
		<li className="mb-3 break-inside-avoid">
			<Card className="flex flex-col gap-3 p-3" data-owned={owned}>
				<div className="flex items-start gap-3">
					<ItemIcon src={decoration.img} size={44} />
					<div className="flex min-w-0 flex-1 flex-col items-start gap-1">
						<h3 className="font-semibold">{decoration.name}</h3>
						<span className="flex flex-wrap gap-1">
							<RarityBadge category={decoration.category}>
								{t(`categories.${decoration.category}`)}
							</RarityBadge>
							{decoration.limited && <RarityBadge>{t("card.limited")}</RarityBadge>}
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-1">
					{cost && (
						<Row label={t("card.costEach")}>
							{t("card.cost", {
								amount: formatNumber(cost.amount),
								item: findItem(cost.itemId)?.name ?? cost.itemId,
							})}
						</Row>
					)}
					{costBased && (
						<Row label={t("card.limit")}>
							<KnownNumber value={decoration.limit} />
						</Row>
					)}
					{view.buffAtLevel && (
						<Row label={t("card.buffAtLevel", { level: formatNumber(view.level) })}>
							<BuffValue buff={view.buffAtLevel} />
						</Row>
					)}
					{view.buffAtMax && (
						<Row label={t("card.buffAtMax")}>
							<BuffValue buff={view.buffAtMax} />
						</Row>
					)}
					{!costBased && (
						<>
							<Row label={t("card.prosperityAtMax")}>
								<KnownNumber value={view.prosperityAtMax} />
							</Row>
							<Row label={t("card.essenceCost")}>
								<KnownNumber value={decoration.lifeEssenceCost} />
							</Row>
							<Row label={t("card.limit")}>
								<KnownNumber value={decoration.limit} />
							</Row>
						</>
					)}
				</div>

				<div className="border-line flex items-center justify-between gap-3 border-t-[1.5px] pt-3">
					<span className="flex items-center gap-2">
						<Switch
							label={t("card.ownedLabel", { name: decoration.name })}
							checked={owned}
							disabled={locked}
							onChange={onOwned}
						/>
						<span className={owned ? "" : "text-muted"}>
							{!owned
								? t("card.notOwned")
								: counted
									? t("card.ownedCount", {
											count: formatNumber(view.count),
											limit: formatNumber(decoration.limit ?? 1),
										})
									: t("card.owned")}
						</span>
					</span>
					{counted && (
						<CountField
							label={t("card.countLabel", { name: decoration.name })}
							value={view.count}
							min={owned ? 1 : 0}
							max={decoration.limit ?? 1}
							disabled={controlsOff}
							onChange={onCount}
						/>
					)}
					{levelled && (
						<span className={owned ? "" : "text-muted"}>
							<ValueStepper
								label={t("card.levelLabel", { name: decoration.name })}
								value={view.level}
								min={1}
								max={view.maxLevel}
								disabled={controlsOff}
								display={t("levelOf", {
									level: formatNumber(view.level),
									max: formatNumber(view.maxLevel),
								})}
								onChange={onLevel}
							/>
						</span>
					)}
				</div>
			</Card>
		</li>
	);
}

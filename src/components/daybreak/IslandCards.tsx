"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import type { LumberCampView, TreeOfLifeView } from "@/service/daybreak";
import { MAX_ISLAND_LEVEL, MAX_TREE_LEVEL } from "@/service/daybreak";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { ValueStepper } from "@/comps/ui/ValueStepper";

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<span className="text-muted">{label}</span>
			<span className="text-end font-mono">{children}</span>
		</div>
	);
}

interface CardFrameProps {
	title: string;
	stepper: ReactNode;
	children: ReactNode;
}

function CardFrame({ title, stepper, children }: CardFrameProps) {
	return (
		<Card className="flex flex-col gap-3 p-3">
			<div className="flex items-center gap-3">
				<ItemIcon size={44} />
				<h2 className="min-w-0 flex-1 font-semibold">{title}</h2>
				{stepper}
			</div>
			<div className="flex flex-col gap-1">{children}</div>
		</Card>
	);
}

interface LumberCampCardProps {
	view: LumberCampView;
	locked: boolean;
	onLevel: (level: number) => void;
}

export function LumberCampCard({ view, locked, onLevel }: LumberCampCardProps) {
	const t = useTranslations("daybreak");
	const { current, next } = view;

	return (
		<CardFrame
			title={t("camp.title")}
			stepper={
				<ValueStepper
					label={t("camp.levelLabel")}
					value={view.level}
					min={1}
					max={MAX_ISLAND_LEVEL}
					disabled={locked}
					display={t("levelOf", {
						level: formatNumber(view.level),
						max: formatNumber(MAX_ISLAND_LEVEL),
					})}
					onChange={onLevel}
				/>
			}
		>
			<Row label={t("camp.workers")}>{formatNumber(current.workers)}</Row>
			<Row label={t("camp.rate")}>{formatNumber(current.ratePerSecond)}</Row>
			<Row label={t("camp.essence")}>{formatNumber(current.lifeEssenceRequired)}</Row>
			{view.treeTooLow ? (
				<Note tone="warning">
					{t("camp.treeTooLow", {
						current: formatNumber(view.treeLevel),
						level: formatNumber(view.level),
						required: formatNumber(current.treeOfLifeLevelRequired),
					})}
				</Note>
			) : (
				<span className="text-muted">
					{t("camp.needsTree", {
						required: formatNumber(current.treeOfLifeLevelRequired),
						current: formatNumber(view.treeLevel),
					})}
				</span>
			)}
			<span className="text-muted text-xs">
				{next
					? t("camp.next", {
							level: formatNumber(next.level),
							essence: formatNumber(next.lifeEssenceRequired),
							tree: formatNumber(next.treeOfLifeLevelRequired),
						})
					: t("camp.highest")}
			</span>
		</CardFrame>
	);
}

interface TreeOfLifeCardProps {
	view: TreeOfLifeView;
	locked: boolean;
	onLevel: (level: number) => void;
}

export function TreeOfLifeCard({ view, locked, onLevel }: TreeOfLifeCardProps) {
	const t = useTranslations("daybreak");
	const { current, next } = view;

	return (
		<CardFrame
			title={t("tree.title")}
			stepper={
				<ValueStepper
					label={t("tree.levelLabel")}
					value={view.level}
					min={1}
					max={MAX_TREE_LEVEL}
					disabled={locked}
					display={t("levelOf", {
						level: formatNumber(view.level),
						max: formatNumber(MAX_TREE_LEVEL),
					})}
					onChange={onLevel}
				/>
			}
		>
			<Row label={t("tree.prosperity")}>{formatNumber(current.prosperityRequired)}</Row>
			<Row label={t("tree.essence")}>{formatNumber(current.lifeEssenceRequired)}</Row>
			<Row label={t("tree.perHour")}>{formatNumber(current.lifeEssencePerHour)}</Row>
			<Row label={t("tree.buff")}>
				{view.buffKnown ? (
					t("card.buffValue", { value: current.buff.value, stat: current.buff.stat })
				) : (
					<span className="text-muted font-sans">{t("card.unknown")}</span>
				)}
			</Row>
			<span className="text-muted text-xs">
				{next
					? t("tree.next", {
							level: formatNumber(next.level),
							prosperity: formatNumber(next.prosperityRequired),
							essence: formatNumber(next.lifeEssenceRequired),
						})
					: t("tree.highest")}
			</span>
		</CardFrame>
	);
}

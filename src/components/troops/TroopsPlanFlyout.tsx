"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatDateTime, formatNumber } from "@/lib/format";
import { exportSpecOf, hasExportLines } from "@/service/troopExport";
import {
	draftOfSavedPlan,
	runTroopsPlan,
	troopSpeedupStock,
	troopsStockChecks,
} from "@/service/troopsPlan";
import type { TroopsPlanDraft } from "@/service/troopsPlan";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { AddTroop, CapacityAndSpeed, RunCard } from "./TroopsPlanControls";
import { TroopsPlanResultCard } from "./TroopsPlanResult";

interface TroopsPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (draft: TroopsPlanDraft) => void;
}

export function TroopsPlanFlyout({ open, chief, onClose, onSave }: TroopsPlanFlyoutProps) {
	const t = useTranslations("troops.plan");
	const [wasOpen, setWasOpen] = useState(false);
	const [draft, setDraft] = useState<TroopsPlanDraft>(() => draftOfSavedPlan(chief));

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setDraft(draftOfSavedPlan(chief));
	}

	const savedAt = chief.troopsPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs max-lg:w-full lg:me-auto">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							{t("saved", { date: formatDateTime(savedAt) })}
						</span>
					)}
					<Button className="max-lg:flex-1" onClick={onClose}>
						{t("close")}
					</Button>
					<Button
						variant="primary"
						className="max-lg:flex-2"
						onClick={() => onSave(draft)}
					>
						{t("save")}
					</Button>
				</>
			}
		>
			<PlanBody chief={chief} draft={draft} onDraftChange={setDraft} />
		</Flyout>
	);
}

function PlanBody({
	chief,
	draft,
	onDraftChange,
}: {
	chief: Playthrough;
	draft: TroopsPlanDraft;
	onDraftChange: (draft: TroopsPlanDraft) => void;
}) {
	const t = useTranslations("troops.plan");
	const result = useMemo(() => runTroopsPlan(chief, draft), [chief, draft]);
	const stock = troopSpeedupStock(chief);
	const spec = useMemo(() => exportSpecOf(draft, result), [draft, result]);
	const [exporting, setExporting] = useState(false);

	return (
		<>
			<AddTroop
				chief={chief}
				onAdd={(run) => onDraftChange({ ...draft, runs: [...draft.runs, run] })}
			/>
			{draft.runs.length === 0 && (
				<Card className="p-4">
					<p className="text-muted">{t("noRuns")}</p>
				</Card>
			)}
			{draft.runs.map((run, index) => (
				<RunCard
					key={index}
					chief={chief}
					run={run}
					seconds={result.runSeconds[index]}
					capacity={result.calculation.capacity}
					onChange={(next) =>
						onDraftChange({
							...draft,
							runs: draft.runs.map((item, itemIndex) =>
								itemIndex === index ? next : item
							),
						})
					}
					onRemove={() =>
						onDraftChange({
							...draft,
							runs: draft.runs.filter((_, itemIndex) => itemIndex !== index),
						})
					}
				/>
			))}
			<CapacityAndSpeed draft={draft} result={result} onDraftChange={onDraftChange} />
			{draft.runs.length > 0 && (
				<>
					<PlanStockCheck
						checks={troopsStockChecks(chief, result)}
						timeNote={t("stock.note", {
							training: formatNumber(stock.training),
							general: formatNumber(stock.general),
							used: formatNumber(result.speedupMinutesUsed),
						})}
					/>
					<TroopsPlanResultCard
						draft={draft}
						result={result}
						canExport={hasExportLines(spec)}
						onExport={() => setExporting(true)}
					/>
					<ExportToEventFlyout
						open={exporting}
						chief={chief}
						spec={spec}
						onClose={() => setExporting(false)}
					/>
				</>
			)}
		</>
	);
}

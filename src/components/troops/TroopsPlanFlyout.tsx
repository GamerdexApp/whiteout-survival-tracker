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
import type { TroopsPlanDraft, TroopsPlanResult } from "@/service/troopsPlan";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { GeneralSpeedupShare } from "@/comps/queues/GeneralSpeedupShare";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { PlanFooter } from "@/comps/ui/PlanFooter";
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
	const result = useMemo(() => runTroopsPlan(chief, draft), [chief, draft]);
	const spec = useMemo(() => exportSpecOf(draft, result), [draft, result]);
	const canExport = hasExportLines(spec);
	const [exporting, setExporting] = useState(false);

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<PlanFooter
					savedText={savedAt ? t("saved", { date: formatDateTime(savedAt) }) : undefined}
					closeLabel={t("close")}
					onClose={onClose}
					exportAction={{
						label: t("export.button"),
						disabled: !canExport,
						title: canExport ? undefined : t("export.emptyHint"),
						onClick: () => setExporting(true),
					}}
					saveLabel={t("save")}
					onSave={() => onSave(draft)}
				/>
			}
		>
			<PlanBody chief={chief} draft={draft} result={result} onDraftChange={setDraft} />
			<ExportToEventFlyout
				open={exporting}
				chief={chief}
				spec={spec}
				onClose={() => setExporting(false)}
			/>
		</Flyout>
	);
}

function PlanBody({
	chief,
	draft,
	result,
	onDraftChange,
}: {
	chief: Playthrough;
	draft: TroopsPlanDraft;
	result: TroopsPlanResult;
	onDraftChange: (draft: TroopsPlanDraft) => void;
}) {
	const t = useTranslations("troops.plan");
	const stock = troopSpeedupStock(chief);

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
						timeExtra={<GeneralSpeedupShare chief={chief} use="troops" />}
						checks={troopsStockChecks(chief, result)}
						timeNote={t("stock.note", {
							training: formatNumber(stock.training),
							general: formatNumber(stock.general),
							used: formatNumber(result.speedupMinutesUsed),
						})}
					/>
					<TroopsPlanResultCard draft={draft} result={result} />
				</>
			)}
		</>
	);
}

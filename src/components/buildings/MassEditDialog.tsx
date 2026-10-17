"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { MassSetDraft } from "@/service/buildingMassSet";
import {
	draftBlockers,
	draftChanges,
	draftFromChief,
	lowerBlocked,
	massSetBuildings,
	raiseAllTo,
	rankLabels,
} from "@/service/buildingMassSet";
import { ageHintOf, highestUnlockedLabel, lockedFcHints } from "@/service/buildings";
import { entertainmentBuildings } from "@/data/game/buildings";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Dialog } from "@/comps/ui/Dialog";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";
import { levelStops, NOT_BUILT_VALUE } from "./stops";

interface MassEditDialogProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (draft: MassSetDraft, changeCount: number) => void;
}

const DEFAULT_RAISE_LABEL = "30";

export function MassEditDialog({ open, chief, onClose, onSave }: MassEditDialogProps) {
	const t = useTranslations("buildings");
	const [wasOpen, setWasOpen] = useState(false);
	const [draft, setDraft] = useState<MassSetDraft>(() => draftFromChief(chief));
	const [raiseLabel, setRaiseLabel] = useState(DEFAULT_RAISE_LABEL);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setDraft(draftFromChief(chief));
			setRaiseLabel(DEFAULT_RAISE_LABEL);
		}
	}

	const fcHints = useMemo(() => lockedFcHints(chief), [chief]);
	const changes = useMemo(() => draftChanges(chief, draft), [chief, draft]);
	const blockers = useMemo(() => draftBlockers(chief, draft), [chief, draft]);
	const blockedCount = Object.keys(blockers).length;
	const canSave = changes.length > 0 && blockedCount === 0;
	const changeCount = { count: changes.length, amount: formatNumber(changes.length) };

	return (
		<Dialog
			open={open}
			onClose={onClose}
			variant="wide"
			title={t("massEdit.title")}
			description={t("massEdit.description")}
			footer={
				<>
					<span className="text-muted me-auto" role="status">
						{changes.length === 0
							? t("massEdit.noChanges")
							: t("massEdit.changes", changeCount)}
					</span>
					<Button onClick={onClose}>{t("cancel")}</Button>
					<Button
						variant="primary"
						disabled={!canSave}
						onClick={() => onSave(draft, changes.length)}
					>
						{t("massEdit.set", changeCount)}
					</Button>
				</>
			}
		>
			<Card className="flex flex-col gap-3 p-4">
				<h3 className="font-semibold">{t("massEdit.raiseTitle")}</h3>
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							data-autofocus
							aria-label={t("massEdit.raiseLabel")}
							value={raiseLabel}
							onChange={(event) => setRaiseLabel(event.target.value)}
						>
							{rankLabels.map((label) => {
								const hint = ageHintOf(fcHints, label);
								return (
									<option key={label} value={label} disabled={hint !== undefined}>
										{hint ? `${label} (${hint})` : label}
									</option>
								);
							})}
						</Select>
					</div>
					<Button onClick={() => setDraft(raiseAllTo(chief, draft, raiseLabel))}>
						{t("massEdit.raiseAll")}
					</Button>
				</div>
				<p className="text-muted text-xs">{t("massEdit.raiseHint")}</p>
			</Card>

			{blockedCount > 0 && (
				<Note tone="warning" title={t("massEdit.blockedTitle")}>
					{t("massEdit.blocked", {
						count: blockedCount,
						amount: formatNumber(blockedCount),
					})}{" "}
					<button
						type="button"
						className="text-link font-medium underline"
						onClick={() => setDraft(lowerBlocked(chief, draft))}
					>
						{t("massEdit.lowerBlocked")}
					</button>
				</Note>
			)}

			<div className="flex flex-col gap-1">
				<SectionLabel className="text-muted">{t("massEdit.levels")}</SectionLabel>
				<ul>
					{massSetBuildings.map((building) => {
						const value = draft.levels[building.id];
						const saved = chief.buildings?.[building.id]?.level ?? null;
						const changed = value !== (saved ?? null);
						const blocked = blockers[building.id];
						return (
							<li
								key={building.id}
								className="border-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0"
							>
								<div className="flex min-w-0 flex-col">
									<span className="font-medium">{building.name}</span>
									{blocked ? (
										<span className="text-danger text-xs">
											{t("massEdit.needsFirst", { list: blocked.join(", ") })}
										</span>
									) : (
										changed && (
											<span className="text-muted font-mono text-xs">
												{t("massEdit.was", {
													level: saved ?? t("notBuilt"),
												})}
											</span>
										)
									)}
								</div>
								<LevelStepper
									label={t("levelOf", { name: building.name })}
									stops={levelStops(building, fcHints)}
									value={value ?? NOT_BUILT_VALUE}
									limitValue={
										highestUnlockedLabel(building, chief) ?? NOT_BUILT_VALUE
									}
									onChange={(next) =>
										setDraft({
											...draft,
											levels: {
												...draft.levels,
												[building.id]:
													next === NOT_BUILT_VALUE ? null : next,
											},
										})
									}
								/>
							</li>
						);
					})}
				</ul>
			</div>

			<div className="flex flex-col gap-1">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<SectionLabel className="text-muted">
						{t("massEdit.entertainment")}
					</SectionLabel>
					<span className="flex gap-2">
						<Button
							onClick={() =>
								setDraft({
									...draft,
									built: Object.fromEntries(
										entertainmentBuildings.map((building) => [
											building.id,
											true,
										])
									),
								})
							}
						>
							{t("massEdit.markAllBuilt")}
						</Button>
						<Button
							onClick={() =>
								setDraft({
									...draft,
									built: Object.fromEntries(
										entertainmentBuildings.map((building) => [
											building.id,
											false,
										])
									),
								})
							}
						>
							{t("massEdit.clearAll")}
						</Button>
					</span>
				</div>
				<ul>
					{entertainmentBuildings.map((building) => (
						<li
							key={building.id}
							className="border-line flex items-center justify-between gap-3 border-t-[1.5px] py-2 first:border-t-0"
						>
							<div className="flex min-w-0 flex-col">
								<span className="font-medium">{building.name}</span>
								{blockers[building.id] && (
									<span className="text-danger text-xs">
										{t("massEdit.needsFirst", {
											list: blockers[building.id].join(", "),
										})}
									</span>
								)}
							</div>
							<Switch
								label={t("entry.builtSwitch", { name: building.name })}
								checked={draft.built[building.id]}
								onChange={(built) =>
									setDraft({
										...draft,
										built: { ...draft.built, [building.id]: built },
									})
								}
							/>
						</li>
					))}
				</ul>
			</div>

			<p className="text-muted">{t("massEdit.footnote")}</p>
		</Dialog>
	);
}

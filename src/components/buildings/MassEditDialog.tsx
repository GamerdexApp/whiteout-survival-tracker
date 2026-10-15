"use client";

import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
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

	const changes = useMemo(() => draftChanges(chief, draft), [chief, draft]);
	const blockers = useMemo(() => draftBlockers(chief, draft), [chief, draft]);
	const blockedCount = Object.keys(blockers).length;
	const canSave = changes.length > 0 && blockedCount === 0;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			variant="wide"
			title="Mass edit buildings"
			description="Set many buildings at once. Nothing is saved until you press Set buildings."
			footer={
				<>
					<span className="text-muted mr-auto" role="status">
						{changes.length === 0
							? "No changes yet"
							: `${changes.length} ${changes.length === 1 ? "building changes" : "buildings change"}`}
					</span>
					<Button onClick={onClose}>Cancel</Button>
					<Button
						variant="primary"
						disabled={!canSave}
						onClick={() => onSave(draft, changes.length)}
					>
						Set {changes.length} {changes.length === 1 ? "building" : "buildings"}
					</Button>
				</>
			}
		>
			<Card className="flex flex-col gap-3 p-4">
				<h3 className="font-semibold">Raise every building to a level</h3>
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							data-autofocus
							aria-label="Raise all buildings to level"
							value={raiseLabel}
							onChange={(event) => setRaiseLabel(event.target.value)}
						>
							{rankLabels.map((label) => (
								<option key={label} value={label}>
									{label}
								</option>
							))}
						</Select>
					</div>
					<Button onClick={() => setDraft(raiseAllTo(draft, raiseLabel))}>
						Raise all
					</Button>
				</div>
				<p className="text-muted text-xs">
					Each building goes up to its highest level at or below this one. A building that
					is already higher stays, and one that starts later stays not built. Goals are
					not changed.
				</p>
			</Card>

			{blockedCount > 0 && (
				<Note tone="warning" title="Some buildings need another building first.">
					{blockedCount} {blockedCount === 1 ? "building is" : "buildings are"} above what
					its requirements allow.{" "}
					<button
						type="button"
						className="text-link font-medium underline"
						onClick={() => setDraft(lowerBlocked(chief, draft))}
					>
						Lower them to what is allowed
					</button>
				</Note>
			)}

			<div className="flex flex-col gap-1">
				<SectionLabel className="text-muted">Levels</SectionLabel>
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
											Needs {blocked.join(", ")} first
										</span>
									) : (
										changed && (
											<span className="text-muted font-mono text-xs">
												was {saved ?? "Not built"}
											</span>
										)
									)}
								</div>
								<LevelStepper
									label={`${building.name} level`}
									stops={levelStops(building)}
									value={value ?? NOT_BUILT_VALUE}
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
					<SectionLabel className="text-muted">Entertainment</SectionLabel>
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
							Mark all built
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
							Clear all
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
										Needs {blockers[building.id].join(", ")} first
									</span>
								)}
							</div>
							<Switch
								label={`${building.name} built`}
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

			<p className="text-muted">
				Mass edit changes saved levels only. It never lowers a level on its own and never
				changes goals. Shelters have a level each, so set them with the Shelters button, and
				set the Hero Hall on the Facilities tab.
			</p>
		</Dialog>
	);
}

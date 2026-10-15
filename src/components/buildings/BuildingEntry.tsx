"use client";

import { formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import type { BuildingView } from "@/service/buildings";
import { buildingNotes, isEntertainment, SHELTER_ID } from "@/data/game/buildings";
import { Button } from "@/comps/ui/Button";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { BuildingIcon } from "./BuildingIcon";
import { levelStops, NOT_BUILT_VALUE } from "./stops";

export interface BuildingEntryProps {
	view: BuildingView;
	onLevelChange: (buildingId: string, level: string | null) => void;
	onBuiltChange: (buildingId: string, built: boolean) => void;
	onOpenLevels: (buildingId: string) => void;
	onOpenShelters: () => void;
}

export const DESKTOP_COLUMNS = "grid-cols-[minmax(0,1.6fr)_176px_72px_128px_minmax(0,1.4fr)_80px]";

const levelledSubline = (view: BuildingView) => {
	const { building } = view;
	const note = buildingNotes[building.id];
	const size = `Max ${building.maxLevelLabel} · ${building.levels.length} levels`;
	return note ? `${note} · ${size}` : size;
};

const subline = (view: BuildingView) =>
	isEntertainment(view.building)
		? `Single build · ${formatNumber(view.building.levels[0].power)} power`
		: levelledSubline(view);

const progressText = (view: BuildingView) => {
	if (view.lockedBy) return `Requires ${view.lockedBy}`;
	if (isEntertainment(view.building)) {
		return view.needs.length > 0 ? `Requires ${view.needs.join(", ")}` : "No requirements";
	}
	if (view.maxed && view.built) return "Max level";
	if (view.blockedBy.length > 0) return `Blocked: needs ${view.blockedBy.join(", ")}`;
	return view.needs.length > 0 ? `Needs ${view.needs.join(", ")}` : "No other requirements";
};

const powerText = (view: BuildingView) => (view.power === null ? "None" : formatNumber(view.power));

const developmentText = (view: BuildingView) =>
	view.developmentIndex === null ? "None" : formatNumber(view.developmentIndex);

function Name({ view }: { view: BuildingView }) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<BuildingIcon view={view} />
			<div className="flex min-w-0 flex-col">
				<h3 className="font-semibold">{view.building.name}</h3>
				<span className="text-muted text-xs">{subline(view)}</span>
			</div>
		</div>
	);
}

function GoalText({ view }: { view: BuildingView }) {
	if (view.hasGoal)
		return <span className="text-primary font-mono font-medium">{view.goal}</span>;
	return <span className="text-muted font-mono">{view.level ?? "None"}</span>;
}

function BuiltSwitch({ view, onBuiltChange }: Pick<BuildingEntryProps, "view" | "onBuiltChange">) {
	return (
		<div className="flex items-center gap-3">
			<Switch
				label={`${view.building.name} built`}
				checked={view.built}
				disabled={view.lockedBy !== null}
				onChange={(built) => onBuiltChange(view.building.id, built)}
			/>
			<span className="font-medium">{view.built ? "Built" : "Not built"}</span>
		</div>
	);
}

function ShelterSummary({
	view,
	onOpenShelters,
}: Pick<BuildingEntryProps, "view" | "onOpenShelters">) {
	return (
		<div className="flex flex-col items-start gap-1">
			<span className="font-mono text-xs">
				{view.held.length === 0 ? "None built" : view.held.join(" · ")}
			</span>
			<Button onClick={onOpenShelters} aria-label="Edit shelter levels">
				Shelters ({view.held.length})
			</Button>
		</div>
	);
}

function Stepper({ view, onLevelChange }: Pick<BuildingEntryProps, "view" | "onLevelChange">) {
	return (
		<LevelStepper
			label={`${view.building.name} level`}
			stops={levelStops(view.building)}
			value={view.level ?? NOT_BUILT_VALUE}
			disabled={view.lockedBy !== null}
			limitValue={view.reachable ?? NOT_BUILT_VALUE}
			onChange={(value) =>
				onLevelChange(view.building.id, value === NOT_BUILT_VALUE ? null : value)
			}
		/>
	);
}

function CurrentControl({
	view,
	onLevelChange,
	onOpenShelters,
}: Pick<BuildingEntryProps, "view" | "onLevelChange" | "onOpenShelters">) {
	return view.building.id === SHELTER_ID ? (
		<ShelterSummary view={view} onOpenShelters={onOpenShelters} />
	) : (
		<Stepper view={view} onLevelChange={onLevelChange} />
	);
}

export function BuildingEntry(props: BuildingEntryProps) {
	const isDesktop = useIsDesktop();
	const { view, onLevelChange, onBuiltChange, onOpenLevels, onOpenShelters } = props;
	const entertainment = isEntertainment(view.building);
	const dimmed = view.lockedBy ? "opacity-70" : "";
	const levelsButton = (
		<Button
			onClick={() => onOpenLevels(view.building.id)}
			aria-label={`Levels of ${view.building.name}`}
		>
			Levels
		</Button>
	);

	if (isDesktop) {
		return (
			<li
				className={`border-line grid ${DESKTOP_COLUMNS} items-center gap-3 border-t-[1.5px] px-4 py-3 ${dimmed}`}
			>
				<Name view={view} />
				<div>
					{entertainment ? (
						<BuiltSwitch view={view} onBuiltChange={onBuiltChange} />
					) : (
						<CurrentControl
							view={view}
							onLevelChange={onLevelChange}
							onOpenShelters={onOpenShelters}
						/>
					)}
				</div>
				<div>{!entertainment && <GoalText view={view} />}</div>
				<div className="flex flex-col font-mono">
					<span className="font-medium">{powerText(view)}</span>
					<span className="text-muted text-xs">Dev. index {developmentText(view)}</span>
				</div>
				<div className="flex min-w-0 flex-col gap-1.5">
					{!entertainment && (
						<ProgressBar
							value={view.progress}
							label={`${view.building.name} progress`}
						/>
					)}
					<span className="text-muted text-xs">{progressText(view)}</span>
				</div>
				<div className="flex justify-end">{levelsButton}</div>
			</li>
		);
	}

	return (
		<li
			className={`border-line bg-surface flex flex-col gap-3 rounded-md border-[1.5px] p-3 ${dimmed}`}
		>
			<div className="flex items-start justify-between gap-3">
				<Name view={view} />
				{levelsButton}
			</div>
			{entertainment ? (
				<BuiltSwitch view={view} onBuiltChange={onBuiltChange} />
			) : (
				<div className="flex items-end justify-between gap-3">
					<div className="flex flex-col gap-1">
						<SectionLabel className="text-muted">Current</SectionLabel>
						<CurrentControl
							view={view}
							onLevelChange={onLevelChange}
							onOpenShelters={onOpenShelters}
						/>
					</div>
					<div className="flex flex-col items-end gap-1 pb-2.5">
						<SectionLabel className="text-muted">Goal</SectionLabel>
						<GoalText view={view} />
					</div>
				</div>
			)}
			{!entertainment && (
				<ProgressBar value={view.progress} label={`${view.building.name} progress`} />
			)}
			<span className="text-muted">{progressText(view)}</span>
			<span className="text-muted font-mono text-xs">
				Power {powerText(view)} · Dev. index {developmentText(view)}
			</span>
		</li>
	);
}

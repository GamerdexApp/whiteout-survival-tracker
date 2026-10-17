"use client";

import { useTranslations } from "next-intl";
import type { ConstructionJob } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import type { AgeHints, BuildingView } from "@/service/buildings";
import { buildingNoteIds, isEntertainment, SHELTER_ID } from "@/data/game/buildings";
import { TimeLeftPill } from "@/comps/queues/TimeLeftPill";
import { Button } from "@/comps/ui/Button";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { BuildingIcon } from "./BuildingIcon";
import { levelStops, NOT_BUILT_VALUE } from "./stops";

export interface BuildingEntryProps {
	view: BuildingView;
	fcHints: AgeHints;
	onLevelChange: (buildingId: string, level: string | null) => void;
	onBuiltChange: (buildingId: string, built: boolean) => void;
	onOpenLevels: (buildingId: string) => void;
	onOpenShelters: () => void;
	job: ConstructionJob | undefined;
	canStart: boolean;
	onStartUpgrade: (buildingId: string) => void;
	onManageUpgrade: (builder: number) => void;
}

export const DESKTOP_COLUMNS =
	"grid-cols-[minmax(0,1.6fr)_176px_72px_128px_minmax(0,1.4fr)_104px_80px]";

type Translate = ReturnType<typeof useTranslations<"buildings">>;

const levelledSubline = (view: BuildingView, t: Translate) => {
	const { building } = view;
	const noteId = buildingNoteIds.find((id) => id === building.id);
	const size = t("entry.subline.size", {
		max: building.maxLevelLabel,
		count: formatNumber(building.levels.length),
	});
	return noteId ? t("entry.subline.withNote", { note: t(`entry.notes.${noteId}`), size }) : size;
};

const subline = (view: BuildingView, t: Translate) =>
	isEntertainment(view.building)
		? t("entry.subline.single", { power: formatNumber(view.building.levels[0].power) })
		: levelledSubline(view, t);

const progressText = (view: BuildingView, t: Translate) => {
	if (view.lockedBy) return t("entry.progress.requires", { list: view.lockedBy });
	if (view.levelAgeLock && view.level) {
		return t("entry.progress.levelAgeLocked", { level: view.level, text: view.levelAgeLock });
	}
	if (view.goalAgeLock && view.goal) {
		return t("entry.progress.goalAgeLocked", { goal: view.goal, text: view.goalAgeLock });
	}
	if (isEntertainment(view.building)) {
		return view.needs.length > 0
			? t("entry.progress.requires", { list: view.needs.join(", ") })
			: t("entry.progress.noRequirements");
	}
	if (view.maxed && view.built) return t("entry.progress.maxLevel");
	if (view.blockedBy.length > 0) {
		return t("entry.progress.blocked", { list: view.blockedBy.join(", ") });
	}
	if (view.nextAgeLock && view.next) {
		return t("entry.progress.nextAgeLocked", {
			level: view.next.label,
			text: view.nextAgeLock,
		});
	}
	return view.needs.length > 0
		? t("entry.progress.needs", { list: view.needs.join(", ") })
		: t("noOtherRequirements");
};

const powerText = (view: BuildingView, t: Translate) =>
	view.power === null ? t("none") : formatNumber(view.power);

const developmentText = (view: BuildingView, t: Translate) =>
	view.developmentIndex === null ? t("none") : formatNumber(view.developmentIndex);

function Name({ view }: { view: BuildingView }) {
	const t = useTranslations("buildings");
	return (
		<div className="flex min-w-0 items-center gap-3">
			<BuildingIcon view={view} />
			<div className="flex min-w-0 flex-col">
				<h3 className="font-semibold">{view.building.name}</h3>
				<span className="text-muted text-xs">{subline(view, t)}</span>
			</div>
		</div>
	);
}

function GoalText({ view }: { view: BuildingView }) {
	const t = useTranslations("buildings");
	if (view.hasGoal)
		return <span className="text-primary font-mono font-medium">{view.goal}</span>;
	return <span className="text-muted font-mono">{view.level ?? t("none")}</span>;
}

function BuiltSwitch({ view, onBuiltChange }: Pick<BuildingEntryProps, "view" | "onBuiltChange">) {
	const t = useTranslations("buildings");
	return (
		<div className="flex items-center gap-3">
			<Switch
				label={t("entry.builtSwitch", { name: view.building.name })}
				checked={view.built}
				disabled={view.lockedBy !== null}
				onChange={(built) => onBuiltChange(view.building.id, built)}
			/>
			<span className="font-medium">{view.built ? t("built") : t("notBuilt")}</span>
		</div>
	);
}

function ShelterSummary({
	view,
	onOpenShelters,
}: Pick<BuildingEntryProps, "view" | "onOpenShelters">) {
	const t = useTranslations("buildings");
	return (
		<div className="flex flex-col items-start gap-1">
			<span className="font-mono text-xs">
				{view.held.length === 0 ? t("entry.shelters.none") : view.held.join(" · ")}
			</span>
			<Button
				onClick={onOpenShelters}
				aria-label={t("entry.shelters.editLabel", {
					count: formatNumber(view.held.length),
				})}
			>
				{t("entry.shelters.button", { count: formatNumber(view.held.length) })}
			</Button>
		</div>
	);
}

function Stepper({
	view,
	fcHints,
	onLevelChange,
}: Pick<BuildingEntryProps, "view" | "fcHints" | "onLevelChange">) {
	const t = useTranslations("buildings");
	return (
		<LevelStepper
			label={t("levelOf", { name: view.building.name })}
			stops={levelStops(view.building, fcHints)}
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
	fcHints,
	onLevelChange,
	onOpenShelters,
}: Pick<BuildingEntryProps, "view" | "fcHints" | "onLevelChange" | "onOpenShelters">) {
	return view.building.id === SHELTER_ID ? (
		<ShelterSummary view={view} onOpenShelters={onOpenShelters} />
	) : (
		<Stepper view={view} fcHints={fcHints} onLevelChange={onLevelChange} />
	);
}

export function BuildingEntry(props: BuildingEntryProps) {
	const t = useTranslations("buildings");
	const isDesktop = useIsDesktop();
	const {
		view,
		fcHints,
		onLevelChange,
		onBuiltChange,
		onOpenLevels,
		onOpenShelters,
		job,
		canStart,
		onStartUpgrade,
		onManageUpgrade,
	} = props;
	const entertainment = isEntertainment(view.building);
	const locked = view.lockedBy !== null;
	const levelsButton = (
		<Button
			onClick={() => onOpenLevels(view.building.id)}
			aria-label={t("entry.levelsLabel", { name: view.building.name })}
		>
			{t("entry.levels")}
		</Button>
	);

	const upgrade = job ? (
		<TimeLeftPill
			job={job}
			label={t("entry.upgrading", { name: view.building.name })}
			onClick={() => onManageUpgrade(job.builder)}
			fullWidth={!isDesktop}
		/>
	) : canStart ? (
		<Button
			className={isDesktop ? "" : "w-full"}
			onClick={() => onStartUpgrade(view.building.id)}
			aria-label={t("entry.startLabel", { name: view.building.name })}
		>
			{isDesktop ? t("entry.start") : t("entry.startUpgrade")}
		</Button>
	) : null;

	if (isDesktop) {
		return (
			<li
				className={`border-line grid ${DESKTOP_COLUMNS} items-center gap-3 border-t-[1.5px] px-4 py-3 ${locked ? "bg-tint" : ""}`}
			>
				<Name view={view} />
				<div>
					{entertainment ? (
						<BuiltSwitch view={view} onBuiltChange={onBuiltChange} />
					) : (
						<CurrentControl
							view={view}
							fcHints={fcHints}
							onLevelChange={onLevelChange}
							onOpenShelters={onOpenShelters}
						/>
					)}
				</div>
				<div>{!entertainment && <GoalText view={view} />}</div>
				<div className="flex flex-col font-mono">
					<span className="font-medium">{powerText(view, t)}</span>
					<span className="text-muted text-xs">
						{t("entry.devIndex", { value: developmentText(view, t) })}
					</span>
				</div>
				<div className="flex min-w-0 flex-col gap-1.5">
					{!entertainment && (
						<ProgressBar
							value={view.progress}
							label={t("entry.progressLabel", { name: view.building.name })}
						/>
					)}
					<span className="text-muted text-xs">{progressText(view, t)}</span>
				</div>
				<div className="flex justify-end">{upgrade}</div>
				<div className="flex justify-end">{levelsButton}</div>
			</li>
		);
	}

	return (
		<li
			className={`border-line ${locked ? "bg-tint border-dashed" : "bg-surface"} flex flex-col gap-3 rounded-md border-[1.5px] p-3`}
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
						<SectionLabel className="text-muted">{t("columns.current")}</SectionLabel>
						<CurrentControl
							view={view}
							fcHints={fcHints}
							onLevelChange={onLevelChange}
							onOpenShelters={onOpenShelters}
						/>
					</div>
					<div className="flex flex-col items-end gap-1 pb-2.5">
						<SectionLabel className="text-muted">{t("columns.goal")}</SectionLabel>
						<GoalText view={view} />
					</div>
				</div>
			)}
			{!entertainment && (
				<ProgressBar
					value={view.progress}
					label={t("entry.progressLabel", { name: view.building.name })}
				/>
			)}
			<span className="text-muted">{progressText(view, t)}</span>
			<span className="text-muted font-mono text-xs">
				{t("entry.powerLine", {
					power: powerText(view, t),
					index: developmentText(view, t),
				})}
			</span>
			{upgrade}
		</li>
	);
}

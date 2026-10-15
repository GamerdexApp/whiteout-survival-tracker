"use client";

import type { BuildingLevel } from "whiteout-survival-data";
import { formatDuration, formatNumber } from "@/lib/format";
import type { BuildingView } from "@/service/buildings";
import { findBuildingById } from "@/data/game/buildings";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemChip } from "@/comps/ui/ItemChip";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { BuildingIcon } from "./BuildingIcon";

const LEVELS_SHOWN = 5;

const capacityFields = [
	"infirmaryCapacity",
	"trainingCapacity",
	"storehouseCapacity",
	"rallyCapacity",
	"reinforceCapacity",
	"barricadeDurability",
	"troopDeploymentCapacity",
] as const;

const capacityOf = (level: BuildingLevel) => {
	const field = capacityFields.find((name) => level[name] !== undefined);
	return field ? level[field] : undefined;
};

const requirementsOf = (level: BuildingLevel) =>
	(level.prerequisites ?? []).map((item) => `${item.building} ${item.level}`).join(", ");

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Card className="bg-tint flex flex-col gap-0.5 px-3 py-2">
			<span className="text-muted text-xs">{label}</span>
			<span className="font-mono font-medium">{children}</span>
		</Card>
	);
}

interface LevelsFlyoutProps {
	view: BuildingView | null;
	onClose: () => void;
}

export function LevelsFlyout({ view, onClose }: LevelsFlyoutProps) {
	const building = view ? findBuildingById(view.building.id) : undefined;

	return (
		<Flyout
			open={view !== null}
			onClose={onClose}
			title={building?.name ?? "Levels"}
			description={
				building
					? `${building.category} · Max ${building.maxLevelLabel} · ${building.levels.length} levels`
					: undefined
			}
			footer={<Button onClick={onClose}>Close</Button>}
		>
			{view && building && <LevelsContent view={view} />}
		</Flyout>
	);
}

function LevelsContent({ view }: { view: BuildingView }) {
	const { building } = view;
	const upcoming = building.levels
		.filter((level) => level.order > view.order)
		.slice(0, LEVELS_SHOWN);
	const hasCapacity = building.levels.some((level) => capacityOf(level) !== undefined);
	const capacityMissing =
		hasCapacity && upcoming.some((level) => capacityOf(level) === undefined);

	return (
		<>
			<div className="flex items-start gap-3">
				<BuildingIcon view={view} />
				<p className="text-muted">
					{building.description ?? "No description in the data yet."}
				</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-3">
				<Fact label="Current level">{view.level ?? "Not built"}</Fact>
				<Fact label="Goal level">
					{view.hasGoal ? <span className="text-primary">{view.goal}</span> : "No goal"}
				</Fact>
				<Fact label="Next level needs">
					<span className="font-sans">
						{view.needs.length > 0 ? view.needs.join(", ") : "No other requirements"}
					</span>
				</Fact>
			</div>
			<Card className="border-dashed p-3">
				<p className="text-muted">
					This table lists only the levels after your current one, since those are done.
				</p>
			</Card>
			{upcoming.length === 0 ? (
				<p className="font-medium">Max level. Nothing is left to upgrade.</p>
			) : (
				<div className="flex flex-col gap-2">
					<h3 className="font-medium">
						{view.level ? `Next levels after ${view.level}` : "First levels"}
					</h3>
					<Card className="overflow-hidden">
						<div
							className={`border-line hidden gap-3 border-b-[1.5px] px-3 py-2 lg:grid ${
								hasCapacity
									? "grid-cols-[1fr_1fr_1fr_1fr_1.6fr]"
									: "grid-cols-[1fr_1fr_1fr_1.6fr]"
							}`}
						>
							<SectionLabel className="text-muted">Level</SectionLabel>
							<SectionLabel className="text-muted">Time</SectionLabel>
							<SectionLabel className="text-muted">Power</SectionLabel>
							{hasCapacity && (
								<SectionLabel className="text-muted">Capacity</SectionLabel>
							)}
							<SectionLabel className="text-muted">Requires</SectionLabel>
						</div>
						<ul>
							{upcoming.map((level) => {
								const capacity = capacityOf(level);
								return (
									<li
										key={level.id}
										className="border-line flex flex-col gap-2 border-t-[1.5px] px-3 py-3 first:border-t-0"
									>
										<div
											className={`grid items-start gap-3 ${
												hasCapacity
													? "grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1.6fr]"
													: "grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.6fr]"
											}`}
										>
											<span className="font-mono font-semibold">
												{level.label}
											</span>
											<span>{formatDuration(level.buildTimeSeconds)}</span>
											<span>{formatNumber(level.power)}</span>
											{hasCapacity && (
												<span
													className={
														capacity === undefined ? "text-muted" : ""
													}
												>
													{capacity === undefined
														? "Unknown"
														: formatNumber(capacity)}
												</span>
											)}
											<span className="text-muted col-span-2 text-xs lg:col-span-1">
												{requirementsOf(level) || "None"}
											</span>
										</div>
										<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
											{view.goal === level.label && view.hasGoal && (
												<span className="text-primary border-primary rounded-full border-[1.5px] px-2 py-0.5 font-mono text-[11px] uppercase">
													Goal
												</span>
											)}
											{level.cost.map((cost) => (
												<ItemChip
													key={cost.name}
													itemId={cost.itemId}
													name={cost.name}
													count={cost.count}
												/>
											))}
										</div>
									</li>
								);
							})}
						</ul>
					</Card>
					{capacityMissing && (
						<p className="text-muted text-xs">
							Capacity is only set on tier base rows in the package, so sub-levels
							show Unknown.
						</p>
					)}
				</div>
			)}
		</>
	);
}

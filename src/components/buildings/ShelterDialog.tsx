"use client";

import { LuPlus } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
	findLevel,
	levelOrder,
	reachableLevel,
	shelterLevels,
	shelterRequirements,
} from "@/service/buildings";
import { MAX_SHELTERS, shelter } from "@/data/game/buildings";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { levelStops } from "./stops";

interface ShelterDialogProps {
	open: boolean;
	chief: Playthrough;
	locked: boolean;
	onClose: () => void;
	onChange: (levels: string[]) => void;
}

const builtStops = levelStops(shelter).slice(1);

export function ShelterDialog({ open, chief, locked, onClose, onChange }: ShelterDialogProps) {
	const levels = shelterLevels(chief.buildings?.shelter);
	const requirements = shelterRequirements(levels);
	const firstLevel = builtStops[0].value;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title="Shelters"
			description={`Up to ${MAX_SHELTERS} can be built. Set the level of each one.`}
			footer={<Button onClick={onClose}>Close</Button>}
		>
			{levels.length === 0 ? (
				<p className="text-muted">
					{locked
						? "The Shelter is still locked by your Furnace level."
						: "No shelters yet."}
				</p>
			) : (
				<ul className="flex flex-col">
					{levels.map((level, index) => (
						<li
							key={index}
							className="border-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0"
						>
							<div className="flex flex-col">
								<span className="font-medium">Shelter {index + 1}</span>
								<span className="text-muted font-mono text-xs">
									Power {formatNumber(findLevel(shelter, level)?.power ?? 0)}
								</span>
							</div>
							<LevelStepper
								label={`Shelter ${index + 1} level`}
								stops={builtStops}
								value={level}
								limitValue={
									reachableLevel(shelter, levelOrder(shelter, level), chief) ??
									level
								}
								onChange={(next) =>
									onChange(
										levels.map((item, position) =>
											position === index ? next : item
										)
									)
								}
							/>
						</li>
					))}
				</ul>
			)}
			<div className="flex flex-wrap gap-3">
				<Button
					variant="primary"
					disabled={locked || levels.length >= MAX_SHELTERS}
					onClick={() => onChange([...levels, firstLevel])}
				>
					<LuPlus size={16} aria-hidden="true" />
					Add shelter
				</Button>
				{levels.length > 0 && (
					<Button variant="danger" onClick={() => onChange(levels.slice(0, -1))}>
						Remove Shelter {levels.length}
					</Button>
				)}
			</div>
			{levels.length >= MAX_SHELTERS && (
				<p className="text-muted">All {MAX_SHELTERS} shelters are built.</p>
			)}
			{requirements.length > 0 && (
				<div className="flex flex-col gap-1">
					<h3 className="font-medium">What your Furnace needs from shelters</h3>
					<ul className="flex flex-col gap-0.5">
						{requirements.map((item) => (
							<li key={item.furnaceLevel} className="text-muted">
								Furnace {item.furnaceLevel} needs Shelter {item.shelterNumber} at
								level {item.level}.{" "}
								<span className="text-ink font-medium">
									{item.met ? "Met." : "Not met."}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
			<p className="text-muted">
				The Plan and the progress bar use your lowest shelter, the next one to upgrade.
			</p>
		</Dialog>
	);
}

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { facilityCodeOf, facilitySpots } from "@/service/allianceFacilities";
import { facilities, fortresses, MAP_GRID_STEP, MAP_SIZE } from "@/data/game/alliance";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const SPOTS = facilitySpots();

const percentOf = (value: number) => `${(value / MAP_SIZE) * 100}%`;

const numberOf = (name: string) => name.split(" ").pop() ?? name;

const GRID_SIZE = `${(MAP_GRID_STEP / MAP_SIZE) * 100}%`;

const GRID_LINES =
	"linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)";

function Layer({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label className="flex min-h-11 cursor-pointer items-center gap-2 lg:min-h-8">
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="size-4"
			/>
			{label}
		</label>
	);
}

export function FacilityMap() {
	const t = useTranslations("facilities.map");
	const tf = useTranslations("facilities.fortress");
	const [highlightId, setHighlightId] = useState(facilities[0].id);
	const [showFacilities, setShowFacilities] = useState(true);
	const [showStrongholds, setShowStrongholds] = useState(true);
	const [showFortresses, setShowFortresses] = useState(true);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = fortresses.find((structure) => structure.id === selectedId);
	const strongholdCount = fortresses.filter((item) => item.kind === "stronghold").length;
	const fortressCount = fortresses.filter((item) => item.kind === "fortress").length;

	const isShown = (kind: string) => (kind === "fortress" ? showFortresses : showStrongholds);

	return (
		<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2">
					<SectionLabel className="text-muted">{t("highlight")}</SectionLabel>
					<div role="group" aria-label={t("highlight")} className="flex flex-wrap gap-2">
						{facilities.map((facility) => (
							<button
								key={facility.id}
								type="button"
								aria-pressed={highlightId === facility.id}
								onClick={() => setHighlightId(facility.id)}
								className={`min-h-11 rounded-full border-[1.5px] px-3 font-medium lg:min-h-8 ${highlightId === facility.id ? "border-primary bg-tint text-primary" : "border-line bg-surface hover:bg-tint"}`}
							>
								{facility.name}
							</button>
						))}
					</div>
				</div>
				<div
					role="group"
					aria-label={t("mapLabel")}
					style={{
						backgroundImage: GRID_LINES,
						backgroundSize: `${GRID_SIZE} ${GRID_SIZE}`,
					}}
					className="border-line bg-tint relative aspect-square w-full overflow-hidden rounded-md border-[1.5px]"
				>
					{showFacilities &&
						SPOTS.map((spot) => {
							const lit = spot.facilityId === highlightId;
							const name =
								facilities.find((item) => item.id === spot.facilityId)?.name ??
								spot.code;
							return (
								<span
									key={spot.key}
									role="img"
									aria-label={t("spotLabel", {
										name,
										level: formatNumber(spot.level),
										x: formatNumber(spot.x),
										y: formatNumber(spot.y),
									})}
									style={{ left: percentOf(spot.x), top: percentOf(spot.y) }}
									className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-sm border px-0.5 font-mono text-[8px] leading-4 font-semibold sm:text-[10px] ${lit ? "border-primary bg-primary text-on-primary z-[1]" : "border-muted bg-surface text-ink"}`}
								>
									{`${spot.code}${spot.level}`}
								</span>
							);
						})}
					{fortresses
						.filter((structure) => isShown(structure.kind))
						.map((structure) => {
							const label =
								structure.kind === "castle"
									? tf("kind.castle")
									: structure.kind === "stronghold"
										? `S${numberOf(structure.name)}`
										: numberOf(structure.name);
							const shape =
								structure.kind === "fortress"
									? "size-5 rounded-full sm:size-7"
									: structure.kind === "castle"
										? "h-8 w-10 rounded-sm sm:h-12 sm:w-16"
										: "size-6 rounded-sm sm:size-8";
							return (
								<button
									key={structure.id}
									type="button"
									aria-label={t("structureLabel", {
										name: structure.name,
										x: formatNumber(structure.x),
										y: formatNumber(structure.y),
									})}
									aria-pressed={selectedId === structure.id}
									onClick={() => setSelectedId(structure.id)}
									style={{
										left: percentOf(structure.x),
										top: percentOf(structure.y),
									}}
									className={`bg-surface text-ink absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border-[1.5px] font-mono text-[9px] font-semibold sm:text-xs ${shape} ${selectedId === structure.id ? "border-primary ring-primary ring-2" : "border-ink"}`}
								>
									{structure.kind === "castle" ? (
										<span className="max-sm:hidden">{label}</span>
									) : (
										label
									)}
									{structure.kind === "castle" && (
										<span className="sm:hidden">{label.slice(0, 1)}</span>
									)}
								</button>
							);
						})}
				</div>
				<p className="text-muted text-xs">
					{t("note", {
						size: formatNumber(MAP_SIZE),
						step: formatNumber(MAP_GRID_STEP),
					})}
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<SectionLabel className="text-muted">{t("layers")}</SectionLabel>
					<Layer
						label={t("layerFacilities")}
						checked={showFacilities}
						onChange={setShowFacilities}
					/>
					<Layer
						label={t("layerStrongholds")}
						checked={showStrongholds}
						onChange={setShowStrongholds}
					/>
					<Layer
						label={t("layerFortresses")}
						checked={showFortresses}
						onChange={setShowFortresses}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<SectionLabel className="text-muted">
						{t("spotsHeading", { count: formatNumber(SPOTS.length) })}
					</SectionLabel>
					<ul className="flex flex-wrap gap-x-4 gap-y-1">
						{facilities.map((facility) => (
							<li key={facility.id} className="flex items-center gap-1.5 text-xs">
								<span className="border-muted bg-surface rounded-sm border px-1 font-mono font-semibold">
									{facilityCodeOf(facility)}
								</span>
								{t("spotLegend", {
									name: facility.name,
									count: formatNumber(
										SPOTS.filter((spot) => spot.facilityId === facility.id)
											.length
									),
								})}
							</li>
						))}
					</ul>
					<p className="text-muted text-xs">{t("codeHint")}</p>
				</div>
				<div className="flex flex-col gap-1">
					<SectionLabel className="text-muted">{t("structures")}</SectionLabel>
					<span className="text-xs">
						{t("castleStrongholdLegend", { count: formatNumber(strongholdCount) })}
					</span>
					<span className="text-xs">
						{t("fortressLegend", { count: formatNumber(fortressCount) })}
					</span>
				</div>
				<Card className="flex flex-col gap-2 p-4">
					<SectionLabel className="text-muted">{t("selected")}</SectionLabel>
					{selected ? (
						<>
							<span className="font-semibold">{selected.name}</span>
							<span className="text-muted font-mono text-xs">
								{tf("coordinates", {
									x: formatNumber(selected.x),
									y: formatNumber(selected.y),
								})}
							</span>
							{selected.rewards.length === 0 ? (
								<p className="text-muted">{tf("noRewards")}</p>
							) : (
								<ul className="grid grid-cols-2 gap-x-3 gap-y-1">
									{selected.rewards.map((entry) => (
										<li key={entry.phase} className="flex gap-2">
											<span className="text-muted font-mono">
												{formatNumber(entry.phase)}
											</span>
											<span>{entry.reward}</span>
										</li>
									))}
								</ul>
							)}
						</>
					) : (
						<p className="text-muted">{t("selectedNone")}</p>
					)}
				</Card>
			</div>
		</div>
	);
}

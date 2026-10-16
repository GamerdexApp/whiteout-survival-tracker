"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { LuPlus } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
	findLevel,
	levelOrder,
	lockedFcHints,
	reachableLevel,
	shelterLevels,
	shelterRequirements,
} from "@/service/buildings";
import { MAX_SHELTERS, shelter } from "@/data/game/buildings";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { LevelStepper } from "@/comps/ui/LevelStepper";
import { hintedStops } from "./stops";

interface ShelterDialogProps {
	open: boolean;
	chief: Playthrough;
	locked: boolean;
	onClose: () => void;
	onChange: (levels: string[]) => void;
}

export function ShelterDialog({ open, chief, locked, onClose, onChange }: ShelterDialogProps) {
	const t = useTranslations("buildings");
	const stops = useMemo(() => hintedStops(shelter, lockedFcHints(chief)), [chief]);
	const levels = shelterLevels(chief.buildings?.shelter);
	const requirements = shelterRequirements(levels);
	const firstLevel = stops[0].value;
	const maxShelters = formatNumber(MAX_SHELTERS);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={t("shelters.title")}
			description={t("shelters.description", { max: maxShelters })}
			footer={<Button onClick={onClose}>{t("close")}</Button>}
		>
			{levels.length === 0 ? (
				<p className="text-muted">{locked ? t("shelters.locked") : t("shelters.empty")}</p>
			) : (
				<ul className="flex flex-col">
					{levels.map((level, index) => (
						<li
							key={index}
							className="border-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0"
						>
							<div className="flex flex-col">
								<span className="font-medium">
									{t("shelterName", { number: formatNumber(index + 1) })}
								</span>
								<span className="text-muted font-mono text-xs">
									{t("shelters.power", {
										power: formatNumber(findLevel(shelter, level)?.power ?? 0),
									})}
								</span>
							</div>
							<LevelStepper
								label={t("levelOf", {
									name: t("shelterName", { number: formatNumber(index + 1) }),
								})}
								stops={stops}
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
					{t("shelters.add")}
				</Button>
				{levels.length > 0 && (
					<Button variant="danger" onClick={() => onChange(levels.slice(0, -1))}>
						{t("shelters.remove", { number: formatNumber(levels.length) })}
					</Button>
				)}
			</div>
			{levels.length >= MAX_SHELTERS && (
				<p className="text-muted">{t("shelters.allBuilt", { max: maxShelters })}</p>
			)}
			{requirements.length > 0 && (
				<div className="flex flex-col gap-1">
					<h3 className="font-medium">{t("shelters.furnaceNeeds")}</h3>
					<ul className="flex flex-col gap-0.5">
						{requirements.map((item) => (
							<li key={item.furnaceLevel} className="text-muted">
								{t("shelters.requirement", {
									furnaceLevel: item.furnaceLevel,
									number: formatNumber(item.shelterNumber),
									level: formatNumber(item.level),
								})}{" "}
								<span className="text-ink font-medium">
									{item.met ? t("shelters.met") : t("shelters.notMet")}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
			<p className="text-muted">{t("shelters.footnote")}</p>
		</Dialog>
	);
}

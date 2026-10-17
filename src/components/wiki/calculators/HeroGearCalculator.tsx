"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuRotateCcw } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import type { HeroGearInputs } from "@/service/calcHeroGear";
import {
	defaultHeroGearInputs,
	heroGearGoalOf,
	NO_FORGING,
	resetLevels,
} from "@/service/calcHeroGear";
import {
	calculateHeroGearPiece,
	EMPOWERMENT_FORGING_INDEX,
	forgingRows,
} from "@/data/game/calcHeroGear";
import type { HeroGearRequirement } from "@/data/game/calcHeroGear";
import { Button } from "@/comps/ui/Button";
import { Note } from "@/comps/ui/Note";
import { PieceInputs, TrackInputs } from "./herogear/GearInputs";
import {
	EventPointsCard,
	MilestonesCard,
	PieceStatsCard,
	ResourcesCard,
	SummaryTiles,
	TracksTable,
} from "./herogear/GearResults";

export function HeroGearCalculator() {
	const t = useTranslations("calcHeroGear");
	const [inputs, setInputs] = useState<HeroGearInputs>(defaultHeroGearInputs);
	const result = calculateHeroGearPiece(heroGearGoalOf(inputs));
	const empoweringWithoutForging =
		inputs.empowerment.goal > 0 && inputs.forging.goal === NO_FORGING;

	const requirementText = (requirement: HeroGearRequirement) => {
		const track = t(`tracks.${requirement.track}`);
		if ("enhancementLevel" in requirement) {
			return t("unmet.enhancement", {
				track,
				level: formatNumber(requirement.enhancementLevel),
			});
		}
		if ("masteryForgingRowId" in requirement) {
			const row = forgingRows.find((entry) => entry.id === requirement.masteryForgingRowId)!;
			return t("unmet.masteryForging", { track, row: row.name });
		}
		return t("unmet.quality", { track });
	};

	return (
		<div className="flex flex-col gap-4">
			<PieceInputs inputs={inputs} onChange={setInputs} />
			<TrackInputs inputs={inputs} onChange={setInputs} />
			<div>
				<Button onClick={() => setInputs(resetLevels(inputs))}>
					<LuRotateCcw size={16} aria-hidden="true" />
					{t("tracks.reset")}
				</Button>
			</div>
			{result.unmetRequirements.length > 0 && (
				<Note tone="warning" title={t("unmet.title")}>
					{[...result.unmetRequirements.map(requirementText), t("unmet.hint")].join(" ")}
				</Note>
			)}
			{empoweringWithoutForging && (
				<Note>{t("noForging", { row: forgingRows[EMPOWERMENT_FORGING_INDEX].name })}</Note>
			)}
			<SummaryTiles result={result} />
			<ResourcesCard result={result} />
			<div className="grid gap-4 lg:grid-cols-2">
				<PieceStatsCard result={result} />
				<MilestonesCard result={result} />
			</div>
			<TracksTable result={result} />
			<EventPointsCard result={result} />
		</div>
	);
}

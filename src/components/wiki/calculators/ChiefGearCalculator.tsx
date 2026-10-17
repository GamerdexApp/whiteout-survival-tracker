"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { PieceRange, PieceRangeMap } from "@/service/calcChiefGear";
import {
	EMPTY_RANGE,
	emptyRangeMap,
	goalLevelsFrom,
	pieceImageOf,
	runChiefGearPlan,
	withCurrent,
} from "@/service/calcChiefGear";
import { chiefGearLevelList, chiefGearPieceList } from "@/data/game/calcChiefGear";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { useGameLabels } from "@/comps/wiki/useGameLabels";
import { ChiefGearResults } from "./chiefgear/ChiefGearResults";
import { LevelSelect } from "./chiefgear/LevelSelect";

const troopTypes = [...new Set(chiefGearPieceList.map((piece) => piece.troopType))];

export function ChiefGearCalculator() {
	const t = useTranslations("calcChiefGear");
	const labels = useGameLabels();
	const [ranges, setRanges] = useState<PieceRangeMap>(emptyRangeMap);
	const [allRange, setAllRange] = useState<PieceRange>(EMPTY_RANGE);
	const plan = useMemo(() => runChiefGearPlan(ranges), [ranges]);

	const setRange = (pieceId: string, range: PieceRange) =>
		setRanges((current) => ({ ...current, [pieceId]: range }));

	const applyToAll = () =>
		setRanges(Object.fromEntries(chiefGearPieceList.map((piece) => [piece.id, allRange])));

	const resetAll = () => {
		setRanges(emptyRangeMap());
		setAllRange(EMPTY_RANGE);
	};

	return (
		<div className="flex flex-col gap-6">
			<p className="text-muted">{t("intro")}</p>

			<Card className="flex flex-col gap-3 p-4">
				<h2 className="font-semibold">{t("all.heading")}</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
					<LevelSelect
						label={t("all.current")}
						noneLabel={t("level.notCrafted")}
						levels={chiefGearLevelList}
						value={allRange.current}
						onChange={(current) => setAllRange(withCurrent(allRange, current))}
					/>
					<LevelSelect
						label={t("all.goal")}
						noneLabel={t("level.skip")}
						levels={goalLevelsFrom(allRange.current)}
						value={allRange.goal}
						onChange={(goal) => setAllRange({ ...allRange, goal })}
					/>
					<Button variant="primary" onClick={applyToAll}>
						{t("all.apply")}
					</Button>
					<Button onClick={resetAll}>{t("all.reset")}</Button>
				</div>
			</Card>

			<Card className="flex flex-col p-4">
				<h2 className="mb-1 font-semibold">{t("pieces.heading")}</h2>
				{troopTypes.map((troopType, index) => (
					<div
						key={troopType}
						className={`flex flex-col pt-3 ${index > 0 ? "border-line border-t-[1.5px]" : ""}`}
					>
						<SectionLabel className="text-muted">
							{t("pieces.troopGroup", { troop: labels.heroClass(troopType) })}
						</SectionLabel>
						{chiefGearPieceList
							.filter((piece) => piece.troopType === troopType)
							.map((piece) => {
								const range = ranges[piece.id];
								return (
									<div
										key={piece.id}
										className="grid gap-3 py-3 sm:grid-cols-[9rem_1fr_1fr] sm:items-end"
									>
										<span className="flex items-center gap-2 font-medium sm:min-h-11 lg:min-h-9">
											<ItemIcon src={pieceImageOf(piece, range)} size={36} />
											{piece.name}
										</span>
										<LevelSelect
											label={t("pieces.current")}
											ariaLabel={t("pieces.currentLabel", {
												piece: piece.name,
											})}
											noneLabel={t("level.notCrafted")}
											levels={chiefGearLevelList}
											value={range.current}
											onChange={(current) =>
												setRange(piece.id, withCurrent(range, current))
											}
										/>
										<LevelSelect
											label={t("pieces.goal")}
											ariaLabel={t("pieces.goalLabel", { piece: piece.name })}
											noneLabel={t("level.skip")}
											levels={goalLevelsFrom(range.current)}
											value={range.goal}
											onChange={(goal) =>
												setRange(piece.id, { ...range, goal })
											}
										/>
									</div>
								);
							})}
					</div>
				))}
			</Card>

			<ChiefGearResults plan={plan} />
		</div>
	);
}

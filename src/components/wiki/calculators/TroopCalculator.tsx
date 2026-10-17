"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { hasAnyRun, initialTroopCalculatorState, runTroopCalculator } from "@/service/calcTroop";
import { TROOP_TYPES } from "@/data/game/calcTroop";
import { Button } from "@/comps/ui/Button";
import { Note } from "@/comps/ui/Note";
import { BonusesCard } from "./troop/BonusesCard";
import { CampCard } from "./troop/CampCard";
import { TroopResults } from "./troop/TroopResults";

export function TroopCalculator() {
	const t = useTranslations("calcTroop");
	const [state, setState] = useState(initialTroopCalculatorState);
	const calculation = useMemo(() => runTroopCalculator(state), [state]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<p className="text-muted max-w-3xl flex-1 basis-64">{t("intro")}</p>
				<Button onClick={() => setState(initialTroopCalculatorState())}>
					{t("reset")}
				</Button>
			</div>
			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">{t("camps.title")}</h2>
				<div className="grid gap-3 lg:grid-cols-3">
					{TROOP_TYPES.map((type) => (
						<CampCard
							key={type}
							type={type}
							camp={state.camps[type]}
							capacity={calculation.capacity}
							result={calculation.camps[type]}
							onChange={(camp) =>
								setState({ ...state, camps: { ...state.camps, [type]: camp } })
							}
						/>
					))}
				</div>
			</section>
			<BonusesCard state={state} onChange={setState} />
			{hasAnyRun(state) ? (
				<TroopResults state={state} calculation={calculation} />
			) : (
				<Note>{t("results.noRuns")}</Note>
			)}
		</div>
	);
}

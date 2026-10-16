"use client";

import { useTranslations } from "next-intl";
import type { DailiesState } from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
	countMissingRoutineTasks,
	STARTER_VERSION,
	starterOffers,
	starterVersionOf,
} from "@/service/dailies";
import { routineTasks } from "@/data/game/dailies";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import type { DailiesActions } from "./useDailiesActions";

interface StarterListProps {
	state: DailiesState;
	actions: DailiesActions;
	inSheet?: boolean;
}

export function StarterList({ state, actions, inSheet = false }: StarterListProps) {
	const t = useTranslations("dailies.starter");
	const offers = starterOffers(state);
	const missingRoutine = countMissingRoutineTasks(state);
	const routineCount = { count: routineTasks.length, amount: formatNumber(routineTasks.length) };

	const content = (
		<>
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-semibold">{t("title")}</h2>
				{!inSheet && (
					<span className="text-muted font-mono text-xs">
						{t("version", { version: formatNumber(STARTER_VERSION) })}
					</span>
				)}
			</div>
			<p className="text-muted">{inSheet ? t("descriptionSheet") : t("description")}</p>
			<div className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
				<h3 className="font-medium">{t("routineTitle", routineCount)}</h3>
				{!inSheet && <p className="text-muted">{t("routineDescription", routineCount)}</p>}
				<Button
					className={inSheet ? "w-full" : "self-start"}
					disabled={missingRoutine === 0}
					onClick={actions.addRoutine}
				>
					{missingRoutine === 0
						? t("routineAllAdded")
						: t("routineAdd", {
								count: missingRoutine,
								amount: formatNumber(missingRoutine),
							})}
				</Button>
			</div>
			{offers.length > 0 && (
				<ul className="border-line flex flex-col border-t-[1.5px]">
					{offers.map((offer) => (
						<li
							key={offer.id}
							className="border-line flex flex-wrap items-center justify-between gap-2 py-2 not-last:border-b-[1.5px]"
						>
							<span className="min-w-0 flex-1">{t(offer.id)}</span>
							<span className="text-muted font-mono text-xs">
								{offer.status === "removed"
									? t("removed")
									: t("newIn", {
											version: formatNumber(starterVersionOf(offer.id)),
										})}
							</span>
							<Button onClick={() => actions.addStarter(offer.id)}>
								{offer.status === "removed" ? t("restore") : t("add")}
							</Button>
						</li>
					))}
				</ul>
			)}
		</>
	);

	if (inSheet) return <div className="flex flex-col gap-3">{content}</div>;
	return <Card className="flex flex-col gap-3 p-4">{content}</Card>;
}

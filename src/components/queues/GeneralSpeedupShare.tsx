"use client";

import { useTranslations } from "next-intl";
import type { GeneralSpeedupUse, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import {
	generalMinutesApplied,
	generalSharePercent,
	maxGeneralShare,
	minutesOfSpeedup,
	withGeneralShare,
} from "@/service/inventory";
import { CountInput } from "@/comps/resources/CountControl";

interface GeneralSpeedupShareProps {
	chief: Playthrough;
	use: GeneralSpeedupUse;
}

/**
 * The percent of the general speedups that this plan uses. The Buildings, Research, Troops and
 * Experts plans share the same 100 percent, so a plan cannot take more than the others leave.
 */
export function GeneralSpeedupShare({ chief, use }: GeneralSpeedupShareProps) {
	const t = useTranslations("queues.generalShare");
	const { updateData } = usePlaythrough();
	const max = maxGeneralShare(chief, use);

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">{t("label")}</span>
				<span className="flex items-center gap-1.5">
					<CountInput
						label={t("label")}
						value={generalSharePercent(chief, use)}
						onChange={(percent) =>
							updateData((data) =>
								updateChiefById(data, chief.id, (current) =>
									withGeneralShare(current, use, percent)
								)
							)
						}
						className="w-24"
					/>
					<span aria-hidden="true" className="text-muted font-mono">
						%
					</span>
				</span>
			</div>
			<p className="text-muted text-xs">
				{t("applied", {
					applied: formatNumber(generalMinutesApplied(chief, use)),
					total: formatNumber(minutesOfSpeedup(chief, "general")),
				})}
			</p>
			<p className="text-muted text-xs">{t("limit", { max: formatNumber(max) })}</p>
		</div>
	);
}

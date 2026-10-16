"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/comps/ui/Card";
import { useResetTimeLabel } from "./resetTime";
import { ResetTimeSelect } from "./ResetTimeSelect";
import type { DailiesActions } from "./useDailiesActions";

interface ResetTimeCardProps {
	resetTime: string;
	actions: DailiesActions;
}

export function ResetTimeCard({ resetTime, actions }: ResetTimeCardProps) {
	const t = useTranslations("dailies.reset");
	const timeLabel = useResetTimeLabel();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<div className="max-lg:hidden">
				<div className="flex items-center gap-3">
					<span className="shrink-0">{t("label")}</span>
					<div className="flex-1">
						<ResetTimeSelect value={resetTime} onChange={actions.setReset} />
					</div>
				</div>
				<p className="text-muted mt-3">{t("help")}</p>
			</div>
			<p className="text-muted lg:hidden">
				{t("helpMobile", { time: timeLabel(resetTime) })}
			</p>
		</Card>
	);
}

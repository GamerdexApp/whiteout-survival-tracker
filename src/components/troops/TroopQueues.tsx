"use client";

import { useTranslations } from "next-intl";
import type { Playthrough, TroopId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { campJob } from "@/service/queues";
import { campOf, TROOP_IDS } from "@/service/troops";
import { findTroop } from "@/data/game/troops";
import { JobCard } from "@/comps/queues/JobCard";

interface TroopQueuesProps {
	chief: Playthrough;
	onManage: (camp: TroopId) => void;
	onFinish: (camp: TroopId) => void;
}

export function TroopQueues({ chief, onManage, onFinish }: TroopQueuesProps) {
	const t = useTranslations("troops.queue");

	return (
		<section className="flex flex-col gap-2" aria-label={t("title")}>
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="font-semibold">{t("title")}</h2>
				<span className="text-muted text-xs">{t("note")}</span>
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				{TROOP_IDS.map((camp) => {
					const job = campJob(chief, camp);
					const name = findTroop(camp)?.name ?? camp;
					const title = job
						? job.mode === "training"
							? t("jobTitle.training", {
									count: formatNumber(job.count),
									name,
									tier: job.tier ?? 0,
								})
							: t("jobTitle.promotion", {
									count: formatNumber(job.count),
									name,
									from: job.fromTier ?? 0,
									to: job.toTier ?? 0,
								})
						: undefined;
					return (
						<JobCard
							key={camp}
							label={campOf(camp).name}
							idleText={t("idle")}
							title={title}
							job={job}
							onManage={() => onManage(camp)}
							onFinish={() => onFinish(camp)}
						/>
					);
				})}
			</div>
		</section>
	);
}

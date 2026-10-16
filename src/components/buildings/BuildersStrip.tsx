"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { BUILDER_NUMBERS, builderJob } from "@/service/queues";
import { findBuildingById } from "@/data/game/buildings";
import { JobCard } from "@/comps/queues/JobCard";

interface BuildersStripProps {
	chief: Playthrough;
	onManage: (builder: number) => void;
	onFinish: (builder: number) => void;
}

export function BuildersStrip({ chief, onManage, onFinish }: BuildersStripProps) {
	const t = useTranslations("buildings");
	return (
		<section className="flex flex-col gap-2" aria-label={t("builders.label")}>
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="font-semibold">{t("builders.label")}</h2>
				<span className="text-muted text-xs">{t("builders.hint")}</span>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				{BUILDER_NUMBERS.map((builder) => {
					const job = builderJob(chief, builder);
					const name = job
						? (findBuildingById(job.buildingId)?.name ?? job.buildingId)
						: "";
					return (
						<JobCard
							key={builder}
							label={t("builderName", { number: formatNumber(builder) })}
							idleText={t("builders.idle")}
							title={
								job
									? t("builders.jobTitle", {
											name,
											from: job.from ?? t("notBuilt"),
											to: job.to,
										})
									: undefined
							}
							job={job}
							onManage={() => onManage(builder)}
							onFinish={() => onFinish(builder)}
						/>
					);
				})}
			</div>
		</section>
	);
}

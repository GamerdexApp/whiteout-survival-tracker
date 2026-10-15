"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import type { ResearchQueueId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { queueJob, RESEARCH_QUEUES, researchQueueLabel } from "@/service/queues";
import { findResearch } from "@/data/game/research";
import { JobCard } from "@/comps/queues/JobCard";

interface QueuesStripProps {
	chief: Playthrough;
	onManage: (queue: ResearchQueueId) => void;
}

export function QueuesStrip({ chief, onManage }: QueuesStripProps) {
	const t = useTranslations("research");

	return (
		<section className="flex flex-col gap-2" aria-label={t("queuesStrip.title")}>
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="font-semibold">{t("queuesStrip.title")}</h2>
				<span className="text-muted text-xs">{t("queuesStrip.note")}</span>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				{RESEARCH_QUEUES.map((queue) => {
					const job = queueJob(chief, queue.id);
					const node = job ? findResearch(job.nodeId) : undefined;
					return (
						<JobCard
							key={queue.id}
							label={researchQueueLabel(queue.id)}
							idleText={t("queuesStrip.idle")}
							title={
								job
									? t("jobTitle", {
											name: node?.name ?? job.nodeId,
											from: formatNumber(job.from),
											to: formatNumber(job.to),
										})
									: undefined
							}
							job={job}
							onManage={() => onManage(queue.id)}
						/>
					);
				})}
			</div>
		</section>
	);
}

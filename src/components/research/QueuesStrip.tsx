"use client";

import type { Playthrough } from "@/types/app";
import type { ResearchQueueId } from "@/types/app";
import { queueJob, RESEARCH_QUEUES } from "@/service/queues";
import { findResearch } from "@/data/game/research";
import { JobCard } from "@/comps/queues/JobCard";

interface QueuesStripProps {
	chief: Playthrough;
	onManage: (queue: ResearchQueueId) => void;
}

export function QueuesStrip({ chief, onManage }: QueuesStripProps) {
	return (
		<section className="flex flex-col gap-2" aria-label="Research queues">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="font-semibold">Research queues</h2>
				<span className="text-muted text-xs">
					Growth, Economy and Battle share one queue. T11 and T12 use the War Academy
					queue.
				</span>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				{RESEARCH_QUEUES.map((queue) => {
					const job = queueJob(chief, queue.id);
					const node = job ? findResearch(job.nodeId) : undefined;
					return (
						<JobCard
							key={queue.id}
							label={`${queue.name}, ${queue.tabs}`}
							idleText="One research at a time. Press Start upgrade to begin one."
							title={
								job
									? `${node?.name ?? job.nodeId}, level ${job.from} to ${job.to}`
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

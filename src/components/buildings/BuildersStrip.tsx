"use client";

import type { Playthrough } from "@/types/app";
import { BUILDER_NUMBERS, builderJob } from "@/service/queues";
import { findBuildingById } from "@/data/game/buildings";
import { JobCard } from "@/comps/queues/JobCard";

interface BuildersStripProps {
	chief: Playthrough;
	onManage: (builder: number) => void;
}

export function BuildersStrip({ chief, onManage }: BuildersStripProps) {
	return (
		<section className="flex flex-col gap-2" aria-label="Builders">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="font-semibold">Builders</h2>
				<span className="text-muted text-xs">
					An upgrade you start here shows on Overview as a running queue.
				</span>
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
							label={`Builder ${builder}`}
							idleText="Press Start on a building to begin an upgrade."
							title={
								job ? `${name}, ${job.from ?? "Not built"} to ${job.to}` : undefined
							}
							job={job}
							onManage={() => onManage(builder)}
						/>
					);
				})}
			</div>
		</section>
	);
}

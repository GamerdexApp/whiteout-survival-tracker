"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { learningJob } from "@/service/queues";
import { findExpert } from "@/data/game/experts";
import { JobCard } from "@/comps/queues/JobCard";

interface ExpertLearningProps {
	chief: Playthrough;
	onManage: () => void;
	onFinish: () => void;
}

export function ExpertLearning({ chief, onManage, onFinish }: ExpertLearningProps) {
	const t = useTranslations("experts.learning");
	const job = learningJob(chief);
	const expert = job ? findExpert(job.expertId) : undefined;
	const skill = expert?.skills[job?.skillIndex ?? 0];

	return (
		<section className="flex flex-col gap-2" aria-label={t("title")}>
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="font-semibold">{t("title")}</h2>
				<span className="text-muted text-xs">{t("note")}</span>
			</div>
			<JobCard
				label={t("title")}
				idleText={t("idle")}
				title={
					job && expert && skill
						? t("jobTitle", {
								expert: expert.name,
								skill: skill.name,
								session: `${formatNumber(job.exp)} EXP`,
							})
						: undefined
				}
				job={job}
				onManage={onManage}
				onFinish={onFinish}
			/>
		</section>
	);
}

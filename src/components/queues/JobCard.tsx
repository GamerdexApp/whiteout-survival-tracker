"use client";

import type { UpgradeJob } from "@/types/app";
import { formatDateTime, formatTimeLeft } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { jobProgress, secondsLeft } from "@/service/queues";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface JobCardProps {
	label: string;
	idleText: string;
	title?: string;
	job?: UpgradeJob;
	onManage: () => void;
}

export function JobCard({ label, idleText, title, job, onManage }: JobCardProps) {
	const now = useNow();

	if (!job || !title) {
		return (
			<Card className="flex flex-col gap-1.5 border-dashed p-4">
				<SectionLabel className="text-muted">{label}</SectionLabel>
				<span className="font-semibold">Idle</span>
				<span className="text-muted">{idleText}</span>
			</Card>
		);
	}

	const left = secondsLeft(job, now);

	return (
		<Card className="flex flex-col gap-2 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<SectionLabel className="text-muted">{label}</SectionLabel>
				<span
					className={`font-mono text-sm font-medium ${left === 0 ? "text-kept" : "text-primary"}`}
				>
					{formatTimeLeft(left)}
				</span>
			</div>
			<span className="font-semibold">{title}</span>
			<ProgressBar value={jobProgress(job, now)} label={`${title} progress`} />
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted text-xs">Ends {formatDateTime(job.endsAt)}</span>
				<Button onClick={onManage}>Manage</Button>
			</div>
		</Card>
	);
}

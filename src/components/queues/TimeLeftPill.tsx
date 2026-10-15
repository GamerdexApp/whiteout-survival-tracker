"use client";

import { useTranslations } from "next-intl";
import type { UpgradeJob } from "@/types/app";
import { formatTimeLeft } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { secondsLeft } from "@/service/queues";

interface TimeLeftPillProps {
	job: UpgradeJob;
	label: string;
	onClick: () => void;
	fullWidth?: boolean;
}

export function TimeLeftPill({ job, label, onClick, fullWidth = false }: TimeLeftPillProps) {
	const t = useTranslations("queues.timeLeftPill");
	const now = useNow();
	const left = secondsLeft(job, now);

	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={t("manage", { label, timeLeft: formatTimeLeft(left) })}
			className={`bg-tint inline-flex min-h-11 items-center justify-center rounded-md px-3 font-mono text-xs font-medium lg:min-h-9 ${
				left === 0 ? "text-kept" : "text-primary"
			} ${fullWidth ? "w-full" : ""}`}
		>
			{formatTimeLeft(left)}
		</button>
	);
}

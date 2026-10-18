"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useSync } from "@/lib/contexts/SyncContext";
import { formatDateTime } from "@/lib/format";
import { describeChief } from "@/service/chiefs";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";

type ChiefStatus = "synced" | "changedHere" | "conflict" | "newHere";

const tones = {
	synced: "kept",
	changedHere: "changed",
	conflict: "warn",
	newHere: "added",
} as const;

const statusOf = (
	chief: Playthrough,
	cloud: Playthrough | undefined,
	hasConflict: boolean
): ChiefStatus => {
	if (hasConflict) return "conflict";
	if (!cloud) return "newHere";
	return JSON.stringify(chief) === JSON.stringify(cloud) ? "synced" : "changedHere";
};

interface ChiefsListProps {
	onReview: () => void;
}

/** One card for each chief: this device next to the cloud copy as it was at the last sync. */
export function ChiefsList({ onReview }: ChiefsListProps) {
	const t = useTranslations("sync.chiefs");
	const { playthroughs } = usePlaythrough();
	const { cloudCopy, conflicts, syncNow, status } = useSync();

	return (
		<div className="flex flex-col gap-3">
			<h3 className="text-base font-semibold">{t("title")}</h3>
			<ul className="flex flex-col gap-3">
				{playthroughs.map((chief) => {
					const cloud = cloudCopy?.playthroughs.find((other) => other.id === chief.id);
					const hasConflict = conflicts.some(
						(conflict) =>
							conflict.path[0] === "playthroughs" && conflict.path[1] === chief.id
					);
					const chiefStatus = statusOf(chief, cloud, hasConflict);
					return (
						<li
							key={chief.id}
							className="border-line bg-surface flex flex-col gap-2 rounded-md border-[1.5px] p-3"
						>
							<div className="flex items-start justify-between gap-3">
								<span className="font-semibold">{chief.name}</span>
								<Badge tone={tones[chiefStatus]}>
									{t(`status.${chiefStatus}`)}
								</Badge>
							</div>
							<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
								<dt className="text-muted">{t("thisDevice")}</dt>
								<dd className="flex flex-col items-end text-end">
									<span>{describeChief(chief)}</span>
									<span className="text-muted font-mono text-xs">
										{formatDateTime(chief.lastModified)}
									</span>
								</dd>
								<dt className="text-muted">{t("cloud")}</dt>
								<dd className="flex flex-col items-end text-end">
									{cloud ? (
										<>
											<span>{describeChief(cloud)}</span>
											<span className="text-muted font-mono text-xs">
												{formatDateTime(cloud.lastModified)}
											</span>
										</>
									) : (
										<span className="text-muted">{t("notInCloud")}</span>
									)}
								</dd>
							</dl>
							{chiefStatus === "conflict" && (
								<div>
									<Button variant="link" onClick={onReview}>
										{t("review")}
									</Button>
								</div>
							)}
							{(chiefStatus === "changedHere" || chiefStatus === "newHere") && (
								<div>
									<Button
										variant="link"
										disabled={status === "syncing" || status === "needsChoice"}
										onClick={() => void syncNow()}
									>
										{t("upload")}
									</Button>
								</div>
							)}
						</li>
					);
				})}
			</ul>
			<p className="text-muted">{t("note")}</p>
		</div>
	);
}

"use client";

import { useState } from "react";
import type { UpgradeJob } from "@/types/app";
import { formatDateTime, formatTimeLeft } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { jobProgress, secondsFrom, secondsLeft } from "@/service/queues";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { HoursMinutesFields } from "./HoursMinutesFields";

export interface ManageTarget {
	title: string;
	summary: string;
	slotLabel: string;
	finishText: string;
	job: UpgradeJob;
}

interface ManageUpgradeFlyoutProps {
	target: ManageTarget | null;
	onClose: () => void;
	onSetSecondsLeft: (seconds: number) => void;
	onFinish: () => void;
	onCancel: () => void;
}

const MINUTE_SECONDS = 60;

export function ManageUpgradeFlyout({
	target,
	onClose,
	onSetSecondsLeft,
	onFinish,
	onCancel,
}: ManageUpgradeFlyoutProps) {
	const now = useNow(15_000);
	const [speedup, setSpeedup] = useState("");
	const [hours, setHours] = useState("");
	const [minutes, setMinutes] = useState("");
	const [shownKey, setShownKey] = useState<string | null>(null);

	const key = target ? `${target.title}-${target.job.startedAt}` : null;
	if (key !== shownKey) {
		setShownKey(key);
		if (target) {
			const left = secondsLeft(target.job, now);
			setHours(String(Math.floor(left / 3_600)));
			setMinutes(String(Math.floor((left % 3_600) / MINUTE_SECONDS)));
			setSpeedup("");
		}
	}

	const left = target ? secondsLeft(target.job, now) : 0;
	const speedupMinutes = Number(speedup || 0);
	const afterSpeedup = Math.max(0, left - speedupMinutes * MINUTE_SECONDS);

	return (
		<Flyout
			open={target !== null}
			onClose={onClose}
			title={target?.title ?? "Manage upgrade"}
			description="Manage the running upgrade"
			footer={
				<>
					<Button onClick={onClose}>Close</Button>
					<Button variant="primary" onClick={onFinish}>
						Finish upgrade
					</Button>
				</>
			}
		>
			{target && (
				<>
					<Card className="flex flex-col gap-2 p-4">
						<div className="flex items-baseline justify-between gap-3">
							<span className="font-semibold">{target.summary}</span>
							<span
								className={`font-mono text-lg font-semibold ${left === 0 ? "text-kept" : "text-primary"}`}
							>
								{formatTimeLeft(left)}
							</span>
						</div>
						<span className="text-muted">{target.slotLabel}</span>
						<ProgressBar
							value={jobProgress(target.job, now)}
							label="Upgrade progress"
						/>
						<div className="text-muted flex justify-between gap-3 text-xs">
							<span>Started {formatDateTime(target.job.startedAt)}</span>
							<span>Ends {formatDateTime(target.job.endsAt)}</span>
						</div>
					</Card>

					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">Used a speedup</h3>
						<div className="flex items-end gap-3">
							<div className="flex-1">
								<Field label="Minutes used">
									<Input
										inputMode="numeric"
										className="text-right"
										value={speedup}
										onChange={(event) =>
											setSpeedup(
												event.target.value.replace(/\D/g, "").slice(0, 7)
											)
										}
									/>
								</Field>
							</div>
							<Button
								variant="primary"
								disabled={speedupMinutes === 0}
								onClick={() => {
									onSetSecondsLeft(afterSpeedup);
									setSpeedup("");
								}}
							>
								Apply
							</Button>
						</div>
						<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-2">
							<span>Time left after applying</span>
							<span className="font-mono font-medium">
								{speedupMinutes === 0
									? formatTimeLeft(left)
									: formatTimeLeft(afterSpeedup)}
							</span>
						</div>
						<p className="text-muted text-xs">
							Speedups of any kind subtract their minutes from the time left.
						</p>
					</Card>

					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">Set the time left</h3>
						<HoursMinutesFields
							hours={hours}
							minutes={minutes}
							onChange={(nextHours, nextMinutes) => {
								setHours(nextHours);
								setMinutes(nextMinutes);
							}}
						/>
						<div>
							<Button
								onClick={() =>
									onSetSecondsLeft(
										secondsFrom(Number(hours || 0), Number(minutes || 0))
									)
								}
							>
								Set the time left
							</Button>
						</div>
						<p className="text-muted text-xs">
							Use this when the game shows a different time.
						</p>
					</Card>

					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">When it is done</h3>
						<p className="text-muted">{target.finishText}</p>
						<div>
							<Button variant="danger" onClick={onCancel}>
								Cancel this upgrade
							</Button>
						</div>
					</Card>
				</>
			)}
		</Flyout>
	);
}

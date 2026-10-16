"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { DailiesSummary } from "@/service/dailies";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { useResetTimeLabel } from "./resetTime";

interface ResetDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	summary: DailiesSummary;
	resetTime: string;
}

export function ResetDialog({ open, onClose, onConfirm, summary, resetTime }: ResetDialogProps) {
	const t = useTranslations("dailies.resetDialog");
	const timeLabel = useResetTimeLabel();

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={t("title")}
			footer={
				<>
					<Button onClick={onClose} data-autofocus>
						{t("cancel")}
					</Button>
					<Button variant="danger" onClick={onConfirm}>
						{t("confirm")}
					</Button>
				</>
			}
		>
			<p>
				{t("body", {
					missions: t("missions", {
						count: summary.missionsDone,
						amount: formatNumber(summary.missionsDone),
					}),
					activeness: formatNumber(summary.activeness),
					marks: t("marks", {
						count: summary.tasksDone,
						amount: formatNumber(summary.tasksDone),
					}),
				})}
			</p>
			<p>{t("keep", { time: timeLabel(resetTime) })}</p>
			<p className="text-muted">{t("undo")}</p>
		</Dialog>
	);
}

"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Note } from "@/comps/ui/Note";

interface ResetDialogProps {
	open: boolean;
	chiefs: Playthrough[];
	onClose: () => void;
	onExportBackup: () => void;
	onConfirm: () => void;
}

export function ResetDialog({
	open,
	chiefs,
	onClose,
	onExportBackup,
	onConfirm,
}: ResetDialogProps) {
	const t = useTranslations("settings");
	const count = t("chiefCount", { count: chiefs.length, amount: formatNumber(chiefs.length) });

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={t("resetDialog.title")}
			footer={
				<>
					<Button data-autofocus onClick={onClose}>
						{t("resetDialog.cancel")}
					</Button>
					<Button variant="danger" onClick={onConfirm}>
						{t("resetDialog.confirm")}
					</Button>
				</>
			}
		>
			<p className="font-medium">{t("resetDialog.question", { chiefs: count })}</p>
			<div className="flex flex-col gap-1">
				<h3 className="text-muted text-xs">{t("resetDialog.removedTitle")}</h3>
				<ul className="list-inside list-disc">
					{chiefs.map((chief) => (
						<li key={chief.id}>{chief.name}</li>
					))}
				</ul>
			</div>
			<p className="text-muted">{t("resetDialog.settingsNote")}</p>
			<Note>{t("resetDialog.undoNote")}</Note>
			<div>
				<Button variant="ghost" className="text-link -ms-4" onClick={onExportBackup}>
					{t("resetDialog.exportFirst")}
				</Button>
			</div>
		</Dialog>
	);
}

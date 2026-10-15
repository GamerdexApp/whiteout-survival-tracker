"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief, formatShortDate } from "@/service/chiefs";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Note } from "@/comps/ui/Note";

interface DeleteChiefDialogProps {
	chief: Playthrough | null;
	onClose: () => void;
	onExportBackup: () => void;
	onConfirm: (chief: Playthrough) => void;
}

export function DeleteChiefDialog({
	chief,
	onClose,
	onExportBackup,
	onConfirm,
}: DeleteChiefDialogProps) {
	const t = useTranslations("chiefs.delete");
	const { ui } = useUiSettings();

	return (
		<Dialog
			open={chief !== null}
			onClose={onClose}
			title={t("title")}
			footer={
				<>
					<Button data-autofocus onClick={onClose}>
						{t("cancel")}
					</Button>
					<Button variant="danger" onClick={() => chief && onConfirm(chief)}>
						{t("confirmButton")}
					</Button>
				</>
			}
		>
			{chief && (
				<>
					<p>
						{t.rich("confirm", {
							name: chief.name,
							strong: (chunks) => <strong>{chunks}</strong>,
						})}
					</p>
					<p className="text-muted">
						{t("summary", {
							details: describeChief(chief, ui.furnaceFullLabels),
							date: formatShortDate(chief.createdAt),
						})}
					</p>
					<Note>{t("note")}</Note>
					<div>
						<Button
							variant="ghost"
							className="text-link -ml-4"
							onClick={onExportBackup}
						>
							{t("exportBackup")}
						</Button>
					</div>
				</>
			)}
		</Dialog>
	);
}

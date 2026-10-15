"use client";

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
	const { ui } = useUiSettings();

	return (
		<Dialog
			open={chief !== null}
			onClose={onClose}
			title="Delete chief"
			footer={
				<>
					<Button data-autofocus onClick={onClose}>
						Cancel
					</Button>
					<Button variant="danger" onClick={() => chief && onConfirm(chief)}>
						Delete chief
					</Button>
				</>
			}
		>
			{chief && (
				<>
					<p>
						Are you sure you want to delete &ldquo;<strong>{chief.name}</strong>&rdquo;?
					</p>
					<p className="text-muted">
						{describeChief(chief, ui.furnaceFullLabels)} · created{" "}
						{formatShortDate(chief.createdAt)}
					</p>
					<Note>
						This removes the chief and all of its levels, goals and notes from this
						device. There is no way to bring it back after the 10 second Undo ends.
					</Note>
					<div>
						<Button
							variant="ghost"
							className="text-link -ml-4"
							onClick={onExportBackup}
						>
							Export a backup first
						</Button>
					</div>
				</>
			)}
		</Dialog>
	);
}

"use client";

import type { Playthrough } from "@/types/app";
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
	const count = `${chiefs.length} ${chiefs.length === 1 ? "chief" : "chiefs"}`;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title="Reset all data"
			footer={
				<>
					<Button data-autofocus onClick={onClose}>
						Cancel
					</Button>
					<Button variant="danger" onClick={onConfirm}>
						Yes, reset all data
					</Button>
				</>
			}
		>
			<p className="font-medium">Delete all {count} from this browser?</p>
			<div className="flex flex-col gap-1">
				<h3 className="text-muted text-xs">What is removed</h3>
				<ul className="list-inside list-disc">
					{chiefs.map((chief) => (
						<li key={chief.id}>{chief.name}</li>
					))}
				</ul>
			</div>
			<p className="text-muted">
				Your Light, Dark or System choice returns to System. Chief settings return to their
				defaults. The active chief is cleared.
			</p>
			<Note>
				Undo stays available for 10 seconds after the reset. Export a backup first if you
				want a file copy that stays.
			</Note>
			<div>
				<Button variant="ghost" className="text-link -ml-4" onClick={onExportBackup}>
					Export backup first
				</Button>
			</div>
		</Dialog>
	);
}

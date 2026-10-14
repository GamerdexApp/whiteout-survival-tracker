"use client";

import { useMemo } from "react";
import type { AppData } from "@/types/app";
import type { ImportMode, ImportRowResult } from "@/service/backup";
import { applyImport, parseBackup, planImport, summarizeImport } from "@/service/backup";
import { formatShortDate } from "@/service/chiefs";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Note } from "@/comps/ui/Note";
import { RadioGroup } from "@/comps/ui/RadioGroup";

export interface ImportFile {
	name: string;
	size: number;
	text: string;
}

interface ImportDialogProps {
	file: ImportFile | null;
	current: AppData;
	mode: ImportMode;
	onModeChange: (mode: ImportMode) => void;
	onClose: () => void;
	onConfirm: (next: AppData, summary: string, mode: ImportMode) => void;
}

const modeOptions: { id: ImportMode; label: string }[] = [
	{ id: "merge", label: "Merge (recommended)" },
	{ id: "replace", label: "Replace everything on this device" },
];

const modeNotes: Record<ImportMode, string> = {
	merge: "Adds chiefs that are new and keeps the newer copy of a chief that is in both. Chiefs only on this device stay. Your settings stay.",
	replace:
		"Removes every chief on this device and loads the file as it is, including its settings. Use this to restore an exact copy.",
};

const resultLabels: Record<ImportRowResult, string> = {
	added: "Added",
	updated: "Updated from the file",
	kept: "Kept the copy on this device",
	replaced: "Loaded from the file",
	removed: "Removed",
};

const formatSize = (bytes: number) =>
	bytes < 1024 ? `${bytes} B` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const formatDate = (iso?: string) => (iso ? formatShortDate(iso) : "Not there");

export function ImportDialog({
	file,
	current,
	mode,
	onModeChange,
	onClose,
	onConfirm,
}: ImportDialogProps) {
	const parsed = useMemo(() => (file ? parseBackup(file.text) : null), [file]);
	const incoming = parsed?.ok ? parsed.data : null;
	const rows = useMemo(
		() => (incoming ? planImport(current, incoming, mode) : []),
		[current, incoming, mode]
	);
	const summary = summarizeImport(rows);

	return (
		<Dialog
			open={file !== null}
			onClose={onClose}
			title="Import backup"
			description={file ? `${file.name} · ${formatSize(file.size)}` : undefined}
			footer={
				incoming ? (
					<>
						<Button onClick={onClose}>Cancel</Button>
						<Button
							variant="primary"
							onClick={() =>
								onConfirm(applyImport(current, incoming, mode), summary, mode)
							}
						>
							{mode === "merge" ? "Merge" : "Replace"}
						</Button>
					</>
				) : (
					<Button onClick={onClose}>Close</Button>
				)
			}
		>
			{parsed && !parsed.ok && (
				<Note tone="warning" title="Import failed.">
					{parsed.error}
				</Note>
			)}
			{incoming && (
				<>
					<Note title="Checks on the file.">
						The chiefs list was found and {incoming.playthroughs.length}{" "}
						{incoming.playthroughs.length === 1 ? "entry was" : "entries were"} read.
						Nothing has been saved yet, so your current chiefs are untouched.
					</Note>
					<div className="flex flex-col gap-2">
						<h3 className="font-medium">How should the file be applied?</h3>
						<RadioGroup
							label="Import mode"
							options={modeOptions}
							value={mode}
							onChange={onModeChange}
						/>
						<p className="text-muted">{modeNotes[mode]}</p>
					</div>
					<div className="flex flex-col gap-2">
						<h3 className="font-medium">What changes</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead className="text-muted text-xs">
									<tr>
										<th className="py-1 pr-3 font-medium">Chief</th>
										<th className="py-1 pr-3 font-medium">In the file</th>
										<th className="py-1 pr-3 font-medium">On this device</th>
										<th className="py-1 font-medium">Result</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row, index) => (
										<tr
											key={index}
											className="border-line border-t-[1.5px] align-top"
										>
											<td className="py-2 pr-3 font-medium">{row.name}</td>
											<td className="py-2 pr-3">
												{formatDate(row.fileModified)}
											</td>
											<td className="py-2 pr-3">
												{formatDate(row.deviceModified)}
											</td>
											<td className="py-2">{resultLabels[row.result]}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="text-muted">{summary || "No chiefs in the file."}</p>
						<p className="text-muted">
							Undo stays available for 10 seconds after the import.
						</p>
					</div>
				</>
			)}
		</Dialog>
	);
}

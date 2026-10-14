"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LuDownload, LuUpload } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import type { ImportMode } from "@/service/backup";
import { backupFileName, downloadBackup } from "@/service/backup";
import { emptyAppData } from "@/service/chiefs";
import { Badge } from "@/comps/ui/Badge";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { Note } from "@/comps/ui/Note";
import { useToast } from "@/comps/ui/Toast";
import { ImportDialog } from "./ImportDialog";
import type { ImportFile } from "./ImportDialog";
import { ResetDialog } from "./ResetDialog";
import { SettingsCard } from "./SettingsCard";

const countLabel = (count: number) => `${count} ${count === 1 ? "chief" : "chiefs"}`;

export function DataTab() {
	const showToast = useToast();
	const { appData, playthroughs, updateData } = usePlaythrough();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [chosenFile, setChosenFile] = useState<File | null>(null);
	const [reviewedFile, setReviewedFile] = useState<ImportFile | null>(null);
	const [importMode, setImportMode] = useState<ImportMode>("merge");
	const [resetOpen, setResetOpen] = useState(false);

	const exportBackup = () => {
		showToast({
			variant: "success",
			title: "Backup downloaded",
			message: downloadBackup(appData),
		});
	};

	const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
		setChosenFile(event.target.files?.[0] ?? null);
	};

	const reviewImport = async () => {
		if (!chosenFile) return;
		setImportMode("merge");
		setReviewedFile({
			name: chosenFile.name,
			size: chosenFile.size,
			text: await chosenFile.text(),
		});
	};

	const confirmImport = (next: typeof appData, summary: string, mode: ImportMode) => {
		const previous = updateData(() => next);
		setReviewedFile(null);
		setChosenFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		showToast({
			variant: "undo",
			title: mode === "merge" ? "Backup merged" : "Backup replaced",
			message: summary,
			action: { label: "Undo", onAction: () => updateData(() => previous) },
		});
	};

	const confirmReset = () => {
		const previous = updateData(() => emptyAppData());
		setResetOpen(false);
		showToast({
			variant: "undo",
			title: "All data reset",
			message: `${countLabel(previous.playthroughs.length)} removed and settings cleared.`,
			action: { label: "Undo", onAction: () => updateData(() => previous) },
		});
	};

	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<div className="flex flex-col gap-4">
				<Note title="Local storage.">
					Your chiefs are stored in this browser only. They are lost if the browser cache
					is cleared. Export a backup regularly.
				</Note>
				<SettingsCard
					title="Data management"
					description="One backup file holds every chief and your settings."
					aside={<Badge tone="added">{countLabel(playthroughs.length)}</Badge>}
				>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">Export data</h3>
						<p className="text-muted">
							Download a backup file of all your saved chiefs. File name:{" "}
							<code className="font-mono text-xs break-all">{backupFileName()}</code>.
							The date is your local day.
						</p>
						<div>
							<Button onClick={exportBackup}>
								<LuDownload size={16} aria-hidden="true" />
								Export all chiefs
							</Button>
						</div>
					</section>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">Import data</h3>
						<p className="text-muted">
							Upload a previously exported file (.json). It is checked first, then you
							choose Merge or Replace and see what changes. Nothing changes until you
							confirm.
						</p>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json,application/json"
							onChange={chooseFile}
							className="sr-only"
							tabIndex={-1}
							aria-hidden="true"
						/>
						<div className="flex flex-wrap items-center gap-3">
							<Button onClick={() => fileInputRef.current?.click()}>
								<LuUpload size={16} aria-hidden="true" />
								Choose file
							</Button>
							<span className="text-muted break-all">
								{chosenFile?.name ?? "No file chosen"}
							</span>
						</div>
						<div>
							<Button variant="primary" disabled={!chosenFile} onClick={reviewImport}>
								Review import
							</Button>
						</div>
					</section>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">Reset all data</h3>
						<Note tone="warning" title="Warning:">
							This will delete all chiefs and reset your chief settings and theme. You
							can undo for 10 seconds, so export a backup first if you want to keep a
							copy.
						</Note>
						<div>
							<Button
								variant="danger"
								disabled={playthroughs.length === 0}
								onClick={() => setResetOpen(true)}
							>
								Reset all data
							</Button>
						</div>
					</section>
				</SettingsCard>
			</div>
			<SettingsCard
				title="Chiefs"
				description="Create, rename, edit and delete chiefs on their own page. Export, import and reset apply to all of them."
				aside={<Badge tone="added">{countLabel(playthroughs.length)}</Badge>}
			>
				<div>
					<ButtonLink href="/chiefs">Manage chiefs</ButtonLink>
				</div>
			</SettingsCard>

			<ImportDialog
				file={reviewedFile}
				current={appData}
				mode={importMode}
				onModeChange={setImportMode}
				onClose={() => setReviewedFile(null)}
				onConfirm={confirmImport}
			/>
			<ResetDialog
				open={resetOpen}
				chiefs={playthroughs}
				onClose={() => setResetOpen(false)}
				onExportBackup={exportBackup}
				onConfirm={confirmReset}
			/>
		</div>
	);
}

"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LuDownload, LuUpload } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
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

export function DataTab() {
	const t = useTranslations("settings");
	const showToast = useToast();
	const { appData, playthroughs, updateData } = usePlaythrough();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [chosenFile, setChosenFile] = useState<File | null>(null);
	const [reviewedFile, setReviewedFile] = useState<ImportFile | null>(null);
	const [importMode, setImportMode] = useState<ImportMode>("merge");
	const [resetOpen, setResetOpen] = useState(false);

	const countLabel = (count: number) => t("chiefCount", { count, amount: formatNumber(count) });

	const exportBackup = () => {
		showToast({
			variant: "success",
			title: t("data.backupDownloaded"),
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
		if (!previous) return;
		setReviewedFile(null);
		setChosenFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		showToast({
			variant: "success",
			title: mode === "merge" ? t("data.merged") : t("data.replaced"),
			message: summary,
			action: { label: t("data.undo"), onAction: () => updateData(() => previous) },
		});
	};

	const confirmReset = () => {
		const previous = updateData(() => emptyAppData());
		if (!previous) return;
		setResetOpen(false);
		showToast({
			variant: "warning",
			title: t("data.resetDone"),
			message: t("data.resetDoneMessage", {
				chiefs: countLabel(previous.playthroughs.length),
			}),
			action: { label: t("data.undo"), onAction: () => updateData(() => previous) },
		});
	};

	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<div className="flex flex-col gap-4">
				<Note title={t("localStorageNote.title")}>{t("localStorageNote.body")}</Note>
				<SettingsCard
					title={t("data.management.title")}
					description={t("data.management.description")}
					aside={<Badge tone="added">{countLabel(playthroughs.length)}</Badge>}
				>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">{t("data.export.title")}</h3>
						<p className="text-muted">
							{t.rich("data.export.description", {
								fileName: backupFileName(),
								file: (name) => (
									<code className="font-mono text-xs break-all">{name}</code>
								),
							})}
						</p>
						<div>
							<Button onClick={exportBackup}>
								<LuDownload size={16} aria-hidden="true" />
								{t("data.export.button")}
							</Button>
						</div>
					</section>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">{t("data.import.title")}</h3>
						<p className="text-muted">{t("data.import.description")}</p>
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
								{t("data.import.chooseFile")}
							</Button>
							<span className="text-muted break-all">
								{chosenFile?.name ?? t("data.import.noFile")}
							</span>
						</div>
						<div>
							<Button variant="primary" disabled={!chosenFile} onClick={reviewImport}>
								{t("data.import.review")}
							</Button>
						</div>
					</section>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">{t("data.reset.title")}</h3>
						<Note tone="warning" title={t("data.reset.warningTitle")}>
							{t("data.reset.warning")}
						</Note>
						<div>
							<Button
								variant="danger"
								disabled={playthroughs.length === 0}
								onClick={() => setResetOpen(true)}
							>
								{t("data.reset.button")}
							</Button>
						</div>
					</section>
				</SettingsCard>
			</div>
			<SettingsCard
				title={t("data.chiefs.title")}
				description={t("data.chiefs.description")}
				aside={<Badge tone="added">{countLabel(playthroughs.length)}</Badge>}
			>
				<div>
					<ButtonLink href="/chiefs">{t("data.chiefs.manage")}</ButtonLink>
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

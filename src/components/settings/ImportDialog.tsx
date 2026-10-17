"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { AppData } from "@/types/app";
import { formatNumber, formatShortDate } from "@/lib/format";
import type { ImportMode, ImportRowResult } from "@/service/backup";
import { applyImport, parseBackup, planImport, summarizeImport } from "@/service/backup";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Note } from "@/comps/ui/Note";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";

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

const modeIds: ImportMode[] = ["merge", "replace"];

export function ImportDialog({
	file,
	current,
	mode,
	onModeChange,
	onClose,
	onConfirm,
}: ImportDialogProps) {
	const t = useTranslations("settings.importDialog");
	const parsed = useMemo(() => (file ? parseBackup(file.text) : null), [file]);
	const incoming = parsed?.ok ? parsed.data : null;
	const rows = useMemo(
		() => (incoming ? planImport(current, incoming, mode) : []),
		[current, incoming, mode]
	);
	const summary = summarizeImport(rows);
	const modeOptions = modeIds.map((id) => ({ id, label: t(`modes.${id}`) }));

	const formatSize = (bytes: number) =>
		bytes < 1024
			? t("bytes", { amount: formatNumber(bytes) })
			: t("kilobytes", { amount: formatNumber(Math.max(1, Math.round(bytes / 1024))) });

	const formatDate = (iso?: string) => (iso ? formatShortDate(iso) : t("notThere"));

	return (
		<Dialog
			open={file !== null}
			onClose={onClose}
			title={t("title")}
			description={
				file ? t("fileInfo", { name: file.name, size: formatSize(file.size) }) : undefined
			}
			footer={
				incoming ? (
					<>
						<Button onClick={onClose}>{t("cancel")}</Button>
						<Button
							variant="primary"
							onClick={() =>
								onConfirm(applyImport(current, incoming, mode), summary, mode)
							}
						>
							{t(mode)}
						</Button>
					</>
				) : (
					<Button onClick={onClose}>{t("close")}</Button>
				)
			}
		>
			{parsed && !parsed.ok && (
				<Note tone="warning" title={t("failedTitle")}>
					{parsed.error}
				</Note>
			)}
			{incoming && (
				<>
					<Note title={t("checksTitle")}>
						{t("checks", {
							count: incoming.playthroughs.length,
							amount: formatNumber(incoming.playthroughs.length),
						})}
					</Note>
					<div className="flex flex-col gap-2">
						<h3 className="font-medium">{t("howToApply")}</h3>
						<RadioGroup
							label={t("modeLabel")}
							options={modeOptions}
							value={mode}
							onChange={onModeChange}
						/>
						<p className="text-muted">{t(`modeNotes.${mode}`)}</p>
					</div>
					<div className="flex flex-col gap-2">
						<h3 className="font-medium">{t("whatChanges")}</h3>
						<ScrollRegion label={t("whatChanges")}>
							<table className="w-full text-left">
								<thead className="text-muted text-xs">
									<tr>
										<th className="py-1 pr-3 font-medium">
											{t("columns.chief")}
										</th>
										<th className="py-1 pr-3 font-medium">
											{t("columns.inFile")}
										</th>
										<th className="py-1 pr-3 font-medium">
											{t("columns.onDevice")}
										</th>
										<th className="py-1 font-medium">{t("columns.result")}</th>
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
											<td className="py-2">{t(`results.${row.result}`)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</ScrollRegion>
						<p className="text-muted">{summary || t("noChiefs")}</p>
						<p className="text-muted">{t("undoNote")}</p>
					</div>
				</>
			)}
		</Dialog>
	);
}

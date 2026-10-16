"use client";

import { useTranslations } from "next-intl";
import { LuCheck } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import type { AlbumView } from "@/service/tundraAlbum";
import { ProgressBar } from "@/comps/ui/ProgressBar";

interface AlbumPickerProps {
	views: AlbumView[];
	activeId: string;
	onChange: (albumId: string) => void;
}

export function AlbumPicker({ views, activeId, onChange }: AlbumPickerProps) {
	const t = useTranslations("tundraAlbum.picker");

	return (
		<section className="flex flex-col gap-2" aria-label={t("label")}>
			<h2 className="font-semibold">{t("title")}</h2>
			<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{views.map((view) => {
					const active = view.album.id === activeId;
					return (
						<li key={view.album.id}>
							<button
								type="button"
								aria-pressed={active}
								onClick={() => onChange(view.album.id)}
								className={`flex min-h-11 w-full flex-col gap-1.5 rounded-md border-[1.5px] p-3 text-left ${active ? "border-primary bg-tint" : "border-line bg-surface hover:bg-tint"}`}
							>
								<span className="flex items-start justify-between gap-2">
									<span className="font-semibold">{view.album.name}</span>
									{view.complete && (
										<span
											className="bg-primary text-on-primary mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
											title={t("complete")}
										>
											<LuCheck size={11} aria-hidden="true" />
											<span className="sr-only">{t("complete")}</span>
										</span>
									)}
								</span>
								<span className="text-muted font-mono text-xs">
									{t("puzzles", {
										done: formatNumber(view.puzzlesDone),
										total: formatNumber(view.album.puzzles.length),
									})}
								</span>
								<ProgressBar
									value={view.piecesCollected / view.piecesTotal}
									label={t("piecesProgress", { album: view.album.name })}
								/>
								<span className="text-muted font-mono text-xs">
									{t("pieces", {
										collected: formatNumber(view.piecesCollected),
										total: formatNumber(view.piecesTotal),
									})}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

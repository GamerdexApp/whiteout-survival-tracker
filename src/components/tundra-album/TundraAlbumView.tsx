"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief, updateChiefById } from "@/service/chiefs";
import {
	buildAlbumViews,
	completeAlbumCount,
	totalPiecesAvailable,
	totalPiecesCollected,
	withAlbumComplete,
	withPieceCollected,
	withPuzzleDone,
} from "@/service/tundraAlbum";
import { ALBUMS_IN_GAME } from "@/data/game/tundraAlbum";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { useToast } from "@/comps/ui/Toast";
import { AlbumPanel } from "./AlbumPanel";
import { AlbumPicker } from "./AlbumPicker";
import { PieceRewardsFlyout } from "./PieceRewardsFlyout";

export function TundraAlbumView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("tundraAlbum");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const { ui } = useUiSettings();
	const [activeId, setActiveId] = useState<string | null>(null);
	const [rewardsOpen, setRewardsOpen] = useState(false);

	const views = useMemo(() => buildAlbumViews(chief), [chief]);
	const completeCount = completeAlbumCount(views);
	const piecesCollected = totalPiecesCollected(views);
	const piecesAvailable = totalPiecesAvailable(views);
	const completeViews = views.filter((view) => view.complete);
	const activeView = views.find((view) => view.album.id === activeId) ?? views[0];
	const albumsMissing = ALBUMS_IN_GAME - views.length;

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const markComplete = () => {
		const before = chief;
		if (!change((current) => withAlbumComplete(current, activeView.album.id))) return;
		showToast({
			variant: "success",
			title: t("toast.markedTitle", { album: activeView.album.name }),
			message: t("toast.markedMessage", {
				total: formatNumber(activeView.album.puzzles.length),
			}),
			action: { label: t("toast.undo"), onAction: () => change(() => before) },
		});
	};

	const changePuzzle = (puzzleId: string, done: boolean) => {
		const before = chief;
		if (!change((current) => withPuzzleDone(current, activeView.album.id, puzzleId, done)))
			return;
		if (done || !activeView.complete) return;
		const puzzle = activeView.album.puzzles.find((candidate) => candidate.id === puzzleId);
		if (!puzzle) return;
		showToast({
			variant: "info",
			title: t("toast.unmarkedTitle", { puzzle: puzzle.name }),
			message: t("toast.unmarkedMessage", { album: activeView.album.name }),
			action: { label: t("toast.undo"), onAction: () => change(() => before) },
		});
	};

	const changePiece = (pieceId: string, collected: boolean) => {
		change((current) => withPieceCollected(current, activeView.album.id, pieceId, collected));
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: chief.name,
					details: describeChief(chief, ui.furnaceFullLabels),
					complete: formatNumber(completeCount),
					total: formatNumber(views.length),
				})}
				actions={
					<ButtonLink variant="ghost" href="/wiki" className="max-lg:w-full">
						{t("wiki.button")}
					</ButtonLink>
				}
			/>

			<div className="grid items-start gap-4 lg:grid-cols-[1fr_2fr]">
				<div className="flex flex-col gap-4">
					<Card className="flex flex-col gap-2 px-4 py-3">
						<SectionLabel className="text-muted">{t("summary.label")}</SectionLabel>
						<span className="font-mono text-2xl">
							{t("summary.value", {
								done: formatNumber(completeCount),
								total: formatNumber(views.length),
							})}
						</span>
						<ProgressBar
							value={completeCount / views.length}
							label={t("summary.progress")}
						/>
						<span className="text-muted">
							{t("summary.inData", {
								shown: formatNumber(views.length),
								all: formatNumber(ALBUMS_IN_GAME),
							})}
						</span>
					</Card>
					<Card className="flex flex-col gap-2 px-4 py-3">
						<SectionLabel className="text-muted">{t("pieces.label")}</SectionLabel>
						<span className="font-mono text-2xl">
							{t("pieces.value", {
								collected: formatNumber(piecesCollected),
								available: formatNumber(piecesAvailable),
							})}
						</span>
						<ProgressBar
							value={piecesAvailable === 0 ? 0 : piecesCollected / piecesAvailable}
							label={t("pieces.progress")}
						/>
						<Button className="self-start" onClick={() => setRewardsOpen(true)}>
							{t("pieces.viewRewards")}
						</Button>
					</Card>
				</div>
				<Card className="flex flex-col gap-3 p-4">
					<div className="flex items-center justify-between gap-3">
						<h2 className="font-semibold">{t("buffs.title")}</h2>
						<Badge tone="locked">{t("buffs.derived")}</Badge>
					</div>
					{completeViews.length === 0 ? (
						<p className="text-muted">{t("buffs.none")}</p>
					) : (
						<ul className="grid gap-3 sm:grid-cols-2">
							{completeViews.map(({ album }) => (
								<li key={album.id} className="bg-tint flex flex-col rounded-md p-3">
									<span className="font-mono text-xl">{album.buff.value}</span>
									<span>{album.buff.stat}</span>
									<span className="text-muted">{album.name}</span>
								</li>
							))}
						</ul>
					)}
					<p className="text-muted">
						{t.rich("buffs.note", {
							link: (chunks) => (
								<Link href="/bonuses" className="text-link underline">
									{chunks}
								</Link>
							),
						})}
					</p>
				</Card>
			</div>

			<AlbumPicker views={views} activeId={activeView.album.id} onChange={setActiveId} />
			<AlbumPanel
				view={activeView}
				onMarkComplete={markComplete}
				onPuzzleChange={changePuzzle}
				onPieceChange={changePiece}
			/>

			{albumsMissing > 0 && (
				<p className="text-muted border-line rounded-md border-[1.5px] border-dashed p-4 text-center">
					{t("notInData", {
						count: albumsMissing,
						total: formatNumber(ALBUMS_IN_GAME),
					})}
				</p>
			)}

			<PieceRewardsFlyout
				open={rewardsOpen}
				collected={piecesCollected}
				available={piecesAvailable}
				onClose={() => setRewardsOpen(false)}
			/>
		</>
	);
}

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { AlbumView } from "@/service/tundraAlbum";
import { TUNDRA_ALBUM_PUZZLES_PER_ALBUM } from "@/data/game/tundraAlbum";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { PuzzleCard } from "./PuzzleCard";
import { RewardLine } from "./RewardText";

interface AlbumPanelProps {
	view: AlbumView;
	onMarkComplete: () => void;
	onPuzzleChange: (puzzleId: string, done: boolean) => void;
	onPieceChange: (pieceId: string, collected: boolean) => void;
}

export function AlbumPanel({
	view,
	onMarkComplete,
	onPuzzleChange,
	onPieceChange,
}: AlbumPanelProps) {
	const t = useTranslations("tundraAlbum.album");
	const { album, puzzlesDone, complete, doneIds, collectedIds, piecesCollected, piecesTotal } =
		view;
	const total = TUNDRA_ALBUM_PUZZLES_PER_ALBUM;
	const buffText = `${album.buff.stat} ${album.buff.value}`;

	return (
		<div className="flex flex-col gap-4">
			<Card className="flex flex-col gap-4 p-4 lg:p-5">
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-xl font-semibold">{album.name}</h2>
					<Badge tone={complete ? "kept" : "changed"}>
						{complete ? t("status.complete") : t("status.inProgress")}
					</Badge>
				</div>
				<div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
					<div className="flex flex-col gap-1">
						<SectionLabel className="text-muted">{t("buffWhenComplete")}</SectionLabel>
						<span className="font-mono text-lg">{buffText}</span>
					</div>
					<div className="flex flex-col gap-2">
						<SectionLabel className="text-muted">{t("puzzlesDone")}</SectionLabel>
						<span className="font-mono text-xl">
							{t("puzzlesValue", {
								done: formatNumber(puzzlesDone),
								total: formatNumber(total),
							})}
						</span>
						<ProgressBar
							value={puzzlesDone / total}
							label={t("puzzlesProgress", { album: album.name })}
						/>
						<span className="text-muted font-mono text-sm">
							{t("piecesValue", {
								collected: formatNumber(piecesCollected),
								total: formatNumber(piecesTotal),
							})}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<SectionLabel className="text-muted">{t("completionRewards")}</SectionLabel>
						{album.completionRewards.map((reward, index) => (
							<RewardLine key={index} reward={reward} />
						))}
					</div>
				</div>
				<div className="border-line flex flex-col gap-3 border-t-[1.5px] pt-4 lg:flex-row lg:items-center lg:justify-between">
					<p className="text-muted">
						{complete
							? t("counting", { buff: buffText })
							: t("notCounting", { buff: buffText, total: formatNumber(total) })}
					</p>
					<Button variant="primary" disabled={complete} onClick={onMarkComplete}>
						{t("markComplete")}
					</Button>
				</div>
			</Card>
			<ul className="grid items-start gap-4 lg:grid-cols-2">
				{album.puzzles.map((puzzle) => (
					<PuzzleCard
						key={puzzle.id}
						puzzle={puzzle}
						done={doneIds.has(puzzle.id)}
						collectedIds={collectedIds}
						onDoneChange={(done) => onPuzzleChange(puzzle.id, done)}
						onPieceChange={onPieceChange}
					/>
				))}
			</ul>
		</div>
	);
}

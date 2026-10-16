import type { TundraAlbumPuzzle } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { LuCheck } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { tundraPuzzlePieceCounts } from "@/data/game/tundraAlbum";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { RewardLine } from "./RewardText";

const STAR_LEVELS = [1, 2, 3, 4, 5] as const;

interface PuzzleCardProps {
	puzzle: TundraAlbumPuzzle;
	done: boolean;
	collectedIds: Set<string>;
	onDoneChange: (done: boolean) => void;
	onPieceChange: (pieceId: string, collected: boolean) => void;
}

export function PuzzleCard({
	puzzle,
	done,
	collectedIds,
	onDoneChange,
	onPieceChange,
}: PuzzleCardProps) {
	const t = useTranslations("tundraAlbum.puzzle");
	const counts = tundraPuzzlePieceCounts(puzzle);
	const split = STAR_LEVELS.map((stars) => counts[stars]).join("/");
	const collected = puzzle.pieces.filter((piece) => collectedIds.has(piece.id)).length;

	return (
		<li>
			<Card highlighted={done} className={`flex flex-col gap-3 p-4 ${done ? "bg-tint" : ""}`}>
				<div className="flex items-center gap-4">
					<ItemIcon src={puzzle.img} size={56} />
					<div className="flex min-w-0 flex-col">
						<h3 className="font-semibold">{puzzle.name}</h3>
						<span className="text-muted font-mono text-sm">
							{t("pieces", {
								count: puzzle.pieces.length,
								amount: formatNumber(puzzle.pieces.length),
								split,
							})}
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex items-baseline justify-between gap-3">
						<span className="text-muted">{t("collectedLabel")}</span>
						<span className="font-mono">
							{t("collected", {
								collected: formatNumber(collected),
								total: formatNumber(puzzle.pieces.length),
							})}
						</span>
					</div>
					<ul className="flex flex-wrap gap-1.5">
						{puzzle.pieces.map((piece) => {
							const have = collectedIds.has(piece.id);
							return (
								<li key={piece.id}>
									<button
										type="button"
										aria-pressed={have}
										disabled={done}
										aria-label={t("pieceLabel", {
											name: piece.name,
											stars: formatNumber(piece.stars),
										})}
										onClick={() => onPieceChange(piece.id, !have)}
										className={`relative flex size-11 items-center justify-center rounded-md border-[1.5px] lg:size-10 ${have ? "border-primary bg-tint" : "border-line opacity-50 grayscale"} ${done ? "cursor-not-allowed" : ""}`}
									>
										<ItemIcon src={piece.img} size={36} />
										{have && (
											<span className="bg-primary text-on-primary absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full">
												<LuCheck size={11} aria-hidden="true" />
											</span>
										)}
									</button>
								</li>
							);
						})}
					</ul>
					<span className="text-muted text-xs">
						{done ? t("allCollected") : t("pieceHint")}
					</span>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-muted">{t("reward")}</span>
					<RewardLine reward={puzzle.reward} />
				</div>
				<label className="border-line -mb-2 flex min-h-11 items-center gap-3 border-t-[1.5px] pt-1 font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--ring) lg:min-h-9">
					<input
						type="checkbox"
						checked={done}
						aria-label={t("doneFor", { puzzle: puzzle.name })}
						onChange={(event) => onDoneChange(event.target.checked)}
						className="accent-primary size-5 cursor-pointer"
					/>
					{t("done")}
				</label>
			</Card>
		</li>
	);
}

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { albumPieceCount, STAR_LEVELS } from "@/service/wikiTundraAlbum";
import {
	ALBUMS_IN_GAME,
	allTundraAlbums,
	TUNDRA_ALBUM_PUZZLES_PER_ALBUM,
	tundraPuzzlePieceCounts,
} from "@/data/game/wikiTundraAlbum";
import type { TundraAlbum, TundraAlbumPiece, TundraAlbumPuzzle } from "@/data/game/wikiTundraAlbum";
import { RewardLine } from "@/comps/tundra-album/RewardText";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { RecordSection } from "../records/RecordParts";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

type AlbumView = "puzzles" | "pieces";

const VIEWS: AlbumView[] = ["puzzles", "pieces"];

function useCountText() {
	const t = useTranslations("wikiTundraAlbum");

	return {
		puzzles: (count: number) => t("puzzleCount", { count, amount: formatNumber(count) }),
		pieces: (count: number) => t("pieceCount", { count, amount: formatNumber(count) }),
	};
}

function AlbumSummary({ album }: { album: TundraAlbum }) {
	const t = useTranslations("wikiTundraAlbum.album");
	const counts = useCountText();

	return (
		<RecordSection
			title={album.name}
			meta={t("counts", {
				puzzles: counts.puzzles(album.puzzles.length),
				pieces: counts.pieces(albumPieceCount(album)),
			})}
		>
			<Card className="grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
				<div className="flex flex-col gap-1">
					<SectionLabel className="text-muted">{t("buff")}</SectionLabel>
					<span className="font-semibold">
						{t("buffValue", { stat: album.buff.stat, value: album.buff.value })}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<SectionLabel className="text-muted">{t("rewards")}</SectionLabel>
					<ul className="flex flex-wrap gap-x-4 gap-y-1">
						{album.completionRewards.map((reward, index) => (
							<li key={index}>
								<RewardLine reward={reward} />
							</li>
						))}
					</ul>
				</div>
			</Card>
			<p className="text-muted">
				{t("buffNote", { puzzles: formatNumber(album.puzzles.length) })}
			</p>
		</RecordSection>
	);
}

function PuzzleTable({ puzzles }: { puzzles: TundraAlbumPuzzle[] }) {
	const t = useTranslations("wikiTundraAlbum.puzzles");

	return (
		<Card className="hidden overflow-hidden lg:block">
			<table className="w-full border-collapse">
				<thead>
					<tr className="text-muted text-start">
						<th scope="col" className="px-2 py-2">
							<SectionLabel>{t("puzzle")}</SectionLabel>
						</th>
						<th scope="col" className="px-2 py-2 text-end">
							<SectionLabel>{t("pieces")}</SectionLabel>
						</th>
						{STAR_LEVELS.map((stars) => (
							<th key={stars} scope="col" className="px-2 py-2 text-end">
								<SectionLabel>
									{t("star", { stars: formatNumber(stars) })}
								</SectionLabel>
							</th>
						))}
						<th scope="col" className="px-2 py-2">
							<SectionLabel>{t("reward")}</SectionLabel>
						</th>
					</tr>
				</thead>
				<tbody>
					{puzzles.map((puzzle) => {
						const split = tundraPuzzlePieceCounts(puzzle);
						return (
							<tr key={puzzle.id} className="border-line border-t">
								<th scope="row" className="px-2 py-2 text-start">
									<span className="flex items-center gap-3 font-semibold">
										<ItemIcon src={puzzle.img} size={40} />
										{puzzle.name}
									</span>
								</th>
								<td className="px-2 py-2 text-end font-mono">
									{formatNumber(puzzle.pieces.length)}
								</td>
								{STAR_LEVELS.map((stars) => (
									<td key={stars} className="px-2 py-2 text-end font-mono">
										{formatNumber(split[stars])}
									</td>
								))}
								<td className="px-2 py-2">
									<RewardLine reward={puzzle.reward} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</Card>
	);
}

function PuzzleCards({ puzzles }: { puzzles: TundraAlbumPuzzle[] }) {
	const t = useTranslations("wikiTundraAlbum.puzzles");
	const counts = useCountText();

	return (
		<ul className="flex flex-col gap-3 lg:hidden">
			{puzzles.map((puzzle) => {
				const split = tundraPuzzlePieceCounts(puzzle);
				return (
					<li key={puzzle.id}>
						<Card className="flex flex-col gap-3 p-3">
							<div className="flex items-center gap-3">
								<ItemIcon src={puzzle.img} size={48} />
								<div className="flex min-w-0 flex-col">
									<h3 className="font-semibold">{puzzle.name}</h3>
									<span className="text-muted">
										{counts.pieces(puzzle.pieces.length)}
									</span>
								</div>
							</div>
							<dl className="grid grid-cols-5 gap-2 text-center">
								{STAR_LEVELS.map((stars) => (
									<div key={stars} className="flex flex-col">
										<dt className="text-muted text-xs">
											{t("star", { stars: formatNumber(stars) })}
										</dt>
										<dd className="font-mono">{formatNumber(split[stars])}</dd>
									</div>
								))}
							</dl>
							<RewardLine reward={puzzle.reward} />
						</Card>
					</li>
				);
			})}
		</ul>
	);
}

function PuzzlesView({ album }: { album: TundraAlbum }) {
	const t = useTranslations("wikiTundraAlbum.puzzles");

	return (
		<RecordSection title={t("title")}>
			<PuzzleTable puzzles={album.puzzles} />
			<PuzzleCards puzzles={album.puzzles} />
		</RecordSection>
	);
}

function PieceTile({ piece }: { piece: TundraAlbumPiece }) {
	const t = useTranslations("wikiTundraAlbum.allPieces");

	return (
		<li className="bg-bg border-line flex flex-col gap-2 rounded-md border-[1.5px] p-2">
			{piece.img ? (
				<img
					src={piece.img}
					alt=""
					loading="lazy"
					className="aspect-220/198 w-full object-contain"
				/>
			) : (
				<span aria-hidden="true" className="bg-track aspect-220/198 w-full rounded-md" />
			)}
			<span className="font-semibold">{piece.name}</span>
			<span className="text-muted font-mono text-xs">
				{t("stars", { count: piece.stars, amount: formatNumber(piece.stars) })}
			</span>
		</li>
	);
}

function PiecesView({ album }: { album: TundraAlbum }) {
	const t = useTranslations("wikiTundraAlbum.allPieces");
	const counts = useCountText();

	return (
		<RecordSection
			title={t("title")}
			meta={t("summary", {
				pieces: counts.pieces(albumPieceCount(album)),
				puzzles: counts.puzzles(album.puzzles.length),
			})}
		>
			<p className="text-muted">{t("imageNote")}</p>
			{album.puzzles.map((puzzle) => (
				<div key={puzzle.id} className="flex flex-col gap-3">
					<div className="border-line flex items-baseline justify-between gap-3 border-b pb-1">
						<h3 className="font-semibold">{puzzle.name}</h3>
						<SectionLabel className="text-muted">
							{counts.pieces(puzzle.pieces.length)}
						</SectionLabel>
					</div>
					<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
						{puzzle.pieces.map((piece) => (
							<PieceTile key={piece.id} piece={piece} />
						))}
					</ul>
				</div>
			))}
		</RecordSection>
	);
}

export function TundraAlbumPage({ recordId }: WikiPageProps) {
	if (recordId !== undefined) return <WikiRecordMissing id="tundraAlbum" />;

	return <TundraAlbumPageContent />;
}

function TundraAlbumPageContent() {
	const t = useTranslations("wikiTundraAlbum");
	const [albumId, setAlbumId] = useState(allTundraAlbums[0].id);
	const [view, setView] = useState<AlbumView>("puzzles");
	const album =
		allTundraAlbums.find((candidate) => candidate.id === albumId) ?? allTundraAlbums[0];

	return (
		<WikiPageShell
			id="tundraAlbum"
			line={t("line", {
				have: formatNumber(allTundraAlbums.length),
				total: formatNumber(ALBUMS_IN_GAME),
				puzzles: formatNumber(TUNDRA_ALBUM_PUZZLES_PER_ALBUM),
			})}
		>
			<Note>
				{t("note", { missing: formatNumber(ALBUMS_IN_GAME - allTundraAlbums.length) })}
			</Note>
			<AlbumTiles albums={allTundraAlbums} activeId={album.id} onChange={setAlbumId} />
			<div>
				<SegmentedControl
					label={t("view.label")}
					options={VIEWS.map((id) => ({ id, label: t(`view.${id}`) }))}
					value={view}
					onChange={setView}
				/>
			</div>
			<AlbumSummary album={album} />
			{view === "puzzles" ? <PuzzlesView album={album} /> : <PiecesView album={album} />}
		</WikiPageShell>
	);
}

interface AlbumTilesProps {
	albums: TundraAlbum[];
	activeId: string;
	onChange: (albumId: string) => void;
}

function AlbumTiles({ albums, activeId, onChange }: AlbumTilesProps) {
	const t = useTranslations("wikiTundraAlbum");
	const counts = useCountText();

	return (
		<section className="flex flex-col gap-2" aria-label={t("albums")}>
			<h2 className="text-lg font-semibold">{t("albums")}</h2>
			<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{albums.map((candidate) => {
					const active = candidate.id === activeId;
					return (
						<li key={candidate.id}>
							<button
								type="button"
								aria-pressed={active}
								onClick={() => onChange(candidate.id)}
								className={`flex min-h-11 w-full flex-col gap-1 rounded-md border-[1.5px] p-3 text-start ${active ? "border-primary bg-tint" : "border-line bg-surface hover:bg-tint"}`}
							>
								<span className="font-semibold">{candidate.name}</span>
								<span className="text-muted font-mono text-xs">
									{counts.puzzles(candidate.puzzles.length)}
								</span>
								<span className="text-muted font-mono text-xs">
									{counts.pieces(albumPieceCount(candidate))}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

import type { TundraAlbum } from "whiteout-survival-data";
import type { Playthrough, TundraAlbumState } from "@/types/app";
import {
  allTundraAlbums,
  findTundraAlbum,
  TUNDRA_ALBUM_PUZZLES_PER_ALBUM,
  tundraAlbumPieceRewards,
  tundraAlbumPieceRewardsReached,
} from "@/data/game/tundraAlbum";

export interface AlbumView {
  album: TundraAlbum;
  doneIds: Set<string>;
  puzzlesDone: number;
  complete: boolean;
  /** Pieces collected: all pieces of a done puzzle, plus the pieces checked off in the others. */
  collectedIds: Set<string>;
  piecesCollected: number;
  piecesTotal: number;
}

const stateOf = (chief: Playthrough, albumId: string) =>
  chief.tundraAlbum?.[albumId] ?? {};

export const buildAlbumView = (
  chief: Playthrough,
  album: TundraAlbum,
): AlbumView => {
  const { puzzles: flags = {}, pieces: pieceFlags = {} } = stateOf(
    chief,
    album.id,
  );
  const doneIds = new Set(
    album.puzzles
      .filter((puzzle) => flags[puzzle.id])
      .map((puzzle) => puzzle.id),
  );
  const collectedIds = new Set(
    album.puzzles.flatMap((puzzle) =>
      puzzle.pieces
        .filter((piece) => doneIds.has(puzzle.id) || pieceFlags[piece.id])
        .map((piece) => piece.id),
    ),
  );
  return {
    album,
    doneIds,
    puzzlesDone: doneIds.size,
    complete: doneIds.size === TUNDRA_ALBUM_PUZZLES_PER_ALBUM,
    collectedIds,
    piecesCollected: collectedIds.size,
    piecesTotal: album.puzzles.reduce(
      (total, puzzle) => total + puzzle.pieces.length,
      0,
    ),
  };
};

export const buildAlbumViews = (chief: Playthrough): AlbumView[] =>
  allTundraAlbums.map((album) => buildAlbumView(chief, album));

export const completeAlbumCount = (views: AlbumView[]) =>
  views.filter((view) => view.complete).length;

export const totalPiecesCollected = (views: AlbumView[]) =>
  views.reduce((total, view) => total + view.piecesCollected, 0);

export const totalPiecesAvailable = (views: AlbumView[]) =>
  views.reduce((total, view) => total + view.piecesTotal, 0);

const withAlbumState = (
  chief: Playthrough,
  albumId: string,
  change: (state: TundraAlbumState) => TundraAlbumState,
): Playthrough => ({
  ...chief,
  tundraAlbum: {
    ...chief.tundraAlbum,
    [albumId]: change(stateOf(chief, albumId)),
  },
});

const withFlag = (
  flags: Record<string, boolean> | undefined,
  id: string,
  on: boolean,
) => {
  const { [id]: _previous, ...others } = flags ?? {};
  return on ? { ...others, [id]: true } : others;
};

/** Marking a puzzle done collects all its pieces. Unmarking it keeps the pieces collected. */
export const withPuzzleDone = (
  chief: Playthrough,
  albumId: string,
  puzzleId: string,
  done: boolean,
): Playthrough => {
  const puzzle = findTundraAlbum(albumId)?.puzzles.find(
    (item) => item.id === puzzleId,
  );
  if (!puzzle) return chief;
  return withAlbumState(chief, albumId, (state) => ({
    ...state,
    puzzles: withFlag(state.puzzles, puzzleId, done),
    pieces: done
      ? {
          ...state.pieces,
          ...Object.fromEntries(puzzle.pieces.map((piece) => [piece.id, true])),
        }
      : state.pieces,
  }));
};

export const withPieceCollected = (
  chief: Playthrough,
  albumId: string,
  pieceId: string,
  collected: boolean,
): Playthrough =>
  withAlbumState(chief, albumId, (state) => ({
    ...state,
    pieces: withFlag(state.pieces, pieceId, collected),
  }));

export const withAlbumComplete = (
  chief: Playthrough,
  albumId: string,
): Playthrough => {
  const album = findTundraAlbum(albumId);
  if (!album) return chief;
  return withAlbumState(chief, albumId, (state) => ({
    ...state,
    puzzles: Object.fromEntries(
      album.puzzles.map((puzzle) => [puzzle.id, true]),
    ),
    pieces: Object.fromEntries(
      album.puzzles.flatMap((puzzle) =>
        puzzle.pieces.map((piece) => [piece.id, true]),
      ),
    ),
  }));
};

/** The `tundraAlbums` input of the package `BuffProfile`: the ids of the complete albums. */
export const tundraAlbumBuffInputs = (chief: Playthrough): string[] =>
  buildAlbumViews(chief)
    .filter((view) => view.complete)
    .map((view) => view.album.id);

export interface PieceRewardTotal {
  itemId?: string;
  amount: number;
}

export interface PieceRewardsSummary {
  tiersReached: number;
  tierCount: number;
  nextTierPieces: number | null;
  totals: PieceRewardTotal[];
}

export const summarizePieceRewards = (pieces: number): PieceRewardsSummary => {
  const all = tundraAlbumPieceRewards();
  const reached = tundraAlbumPieceRewardsReached(pieces);
  const totals = new Map<string, PieceRewardTotal>();
  for (const reward of reached.flatMap((tier) => tier.rewards)) {
    const key = reward.itemId ?? "";
    const known = totals.get(key);
    totals.set(key, {
      itemId: reward.itemId,
      amount: (known?.amount ?? 0) + reward.amount,
    });
  }
  return {
    tiersReached: reached.length,
    tierCount: all.length,
    nextTierPieces: all[reached.length]?.pieces ?? null,
    totals: [...totals.values()],
  };
};

export interface PieceRewardTierView {
  tier: number;
  pieces: number;
  rewards: PieceRewardTotal[];
  reached: boolean;
  /** The first tier that is not reached yet. */
  next: boolean;
  missing: number;
}

/** Every piece count tier with its state for a total of collected pieces. */
export const pieceRewardTiers = (collected: number): PieceRewardTierView[] => {
  const tiers = tundraAlbumPieceRewards();
  const firstOpen = tiers.findIndex((tier) => tier.pieces > collected);
  return tiers.map((tier, index) => ({
    tier: tier.tier,
    pieces: tier.pieces,
    rewards: tier.rewards,
    reached: tier.pieces <= collected,
    next: index === firstOpen,
    missing: Math.max(0, tier.pieces - collected),
  }));
};

import type {
  TundraAlbum,
  TundraAlbumStars,
} from "@/data/game/wikiTundraAlbum";

export const STAR_LEVELS: TundraAlbumStars[] = [1, 2, 3, 4, 5];

export const albumPieceCount = (album: TundraAlbum) =>
  album.puzzles.reduce((sum, puzzle) => sum + puzzle.pieces.length, 0);

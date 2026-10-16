import {
  TUNDRA_ALBUM_PUZZLES_PER_ALBUM,
  tundraAlbum,
  tundraAlbumPieceRewards,
  tundraAlbumPieceRewardsReached,
  tundraPuzzlePieceCounts,
} from "whiteout-survival-data";
import type {
  TundraAlbum,
  TundraAlbumPieceRewardTier,
  TundraAlbumReward,
} from "whiteout-survival-data";

export const allTundraAlbums: TundraAlbum[] = tundraAlbum().get();

export const findTundraAlbum = (id: string) => tundraAlbum().find(id);

export const ALBUMS_IN_GAME = 16;

export {
  TUNDRA_ALBUM_PUZZLES_PER_ALBUM,
  tundraAlbumPieceRewards,
  tundraAlbumPieceRewardsReached,
  tundraPuzzlePieceCounts,
};
export type { TundraAlbumPieceRewardTier, TundraAlbumReward };

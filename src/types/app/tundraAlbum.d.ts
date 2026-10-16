export interface TundraAlbumState {
  /** A puzzle that is not done has no entry. */
  puzzles?: Record<string, boolean>;
  /**
   * The pieces the chief has collected, by piece id. A done puzzle has all its pieces collected, so
   * marking a puzzle done also writes its pieces.
   */
  pieces?: Record<string, boolean>;
}

export interface VipState {
  /** The total VIP XP. The level is always derived from it with `vip().atXp`. */
  totalXp?: number;
  /** The last sign-in that the sign-in button counted. `day` is the UTC day (YYYY-MM-DD). */
  signIn?: { streak: number; day: string };
}

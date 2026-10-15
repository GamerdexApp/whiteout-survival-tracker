import { LuStar } from "react-icons/lu";

const MAX_STARS = 3;

/**
 * The tier of a gear level is a name such as MythicT2. Only a tier with a T suffix shows a
 * number, so Common, Rare, Epic, Mythic and Legendary show none.
 */
export const tierNumberOf = (tier: string | undefined) => {
	const match = tier?.match(/T(\d+)$/);
	return match ? Number(match[1]) : null;
};

interface GearTierBadgeProps {
	tier: string | undefined;
	stars: number | undefined;
}

/**
 * Drawn over the corner of a gear icon. The T number hangs off the top left. The stars stack up
 * the left side from the bottom, under the T.
 */
export function GearTierBadge({ tier, stars }: GearTierBadgeProps) {
	const tierNumber = tierNumberOf(tier);
	const starCount = Math.min(MAX_STARS, Math.max(0, stars ?? 0));
	if (tierNumber === null && starCount === 0) return null;

	return (
		<>
			{tierNumber !== null && (
				<span
					aria-hidden="true"
					className="bg-sb-bg text-sb-text absolute -top-2 -left-2 rounded px-1 font-mono text-[11px] leading-4 font-semibold"
				>
					T{tierNumber}
				</span>
			)}
			{starCount > 0 && (
				<span
					aria-hidden="true"
					className="absolute bottom-0 left-0.5 flex flex-col-reverse"
				>
					{Array.from({ length: starCount }, (_, index) => (
						<LuStar
							key={index}
							size={12}
							className="text-gold fill-current drop-shadow-[0_0_1px_rgba(0,0,0,0.9)]"
						/>
					))}
				</span>
			)}
			<span className="sr-only">
				{tierNumber !== null ? `Tier ${tierNumber}` : ""}
				{tierNumber !== null && starCount > 0 ? ", " : ""}
				{starCount > 0 ? `${starCount} ${starCount === 1 ? "star" : "stars"}` : ""}
			</span>
		</>
	);
}

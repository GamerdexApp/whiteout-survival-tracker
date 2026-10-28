import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { findDecoration } from "@/data/game/daybreak";
import { findItem } from "@/data/game/items";
import type { GameEventReward } from "@/data/game/labyrinth";
import { ItemIcon } from "@/comps/ui/ItemIcon";

const imageOf = ({ itemId, decorationId }: GameEventReward) => {
	if (itemId) return findItem(itemId)?.img;
	if (decorationId) return findDecoration(decorationId)?.img;
	return undefined;
};

export function RewardLine({ reward }: { reward: GameEventReward }) {
	const t = useTranslations("labyrinth.rewards");

	return (
		<span className="inline-flex items-center gap-2">
			<ItemIcon src={imageOf(reward)} size={20} />
			{reward.amount === undefined
				? t("lineNoAmount", { name: reward.name })
				: t("line", { amount: formatNumber(reward.amount), name: reward.name })}
		</span>
	);
}

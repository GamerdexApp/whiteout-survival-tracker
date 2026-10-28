import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { findDecoration } from "@/data/game/daybreak";
import type { GameEventReward } from "@/data/game/gameEvents";
import { findItem } from "@/data/game/items";
import { findSkin } from "@/data/game/skins";
import { ItemIcon } from "./ItemIcon";

const imageOf = ({ itemId, decorationId, skinId }: GameEventReward) => {
	if (itemId) return findItem(itemId)?.img;
	if (decorationId) return findDecoration(decorationId)?.img;
	if (skinId) return findSkin(skinId)?.img;
	return undefined;
};

/** The icon, amount and name of one event reward. The name stays English as game data. */
export function RewardLine({ reward }: { reward: GameEventReward }) {
	const t = useTranslations("ui.reward");

	return (
		<span className="inline-flex items-center gap-2">
			<ItemIcon src={imageOf(reward)} size={20} />
			{reward.amount === undefined
				? t("lineNoAmount", { name: reward.name })
				: t("line", { amount: formatNumber(reward.amount), name: reward.name })}
		</span>
	);
}

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { findItem } from "@/data/game/items";
import type { TundraAlbumReward } from "@/data/game/tundraAlbum";
import { ItemIcon } from "@/comps/ui/ItemIcon";

export function rewardItem(reward: TundraAlbumReward) {
	return reward.itemId ? findItem(reward.itemId) : undefined;
}

export function useRewardText() {
	const t = useTranslations("tundraAlbum.reward");

	return (reward: TundraAlbumReward) => {
		const values = {
			amount: formatNumber(reward.amount),
			item: rewardItem(reward)?.name ?? t("unknownItem"),
		};
		return reward.size === undefined
			? t("line", values)
			: t("sized", { ...values, size: formatNumber(reward.size) });
	};
}

export function RewardLine({ reward }: { reward: TundraAlbumReward }) {
	const rewardText = useRewardText();

	return (
		<span className="inline-flex items-center gap-2">
			<ItemIcon src={rewardItem(reward)?.img} size={20} />
			{rewardText(reward)}
		</span>
	);
}

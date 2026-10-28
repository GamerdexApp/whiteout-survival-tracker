import { formatNumber } from "@/lib/format";
import { itemName } from "@/data/game/dailies";
import { findItem } from "@/data/game/items";
import { ItemIcon } from "@/comps/ui/ItemIcon";

interface RewardAmountsProps {
	rewards: { itemId: string; amount: number }[];
}

export function RewardAmounts({ rewards }: RewardAmountsProps) {
	return (
		<span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
			{rewards.map((reward) => (
				<span key={reward.itemId} className="inline-flex items-center gap-1.5">
					<ItemIcon src={findItem(reward.itemId)?.img} size={16} />
					{formatNumber(reward.amount)} {itemName(reward.itemId)}
				</span>
			))}
		</span>
	);
}

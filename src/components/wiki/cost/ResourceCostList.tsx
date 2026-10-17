import { formatCompact, formatNumber } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { ItemIcon } from "@/comps/ui/ItemIcon";

interface ResourceCost {
	itemId: string;
	amount: number;
}

interface ResourceCostListProps {
	cost: ResourceCost[];
	exact?: boolean;
}

export function ResourceCostList({ cost, exact = false }: ResourceCostListProps) {
	return (
		<ul className="flex flex-wrap gap-x-3 gap-y-1">
			{cost.map(({ itemId, amount }) => {
				const item = findItem(itemId);
				return (
					<li key={itemId} className="inline-flex items-center gap-1.5 whitespace-nowrap">
						<ItemIcon src={item?.img} size={16} className="rounded-sm" />
						<span>
							{item?.name ?? itemId}{" "}
							<span className="font-mono">
								{exact ? formatNumber(amount) : formatCompact(amount)}
							</span>
						</span>
					</li>
				);
			})}
		</ul>
	);
}

import { formatNumber } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { ItemIcon } from "@/comps/ui/ItemIcon";

export interface ResultResource {
	itemId: string;
	amount: number;
	/** A name for a line that stands for more than one item. */
	name?: string;
	/** An icon for a line whose item has none. */
	img?: string;
}

/** The items that a plan uses, with the icon, the name and the amount of each. */
export function ResultResources({ items }: { items: ResultResource[] }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{items.map(({ itemId, amount, name, img }) => {
				const item = findItem(itemId);
				return (
					<div key={itemId} className="flex items-start gap-2">
						<ItemIcon src={img ?? item?.img} size={24} />
						<div className="flex flex-col">
							<span className="text-muted text-xs">
								{name ?? item?.name ?? itemId}
							</span>
							<span className="font-mono font-semibold">{formatNumber(amount)}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}

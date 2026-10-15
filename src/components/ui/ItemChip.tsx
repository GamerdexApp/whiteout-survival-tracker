import { formatCompact } from "@/lib/format";
import { findItem } from "@/data/game/items";

interface ItemChipProps {
	itemId?: string;
	name: string;
	count: number;
}

export function ItemChip({ itemId, name, count }: ItemChipProps) {
	const image = itemId ? findItem(itemId)?.img : undefined;

	return (
		<span className="inline-flex items-center gap-1.5 whitespace-nowrap">
			{image ? (
				<img src={image} alt="" width={16} height={16} className="size-4 shrink-0" />
			) : (
				<span aria-hidden="true" className="bg-track size-4 shrink-0 rounded-sm" />
			)}
			{formatCompact(count)} {name}
		</span>
	);
}

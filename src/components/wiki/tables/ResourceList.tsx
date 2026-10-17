import { formatCompact, formatNumber } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { ItemIcon } from "@/comps/ui/ItemIcon";

export interface ResourceEntry {
	itemId?: string;
	name?: string;
	amount: number;
	/** Text after the name, for example a price for each item. */
	suffix?: string;
}

interface ResourceListProps {
	entries: ResourceEntry[];
	exact?: boolean;
	emptyText: string;
}

const entryName = (entry: ResourceEntry) =>
	(entry.itemId ? findItem(entry.itemId)?.name : undefined) ?? entry.name ?? entry.itemId ?? "";

/** Resource ids resolve to the item name and icon. An entry without an item shows the plain square. */
export function ResourceList({ entries, exact = false, emptyText }: ResourceListProps) {
	if (entries.length === 0) return <span className="text-muted">{emptyText}</span>;

	return (
		<ul className="flex flex-wrap gap-x-3 gap-y-1">
			{entries.map((entry) => (
				<li
					key={`${entry.itemId ?? entry.name}`}
					className="inline-flex items-center gap-1.5 whitespace-nowrap"
				>
					<ItemIcon
						src={entry.itemId ? findItem(entry.itemId)?.img : undefined}
						size={16}
					/>
					{exact ? formatNumber(entry.amount) : formatCompact(entry.amount)}{" "}
					{entryName(entry)}
					{entry.suffix && <span className="text-muted"> {entry.suffix}</span>}
				</li>
			))}
		</ul>
	);
}

"use client";

import type { Item } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { stepFor } from "@/service/inventory";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { CountControl } from "./CountControl";

export const ITEM_COLUMNS = "grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_300px]";

interface ItemRowProps {
	item: Item;
	count: number;
	changed: boolean;
	onCountChange: (itemId: string, count: number) => void;
	onOpen: (item: Item) => void;
}

const MAX_SOURCES_SHOWN = 2;

function Sources({ sources }: { sources: string[] }) {
	const t = useTranslations("resources");
	if (sources.length === 0)
		return <span className="text-muted italic">{t("sourcesUnknown")}</span>;
	const extra = sources.length - MAX_SOURCES_SHOWN;
	return (
		<span className="line-clamp-2 wrap-break-word">
			{sources.slice(0, MAX_SOURCES_SHOWN).join(", ")}
			{extra > 0 && <span className="text-muted"> +{extra}</span>}
		</span>
	);
}

export function ItemRow({ item, count, changed, onCountChange, onOpen }: ItemRowProps) {
	const t = useTranslations("resources.itemRow");
	const isDesktop = useIsDesktop();
	const tint = changed ? "bg-tint" : "";
	const icon = <ItemIcon src={item.img} />;

	if (!isDesktop) {
		return (
			<li className={`border-line border-t-[1.5px] first:border-t-0 ${tint}`}>
				<button
					type="button"
					onClick={() => onOpen(item)}
					className="relative flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start"
				>
					{icon}
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="truncate font-medium">{item.name}</span>
						<span className="text-muted truncate text-xs">{item.category}</span>
					</span>
					<span className={`font-mono ${count === 0 ? "text-muted" : "font-medium"}`}>
						{formatNumber(count)}
						<span className="sr-only"> {t("owned")}</span>
					</span>
				</button>
			</li>
		);
	}

	return (
		<li
			className={`border-line grid ${ITEM_COLUMNS} items-center gap-3 border-t-[1.5px] px-4 py-0 first:border-t-0 ${tint}`}
		>
			<div className="flex min-w-0 items-center gap-3">
				{icon}
				<div className="flex min-w-0 flex-col">
					<button
						type="button"
						onClick={() => onOpen(item)}
						className="text-link min-h-9 min-w-9 truncate text-start font-medium hover:underline"
					>
						{item.name}
					</button>
					<span className="text-muted text-xs">{item.category}</span>
				</div>
			</div>
			<div className="min-w-0 text-xs">
				<Sources sources={item.sources} />
			</div>
			<CountControl
				name={item.name}
				value={count}
				step={stepFor(item.id)}
				onChange={(next) => onCountChange(item.id, next)}
			/>
		</li>
	);
}

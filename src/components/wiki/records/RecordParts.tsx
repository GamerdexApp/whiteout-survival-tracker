import Link from "next/link";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { UnknownValue } from "../UnknownValue";

export function RecordSection({
	title,
	meta,
	children,
}: {
	title: string;
	meta?: string;
	children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-3">
			<h2 className="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
				{title}
				{meta && <span className="text-muted font-mono text-sm font-normal">{meta}</span>}
			</h2>
			{children}
		</section>
	);
}

/** A number the package may store as 0 when it has no value. */
export function KnownNumber({ value }: { value: number | undefined }) {
	return value ? <>{formatNumber(value)}</> : <UnknownValue />;
}

export function RecordItem({ itemId, amount }: { itemId: string; amount: number }) {
	const item = findItem(itemId);

	return (
		<span className="inline-flex items-center gap-1.5">
			<ItemIcon src={item?.img} size={20} />
			<span>
				{item ? item.name : <UnknownValue />} {formatNumber(amount)}
			</span>
		</span>
	);
}

export function RecordItems({ items }: { items: { itemId: string; amount: number }[] }) {
	return (
		<span className="flex flex-col gap-1 max-lg:items-end">
			{items.map((item) => (
				<RecordItem key={item.itemId} itemId={item.itemId} amount={item.amount} />
			))}
		</span>
	);
}

export function RecordLink({
	page,
	recordId,
	children,
}: {
	page: "heroes" | "experts" | "pets";
	recordId: string;
	children: ReactNode;
}) {
	return (
		<Link
			href={`/wiki/${page}/${encodeURIComponent(recordId)}`}
			className="flex min-h-11 min-w-11 items-center gap-2 text-start font-semibold hover:underline lg:min-h-9 lg:min-w-9"
		>
			{children}
		</Link>
	);
}

export function RecordFilters({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-wrap gap-3 [&>*]:w-[calc(50%-0.375rem)] lg:[&>*]:w-40 [&>*:first-child]:w-full lg:[&>*:first-child]:w-auto lg:[&>*:first-child]:min-w-64 lg:[&>*:first-child]:flex-1">
			{children}
		</div>
	);
}

export function RecordTiles({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

export function RecordTile({ value, label }: { value: ReactNode; label: string }) {
	return (
		<Card className="flex min-w-0 flex-col gap-1 px-4 py-3">
			<span className="text-ink font-mono text-lg wrap-break-word">{value}</span>
			<span className="text-muted">{label}</span>
		</Card>
	);
}

"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { findItem } from "@/data/game/items";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { CountInput } from "./CountControl";

export const WRAPPING_LABEL = "min-w-0 leading-tight tracking-tight";
export const FOUR_PER_ROW_COLUMNS = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

interface CountFieldProps {
	img?: string;
	label: string;
	ownedLabel: string;
	count: number;
	onChange: (count: number) => void;
	labelClassName?: string;
}

export function CountField({
	img,
	label,
	ownedLabel,
	count,
	onChange,
	labelClassName = "w-9 shrink-0 lg:w-auto",
}: CountFieldProps) {
	return (
		<div className="flex min-w-0 items-center gap-2">
			<ItemIcon src={img} size={24} />
			<SectionLabel className={`text-muted ${labelClassName}`}>{label}</SectionLabel>
			<CountInput
				label={ownedLabel}
				value={count}
				onChange={onChange}
				className="w-full min-w-14 flex-1"
			/>
		</div>
	);
}

interface CountCellProps {
	itemId: string;
	label: string;
	count: number;
	onChange: (itemId: string, count: number) => void;
	labelClassName?: string;
}

export function CountCell({ itemId, label, count, onChange, labelClassName }: CountCellProps) {
	const t = useTranslations("resources.countControl");
	const item = findItem(itemId);
	if (!item) return null;

	return (
		<CountField
			img={item.img}
			label={label}
			ownedLabel={t("owned", { name: item.name })}
			count={count}
			onChange={(next) => onChange(itemId, next)}
			labelClassName={labelClassName}
		/>
	);
}

export function CountRow({
	title,
	columns,
	children,
}: {
	title?: string;
	columns: string;
	children: ReactNode;
}) {
	return (
		<div
			className={`flex flex-col gap-1.5 lg:grid lg:items-center lg:gap-3 ${title ? "lg:grid-cols-[11rem_minmax(0,1fr)]" : ""}`}
		>
			{title && <SectionLabel className="text-muted">{title}</SectionLabel>}
			<div className={`grid gap-x-3 gap-y-2 ${columns}`}>{children}</div>
		</div>
	);
}

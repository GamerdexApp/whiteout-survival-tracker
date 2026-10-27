"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatCompact } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import { BASE_RESOURCE_IDS, chestRows, packRows } from "@/service/coreResources";
import { ownedCount, withOwnedCount } from "@/service/inventory";
import { findItem } from "@/data/game/items";
import { CollapsibleSection } from "@/comps/ui/CollapsibleSection";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { CountInput } from "./CountControl";

interface CountCellProps {
	itemId: string;
	label: string;
	count: number;
	onChange: (itemId: string, count: number) => void;
}

function CountCell({ itemId, label, count, onChange }: CountCellProps) {
	const t = useTranslations("resources.countControl");
	const item = findItem(itemId);
	if (!item) return null;

	return (
		<div className="flex min-w-0 items-center gap-2">
			<ItemIcon src={item.img} size={24} />
			<SectionLabel className="text-muted w-9 shrink-0 lg:w-auto">{label}</SectionLabel>
			<CountInput
				label={t("owned", { name: item.name })}
				value={count}
				onChange={(next) => onChange(itemId, next)}
				className="w-full flex-1"
			/>
		</div>
	);
}

function CountRow({
	title,
	columns,
	children,
}: {
	title: string;
	columns: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-center lg:gap-3">
			<SectionLabel className="text-muted">{title}</SectionLabel>
			<div className={`grid gap-x-3 gap-y-2 ${columns}`}>{children}</div>
		</div>
	);
}

const PACK_COLUMNS = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";
const CHEST_COLUMNS = "grid-cols-1 sm:grid-cols-3";
const BASE_COLUMNS = "grid-cols-1 sm:grid-cols-2";

export function CoreResourcesTab({ chief }: { chief: Playthrough }) {
	const t = useTranslations("resources.core");
	const { updateData } = usePlaythrough();

	const setCount = (itemId: string, count: number) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) => withOwnedCount(current, itemId, count))
		);
	};

	const baseName = (resourceId: string) => findItem(resourceId)?.name ?? resourceId;

	return (
		<CollapsibleSection title={t("resourcesSection")} defaultOpen>
			<CountRow title={t("counts")} columns={BASE_COLUMNS}>
				{BASE_RESOURCE_IDS.map((resourceId) => (
					<CountCell
						key={resourceId}
						itemId={resourceId}
						label={baseName(resourceId)}
						count={ownedCount(chief, resourceId)}
						onChange={setCount}
					/>
				))}
			</CountRow>

			<div className="flex flex-col gap-3">
				<h3 className="font-medium">{t("backpack")}</h3>
				{packRows.map((row) => (
					<CountRow
						key={`${row.resourceId}-${row.secured}`}
						title={
							row.secured
								? t("secured", { name: baseName(row.resourceId) })
								: baseName(row.resourceId)
						}
						columns={PACK_COLUMNS}
					>
						{row.cells.map((cell) => (
							<CountCell
								key={cell.itemId}
								itemId={cell.itemId}
								label={formatCompact(cell.size)}
								count={ownedCount(chief, cell.itemId)}
								onChange={setCount}
							/>
						))}
					</CountRow>
				))}
				{chestRows.map((row) => (
					<CountRow
						key={String(row.secured)}
						title={row.secured ? t("customSecuredChests") : t("customChests")}
						columns={CHEST_COLUMNS}
					>
						{row.cells.map((cell) => (
							<CountCell
								key={cell.itemId}
								itemId={cell.itemId}
								label={t("level", { level: cell.level })}
								count={ownedCount(chief, cell.itemId)}
								onChange={setCount}
							/>
						))}
					</CountRow>
				))}
			</div>
		</CollapsibleSection>
	);
}

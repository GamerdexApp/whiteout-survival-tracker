import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatFurnaceLevel } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { formatShortDate } from "@/service/chiefs";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

interface ChiefCardProps {
	chief: Playthrough;
	isActive: boolean;
	onSetActive: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

function Unknown() {
	const t = useTranslations("chiefs");
	return <span className="text-muted">{t("unknown")}</span>;
}

export function ChiefCard({ chief, isActive, onSetActive, onEdit, onDelete }: ChiefCardProps) {
	const t = useTranslations("chiefs.card");
	const { ui } = useUiSettings();
	const furnaceLevel = chief.buildings?.furnace?.level;

	return (
		<Card highlighted={isActive} className="flex h-full flex-col gap-3 p-4">
			<div className="flex items-start justify-between gap-2">
				<h2 className="min-w-0 text-base font-semibold break-words">{chief.name}</h2>
				{isActive && <Badge tone="kept">{t("active")}</Badge>}
			</div>
			<p className="text-muted line-clamp-2">{chief.notes ?? t("noNotes")}</p>
			<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
				<dt className="text-muted">{t("furnace")}</dt>
				<dd className="font-medium">
					{furnaceLevel ? (
						formatFurnaceLevel(furnaceLevel, ui.furnaceFullLabels)
					) : (
						<Unknown />
					)}
				</dd>
				<dt className="text-muted">{t("state")}</dt>
				<dd className="font-medium">{chief.stateNumber ?? <Unknown />}</dd>
			</dl>
			<p className="text-muted text-xs">
				{t("created", { date: formatShortDate(chief.createdAt) })}
				<br />
				{t("lastModified", { date: formatShortDate(chief.lastModified) })}
			</p>
			<div className="mt-auto flex flex-wrap gap-2 pt-1">
				{!isActive && <Button onClick={onSetActive}>{t("setActive")}</Button>}
				<Button onClick={onEdit}>{t("edit")}</Button>
				<Button variant="danger" onClick={onDelete}>
					{t("delete")}
				</Button>
			</div>
		</Card>
	);
}

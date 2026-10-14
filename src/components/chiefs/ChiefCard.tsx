import type { Playthrough } from "@/types/app";
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
	return <span className="text-muted">Unknown</span>;
}

export function ChiefCard({ chief, isActive, onSetActive, onEdit, onDelete }: ChiefCardProps) {
	const furnaceLevel = chief.buildings?.furnace?.level;

	return (
		<Card highlighted={isActive} className="flex h-full flex-col gap-3 p-4">
			<div className="flex items-start justify-between gap-2">
				<h2 className="min-w-0 text-base font-semibold break-words">{chief.name}</h2>
				{isActive && <Badge tone="kept">Active</Badge>}
			</div>
			<p className="text-muted line-clamp-2">{chief.notes ?? "No notes"}</p>
			<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
				<dt className="text-muted">Furnace</dt>
				<dd className="font-medium">{furnaceLevel ?? <Unknown />}</dd>
				<dt className="text-muted">State</dt>
				<dd className="font-medium">{chief.stateNumber ?? <Unknown />}</dd>
			</dl>
			<p className="text-muted text-xs">
				Created: {formatShortDate(chief.createdAt)}
				<br />
				Last modified: {formatShortDate(chief.lastModified)}
			</p>
			<div className="mt-auto flex flex-wrap gap-2 pt-1">
				{!isActive && <Button onClick={onSetActive}>Set as active</Button>}
				<Button onClick={onEdit}>Edit</Button>
				<Button variant="danger" onClick={onDelete}>
					Delete
				</Button>
			</div>
		</Card>
	);
}

import { eventBuff } from "whiteout-survival-data";
import type { BuffApplicability } from "whiteout-survival-data";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const columns = [
	{ key: "cityBonusWarsBuffs", label: "City bonus" },
	{ key: "deploymentCapacity", label: "Deployment" },
	{ key: "territoryBonuses", label: "Territory" },
	{ key: "marchAccelerator", label: "March accel." },
] as const;

const wording: Record<BuffApplicability, string> = {
	yes: "Yes",
	no: "No",
	partial: "Partial",
};

export function EventBuffRules() {
	const events = eventBuff().get();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="text-base font-semibold">Event buff rules</h2>
				<span className="text-muted font-mono text-xs">
					eventBuff() has {events.length} rows
				</span>
			</div>
			<p className="text-muted">
				It says which bonus kinds still apply during an event. These are rules, not numbers,
				so nothing here is added to the totals above.
			</p>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[32rem] text-left">
					<thead>
						<tr>
							<th className="py-1 pr-3">
								<SectionLabel className="text-muted">Event</SectionLabel>
							</th>
							{columns.map((column) => (
								<th key={column.key} className="py-1 pr-3">
									<SectionLabel className="text-muted">
										{column.label}
									</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{events.map((event) => (
							<tr key={event.id} className="border-line border-t-[1.5px]">
								<td className="py-2 pr-3 font-medium">{event.name}</td>
								{columns.map((column) => (
									<td key={column.key} className="py-2 pr-3">
										{wording[event[column.key]]}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

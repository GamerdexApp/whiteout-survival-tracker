import type { SetBonusView } from "@/service/chiefGear";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";

export function SetBonusCard({ bonuses }: { bonuses: SetBonusView[] }) {
	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">Set bonuses unlocked</h3>
				<span className="text-muted font-mono text-xs">Package</span>
			</div>
			<ul className="grid gap-3 sm:grid-cols-2">
				{bonuses.map((bonus) => {
					const active = bonus.percent > 0;
					return (
						<li
							key={bonus.pieces}
							className={`flex flex-col gap-1 rounded-md border-[1.5px] p-3 ${active ? "border-primary bg-tint" : "border-line border-dashed"}`}
						>
							<span className="flex items-center justify-between gap-2">
								<span className="font-medium">{bonus.pieces} piece set</span>
								<Badge tone={active ? "kept" : "locked"}>
									{active ? "Active" : "Not active"}
								</Badge>
							</span>
							{active ? (
								<>
									<span className="font-mono text-lg">
										{bonus.stat} +{bonus.percent}%
									</span>
									<span className="text-muted text-xs">
										{bonus.tierName} pieces, for Infantry, Lancer and Marksman
									</span>
								</>
							) : (
								<span className="text-muted">
									Needs {bonus.pieces} pieces of the same tier. {bonus.stat} +0%
									for now.
								</span>
							)}
						</li>
					);
				})}
			</ul>
		</Card>
	);
}

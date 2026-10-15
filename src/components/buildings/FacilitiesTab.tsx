"use client";

import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { levelOrder, withFacilityBuilt } from "@/service/buildings";
import { updateChiefById } from "@/service/chiefs";
import { allFacilities, furnace } from "@/data/game/buildings";
import { Card } from "@/comps/ui/Card";
import { StatTile } from "@/comps/ui/StatTile";
import { Switch } from "@/comps/ui/Switch";

export function FacilitiesTab({ chief }: { chief: Playthrough }) {
	const { updateData } = usePlaythrough();
	const furnaceOrder = levelOrder(furnace, chief.buildings?.furnace?.level);

	const facilities = allFacilities.map((facility) => {
		const built = chief.facilities?.[facility.id]?.built === true;
		const unlocked = furnaceOrder >= levelOrder(furnace, String(facility.unlockFurnaceLevel));
		return { facility, built, unlocked };
	});
	const builtCount = facilities.filter((item) => item.built).length;
	const unlockedCount = facilities.filter((item) => item.unlocked).length;

	return (
		<>
			<p className="text-muted">
				Facilities in your city. Mark the ones you have built. These are city facilities,
				not the alliance facilities on the Alliance menu.
			</p>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<StatTile
					value={`${builtCount} of ${facilities.length}`}
					label="Facilities built"
					emphasis
				/>
				<StatTile
					value={`${unlockedCount} of ${facilities.length}`}
					label="Unlocked at your Furnace level"
				/>
			</div>
			<ul className="gap-4 md:columns-2 xl:columns-3">
				{facilities.map(({ facility, built, unlocked }) => {
					const locked = !built && !unlocked;
					return (
						<li key={facility.id} className="mb-4 break-inside-avoid">
							<Card
								className={`flex flex-col gap-3 p-4 ${locked ? "opacity-70" : ""}`}
							>
								<div className="flex items-center gap-3">
									<img
										src={facility.img}
										alt=""
										width={40}
										height={40}
										className="size-10 shrink-0 rounded-md"
									/>
									<h3 className="flex-1 font-semibold">{facility.name}</h3>
									<Switch
										label={`${facility.name} built`}
										checked={built}
										disabled={locked}
										onChange={(next) =>
											updateData((data) =>
												updateChiefById(data, chief.id, (current) =>
													withFacilityBuilt(current, facility.id, next)
												)
											)
										}
									/>
								</div>
								<p className="text-muted">{facility.description}</p>
								<div className="flex items-center justify-between gap-3 text-xs">
									<span>
										{locked ? "Requires" : "Unlocks at"} Furnace{" "}
										{facility.unlockFurnaceLevel}
									</span>
									<span className="text-muted font-mono">
										{built ? "Built" : "Not built"}
									</span>
								</div>
							</Card>
						</li>
					);
				})}
			</ul>
		</>
	);
}

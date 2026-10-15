"use client";

import { useState } from "react";
import type { Playthrough } from "@/types/app";
import type { MaxOutOptions } from "@/service/heroes";
import { buildHeroViews, defaultMaxOutOptions, maxOutTargets } from "@/service/heroes";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Input } from "@/comps/ui/Input";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SwitchRow } from "@/comps/ui/Switch";

interface HeroMaxOutDialogProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onApply: (options: MaxOutOptions) => void;
}

export function HeroMaxOutDialog({ open, chief, onClose, onApply }: HeroMaxOutDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} title="Max out heroes">
			<MaxOutForm chief={chief} onClose={onClose} onApply={onApply} />
		</Dialog>
	);
}

function MaxOutForm({
	chief,
	onClose,
	onApply,
}: {
	chief: Playthrough;
	onClose: () => void;
	onApply: (options: MaxOutOptions) => void;
}) {
	const [options, setOptions] = useState<MaxOutOptions>(defaultMaxOutOptions);
	const count = maxOutTargets(chief, options).length;
	const anyTrack = options.starAndTier || options.level || options.skills || options.weapon;
	const [search, setSearch] = useState("");
	const views = buildHeroViews(chief);
	const listed = views.filter((view) =>
		view.hero.name.toLowerCase().includes(search.trim().toLowerCase())
	);
	const toggleHero = (heroId: string) =>
		set({
			heroIds: options.heroIds.includes(heroId)
				? options.heroIds.filter((id) => id !== heroId)
				: [...options.heroIds, heroId],
		});
	const set = (patch: Partial<MaxOutOptions>) => setOptions({ ...options, ...patch });

	return (
		<>
			<RadioGroup
				label="Heroes to max out"
				options={[
					{ id: "owned", label: "Owned heroes" },
					{ id: "unlocked", label: "All unlocked heroes, marked as owned" },
					{ id: "selected", label: "Choose heroes, marked as owned" },
				]}
				value={options.scope}
				onChange={(scope) => set({ scope })}
			/>
			{options.scope === "selected" && (
				<div className="flex flex-col gap-2">
					<Input
						type="search"
						aria-label="Search heroes to choose"
						placeholder="Search heroes by name"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<div className="flex gap-2">
						<Button
							variant="link"
							onClick={() =>
								set({
									heroIds: [
										...new Set([
											...options.heroIds,
											...listed.map((view) => view.hero.id),
										]),
									],
								})
							}
						>
							Select shown
						</Button>
						<Button variant="link" onClick={() => set({ heroIds: [] })}>
							Clear
						</Button>
					</div>
					<ul className="border-line grid max-h-60 gap-x-3 overflow-y-auto rounded-md border-[1.5px] p-2 sm:grid-cols-2">
						{listed.map((view) => (
							<li key={view.hero.id}>
								<label className="flex min-h-9 cursor-pointer items-center gap-2">
									<input
										type="checkbox"
										className="accent-primary size-4"
										checked={options.heroIds.includes(view.hero.id)}
										onChange={() => toggleHero(view.hero.id)}
									/>
									<span>{view.hero.name}</span>
									<span className="text-muted font-mono text-xs">
										{view.owned ? "owned" : ""}
									</span>
								</label>
							</li>
						))}
					</ul>
				</div>
			)}
			<div className="flex flex-col">
				<SwitchRow
					label="Star and tier to 5.0"
					checked={options.starAndTier}
					onChange={(starAndTier) => set({ starAndTier })}
				/>
				<SwitchRow
					label="Level to 80"
					description="Turn off when the skills are maxed and the level of older heroes stays at 1."
					checked={options.level}
					onChange={(level) => set({ level })}
				/>
				<SwitchRow
					label="Skills to 5"
					description="Exploration, Expedition and Talent."
					checked={options.skills}
					onChange={(skills) => set({ skills })}
				/>
				<SwitchRow
					label="Exclusive weapon to 10"
					checked={options.weapon}
					onChange={(weapon) => set({ weapon })}
				/>
			</div>
			<p className="text-muted">
				Anything switched off stays as it is. Shard counts and goals are not changed. You
				can undo after applying.
			</p>
			<div className="flex justify-end gap-2">
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="primary"
					disabled={!anyTrack || count === 0}
					onClick={() => onApply(options)}
				>
					Max out {count} {count === 1 ? "hero" : "heroes"}
				</Button>
			</div>
		</>
	);
}

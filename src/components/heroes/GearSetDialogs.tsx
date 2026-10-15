"use client";

import type { Hero } from "whiteout-survival-data";
import Link from "next/link";
import { useState } from "react";
import type { HeroGearQuality, HeroGearSet, TroopType } from "@/types/app";
import type { EditedSetValues, NewSetValues } from "@/service/heroGear";
import { allTroopTypes, nextSetName, troopLabel } from "@/service/heroGear";
import { DEFAULT_QUALITY, gearQualities } from "@/data/game/heroGear";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";

interface AddGearSetDialogProps {
	open: boolean;
	sets: HeroGearSet[];
	heroes: Hero[];
	onClose: () => void;
	onAdd: (values: NewSetValues) => void;
}

export function AddGearSetDialog({ open, sets, heroes, onClose, onAdd }: AddGearSetDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} title="Add gear set">
			<AddForm sets={sets} heroes={heroes} onClose={onClose} onAdd={onAdd} />
		</Dialog>
	);
}

function AddForm({
	sets,
	heroes,
	onClose,
	onAdd,
}: {
	sets: HeroGearSet[];
	heroes: Hero[];
	onClose: () => void;
	onAdd: (values: NewSetValues) => void;
}) {
	const [name, setName] = useState(() => nextSetName(sets));
	const [troopType, setTroopType] = useState<TroopType>("infantry");
	const [quality, setQuality] = useState<HeroGearQuality>(DEFAULT_QUALITY);
	const [heroId, setHeroId] = useState("");
	const [copyFromId, setCopyFromId] = useState("");
	const trimmed = name.trim();

	return (
		<form
			className="flex flex-col gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				if (trimmed)
					onAdd({
						name: trimmed,
						troopType,
						quality,
						heroId: heroId || null,
						copyFromId: copyFromId || null,
					});
			}}
		>
			<Field label="Set name" error={trimmed ? undefined : "Enter a name."}>
				<Input
					data-autofocus
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</Field>
			<Field
				label="Linked hero"
				optional
				hint="Choosing a hero sets the troop type to its class."
			>
				<HeroSelect
					heroes={heroes}
					value={heroId}
					onChange={(id) => {
						setHeroId(id);
						const hero = heroes.find((item) => item.id === id);
						if (hero) setTroopType(hero.class.toLowerCase() as TroopType);
					}}
				/>
			</Field>
			<Field label="Troop type" hint="The troop type picks the stat column of the set.">
				<Select
					value={troopType}
					onChange={(event) => setTroopType(event.target.value as TroopType)}
				>
					{allTroopTypes.map((troop) => (
						<option key={troop} value={troop}>
							{troopLabel(troop)}
						</option>
					))}
				</Select>
			</Field>
			<Field
				label="Gear quality"
				hint={
					copyFromId
						? "A copied set keeps the quality of each piece."
						: "Only Mythic gear can be forged and empowered."
				}
			>
				<Select
					value={quality}
					disabled={copyFromId !== ""}
					onChange={(event) => setQuality(event.target.value as HeroGearQuality)}
				>
					{gearQualities.map((item) => (
						<option key={item.id} value={item.id}>
							{item.label}
						</option>
					))}
				</Select>
			</Field>
			<Field label="Start from" hint="Goals are not copied. Goals are set in Plan.">
				<Select value={copyFromId} onChange={(event) => setCopyFromId(event.target.value)}>
					<option value="">Empty set</option>
					{sets.map((set) => (
						<option key={set.id} value={set.id}>
							Copy levels from {set.name}
						</option>
					))}
				</Select>
			</Field>
			<p className="text-muted">
				Every change saves at once and the new set appears selected.
			</p>
			<div className="flex justify-end gap-2">
				<Button onClick={onClose}>Cancel</Button>
				<Button type="submit" variant="primary" disabled={!trimmed}>
					Add gear set
				</Button>
			</div>
		</form>
	);
}

interface DeleteGearSetDialogProps {
	set: HeroGearSet | null;
	onClose: () => void;
	onDelete: (set: HeroGearSet) => void;
}

export function DeleteGearSetDialog({ set, onClose, onDelete }: DeleteGearSetDialogProps) {
	return (
		<Dialog
			open={set !== null}
			onClose={onClose}
			title={set ? `Delete ${set.name}?` : "Delete set"}
			footer={
				<>
					<Button onClick={onClose}>Cancel</Button>
					<Button variant="danger" data-autofocus onClick={() => set && onDelete(set)}>
						Delete set
					</Button>
				</>
			}
		>
			<p>
				The four pieces of {set?.name} and their goals are removed from this device and from
				synced devices at the next sync.
			</p>
			<p className="text-muted">
				You can undo for 10 seconds after deleting.{" "}
				<Link href="/settings" className="text-link underline">
					Export a backup first
				</Link>
			</p>
		</Dialog>
	);
}

interface EditGearSetDialogProps {
	set: HeroGearSet | null;
	heroes: Hero[];
	onClose: () => void;
	onSave: (set: HeroGearSet, values: EditedSetValues) => void;
}

export function EditGearSetDialog({ set, heroes, onClose, onSave }: EditGearSetDialogProps) {
	return (
		<Dialog open={set !== null} onClose={onClose} title={set ? `Edit ${set.name}` : "Edit set"}>
			{set && <EditForm set={set} heroes={heroes} onClose={onClose} onSave={onSave} />}
		</Dialog>
	);
}

function EditForm({
	set,
	heroes,
	onClose,
	onSave,
}: {
	set: HeroGearSet;
	heroes: Hero[];
	onClose: () => void;
	onSave: (set: HeroGearSet, values: EditedSetValues) => void;
}) {
	const [name, setName] = useState(set.name);
	const [heroId, setHeroId] = useState(set.heroId ?? "");
	const trimmed = name.trim();
	const unchanged = trimmed === set.name && heroId === (set.heroId ?? "");

	return (
		<form
			className="flex flex-col gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				if (trimmed) onSave(set, { name: trimmed, heroId: heroId || null });
			}}
		>
			<Field label="Set name" error={trimmed ? undefined : "Enter a name."}>
				<Input
					data-autofocus
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</Field>
			<Field label="Linked hero" optional>
				<HeroSelect heroes={heroes} value={heroId} onChange={setHeroId} />
			</Field>
			<div className="flex justify-end gap-2">
				<Button onClick={onClose}>Cancel</Button>
				<Button type="submit" variant="primary" disabled={!trimmed || unchanged}>
					Save set
				</Button>
			</div>
		</form>
	);
}

function HeroSelect({
	heroes,
	value,
	onChange,
}: {
	heroes: Hero[];
	value: string;
	onChange: (heroId: string) => void;
}) {
	return (
		<Select value={value} onChange={(event) => onChange(event.target.value)}>
			<option value="">No hero</option>
			{heroes.map((hero) => (
				<option key={hero.id} value={hero.id}>
					{hero.name} ({hero.class}, Gen {hero.generation})
				</option>
			))}
		</Select>
	);
}

"use client";

import type { Hero } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import type { HeroGearQuality, HeroGearSet, TroopType } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { EditedSetValues, NewSetValues } from "@/service/heroGear";
import { allTroopTypes, nextSetName, troopLabel } from "@/service/heroGear";
import { DEFAULT_QUALITY, gearQualityIds } from "@/data/game/heroGear";
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
	const t = useTranslations("heroGear.setDialogs");

	return (
		<Dialog open={open} onClose={onClose} title={t("add.title")}>
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
	const t = useTranslations("heroGear.setDialogs");
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
			<Field label={t("setName")} error={trimmed ? undefined : t("nameRequired")}>
				<Input
					data-autofocus
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</Field>
			<Field label={t("linkedHero")} optional hint={t("add.linkedHeroHint")}>
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
			<Field label={t("add.troopType")} hint={t("add.troopTypeHint")}>
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
				label={t("add.quality")}
				hint={copyFromId ? t("add.qualityHintCopy") : t("add.qualityHint")}
			>
				<Select
					value={quality}
					disabled={copyFromId !== ""}
					onChange={(event) => setQuality(event.target.value as HeroGearQuality)}
				>
					{gearQualityIds.map((id) => (
						<option key={id} value={id}>
							{t(`add.qualities.${id}`)}
						</option>
					))}
				</Select>
			</Field>
			<Field label={t("add.startFrom")} hint={t("add.startFromHint")}>
				<Select value={copyFromId} onChange={(event) => setCopyFromId(event.target.value)}>
					<option value="">{t("add.emptySet")}</option>
					{sets.map((set) => (
						<option key={set.id} value={set.id}>
							{t("add.copyFrom", { name: set.name })}
						</option>
					))}
				</Select>
			</Field>
			<p className="text-muted">{t("add.savesAtOnce")}</p>
			<div className="flex justify-end gap-2">
				<Button onClick={onClose}>{t("cancel")}</Button>
				<Button type="submit" variant="primary" disabled={!trimmed}>
					{t("add.submit")}
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
	const t = useTranslations("heroGear.setDialogs");

	return (
		<Dialog
			open={set !== null}
			onClose={onClose}
			title={set ? t("delete.title", { name: set.name }) : t("delete.titleFallback")}
			footer={
				<>
					<Button onClick={onClose}>{t("cancel")}</Button>
					<Button variant="danger" data-autofocus onClick={() => set && onDelete(set)}>
						{t("delete.confirm")}
					</Button>
				</>
			}
		>
			<p>{t("delete.body", { name: set?.name ?? "" })}</p>
			<p className="text-muted">
				{t("delete.undoNote")}{" "}
				<Link href="/settings" className="text-link underline">
					{t("delete.exportBackup")}
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
	const t = useTranslations("heroGear.setDialogs");

	return (
		<Dialog
			open={set !== null}
			onClose={onClose}
			title={set ? t("edit.title", { name: set.name }) : t("edit.titleFallback")}
		>
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
	const t = useTranslations("heroGear.setDialogs");
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
			<Field label={t("setName")} error={trimmed ? undefined : t("nameRequired")}>
				<Input
					data-autofocus
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</Field>
			<Field label={t("linkedHero")} optional>
				<HeroSelect heroes={heroes} value={heroId} onChange={setHeroId} />
			</Field>
			<div className="flex justify-end gap-2">
				<Button onClick={onClose}>{t("cancel")}</Button>
				<Button type="submit" variant="primary" disabled={!trimmed || unchanged}>
					{t("edit.submit")}
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
	const t = useTranslations("heroGear.setDialogs");

	return (
		<Select value={value} onChange={(event) => onChange(event.target.value)}>
			<option value="">{t("heroSelect.none")}</option>
			{heroes.map((hero) => (
				<option key={hero.id} value={hero.id}>
					{t("heroSelect.option", {
						name: hero.name,
						class: hero.class,
						generation: formatNumber(hero.generation),
					})}
				</option>
			))}
		</Select>
	);
}

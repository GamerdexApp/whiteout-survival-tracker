"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { MaxOutOptions } from "@/service/heroes";
import { buildHeroViews, defaultMaxOutOptions, maxOutTargets } from "@/service/heroes";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Input } from "@/comps/ui/Input";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SwitchRow } from "@/comps/ui/Switch";

const scopeIds: MaxOutOptions["scope"][] = ["owned", "unlocked", "selected"];

interface HeroMaxOutDialogProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onApply: (options: MaxOutOptions) => void;
}

export function HeroMaxOutDialog({ open, chief, onClose, onApply }: HeroMaxOutDialogProps) {
	const t = useTranslations("heroes.maxOut");

	return (
		<Dialog open={open} onClose={onClose} title={t("title")}>
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
	const t = useTranslations("heroes.maxOut");
	const tc = useTranslations("heroes.common");
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
				label={t("scopeLabel")}
				options={scopeIds.map((id) => ({ id, label: t(`scope.${id}`) }))}
				value={options.scope}
				onChange={(scope) => set({ scope })}
			/>
			{options.scope === "selected" && (
				<div className="flex flex-col gap-2">
					<Input
						type="search"
						aria-label={t("searchLabel")}
						placeholder={t("searchPlaceholder")}
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
							{t("selectShown")}
						</Button>
						<Button variant="link" onClick={() => set({ heroIds: [] })}>
							{t("clear")}
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
										{view.owned ? t("ownedTag") : ""}
									</span>
								</label>
							</li>
						))}
					</ul>
				</div>
			)}
			<div className="flex flex-col">
				<SwitchRow
					label={t("starAndTier")}
					checked={options.starAndTier}
					onChange={(starAndTier) => set({ starAndTier })}
				/>
				<SwitchRow
					label={t("level")}
					description={t("levelHint")}
					checked={options.level}
					onChange={(level) => set({ level })}
				/>
				<SwitchRow
					label={t("skills")}
					description={t("skillsHint")}
					checked={options.skills}
					onChange={(skills) => set({ skills })}
				/>
				<SwitchRow
					label={t("weapon")}
					checked={options.weapon}
					onChange={(weapon) => set({ weapon })}
				/>
			</div>
			<p className="text-muted">{t("note")}</p>
			<div className="flex justify-end gap-2">
				<Button onClick={onClose}>{t("cancel")}</Button>
				<Button
					variant="primary"
					disabled={!anyTrack || count === 0}
					onClick={() => onApply(options)}
				>
					{t("apply", {
						heroes: tc("heroCount", { count, amount: formatNumber(count) }),
					})}
				</Button>
			</div>
		</>
	);
}

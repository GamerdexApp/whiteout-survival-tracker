"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { LuChevronDown } from "react-icons/lu";
import { formatCompact } from "@/lib/format";
import { useDismiss } from "@/lib/hooks/useDismiss";
import type { HeroView } from "@/service/heroes";
import { Badge } from "@/comps/ui/Badge";

const RARITY_DOT_CLASSES: Record<string, string> = {
	Rare: "bg-added",
	Epic: "bg-fixed",
	Legendary: "bg-changed",
};

const OPTION_SELECTOR = '[role="option"]';

function HeroLabel({
	view,
	showBadges,
	power,
}: {
	view: HeroView;
	showBadges: boolean;
	power: number | null | undefined;
}) {
	const t = useTranslations("heroes.filtersFlyout");
	const tAdd = useTranslations("heroes.plan.add");
	const tCommon = useTranslations("heroes.common");
	const { hero } = view;

	return (
		<span className="flex min-w-0 flex-1 items-center gap-2">
			<span
				aria-hidden="true"
				className={`size-2.5 shrink-0 rounded-full ${RARITY_DOT_CLASSES[hero.rarity] ?? "bg-muted"}`}
			/>
			<span className="sr-only">{t(`rarities.${hero.rarity}`)}</span>
			<span className="truncate">{hero.name}</span>
			{showBadges && (
				<>
					<Badge tone="locked">
						{tAdd("generationShort", { generation: hero.generation })}
					</Badge>
					<Badge tone="locked">{t(`classes.${hero.class}`)}</Badge>
				</>
			)}
			{power !== undefined && <HeroPower power={power} unknown={tCommon("unknown")} />}
		</span>
	);
}

function HeroPower({ power, unknown }: { power: number | null; unknown: string }) {
	return power === null ? (
		<span className="text-muted ms-auto font-mono text-sm">{unknown}</span>
	) : (
		<span className="ms-auto font-mono text-sm">{formatCompact(power)}</span>
	);
}

interface HeroPickerProps {
	label: string;
	views: HeroView[];
	selectedId: string;
	onChange: (heroId: string) => void;
	/** Adds a first choice with this text that selects no hero. Its id is the empty string. */
	emptyLabel?: string;
	/** Shows the generation and class badges. Leave them out when the list holds one class only. */
	showBadges?: boolean;
	/** Gives the power shown at the end of each hero row. Without it no power shows. */
	powerOf?: (view: HeroView) => number | null;
}

/**
 * A native select cannot show the rarity dot and the class badge, so this list draws its own rows.
 */
export function HeroPicker({
	label,
	views,
	selectedId,
	onChange,
	emptyLabel,
	showBadges = true,
	powerOf,
}: HeroPickerProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const selected =
		views.find((view) => view.hero.id === selectedId) ?? (emptyLabel ? undefined : views[0]);

	useDismiss(containerRef, open, () => setOpen(false));

	const options = () =>
		Array.from(listRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []);

	const focusSelectedOption = (node: HTMLDivElement | null) => {
		listRef.current = node;
		const active = node?.querySelector<HTMLElement>('[aria-selected="true"]');
		active?.focus();
		active?.scrollIntoView({ block: "nearest" });
	};

	const choose = (heroId: string) => {
		onChange(heroId);
		setOpen(false);
		containerRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape" && open) {
			event.preventDefault();
			setOpen(false);
			containerRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
			return;
		}
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		event.preventDefault();
		if (!open) {
			setOpen(true);
			return;
		}
		const items = options();
		const index = items.indexOf(document.activeElement as HTMLElement);
		const step = event.key === "ArrowDown" ? 1 : -1;
		items[(index + step + items.length) % items.length]?.focus();
	};

	return (
		<div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
			<button
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={label}
				onClick={() => setOpen((current) => !current)}
				className="border-line bg-surface text-ink flex min-h-11 w-full items-center gap-2 rounded-md border-[1.5px] ps-3 pe-3 text-start lg:min-h-9"
			>
				{selected ? (
					<HeroLabel
						view={selected}
						showBadges={showBadges}
						power={powerOf?.(selected)}
					/>
				) : (
					<span className="text-muted min-w-0 flex-1 truncate">{emptyLabel}</span>
				)}
				<LuChevronDown size={16} aria-hidden="true" className="text-muted shrink-0" />
			</button>
			{open && (
				<div
					ref={focusSelectedOption}
					role="listbox"
					aria-label={label}
					className="border-line bg-surface text-ink absolute inset-x-0 top-full z-20 mt-1 flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-md border-[1.5px] p-1.5"
				>
					{[
						...(emptyLabel ? [{ id: "", content: <span>{emptyLabel}</span> }] : []),
						...views.map((view) => ({
							id: view.hero.id,
							content: (
								<HeroLabel
									view={view}
									showBadges={showBadges}
									power={powerOf?.(view)}
								/>
							),
						})),
					].map(({ id, content }) => {
						const active = id === (selected?.hero.id ?? "");
						return (
							<div
								key={id}
								role="option"
								aria-selected={active}
								tabIndex={-1}
								onClick={() => choose(id)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										choose(id);
									}
								}}
								className={`hover:bg-tint focus:bg-tint flex min-h-11 cursor-pointer items-center rounded-md px-2 outline-none lg:min-h-9 ${active ? "bg-tint" : ""}`}
							>
								{content}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

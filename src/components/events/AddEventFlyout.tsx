"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
	catalogMatches,
	CATEGORY_FILTERS,
	categoryCounts,
	defaultGives,
} from "@/service/eventsPage";
import type { CategoryFilter } from "@/service/eventsPage";
import type { GameEvent } from "@/data/game/gameEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { CATEGORY_BORDER } from "./eventStyle";
import { EventTag } from "./EventTag";

const PAGE_SIZE = 20;

interface AddEventFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onPick: (event: GameEvent) => void;
	onClose: () => void;
}

export function AddEventFlyout({ open, chief, onPick, onClose }: AddEventFlyoutProps) {
	const t = useTranslations("events");
	const [wasOpen, setWasOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<CategoryFilter>("all");
	const [shown, setShown] = useState(PAGE_SIZE);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setSearch("");
			setCategory("all");
			setShown(PAGE_SIZE);
		}
	}

	const counts = categoryCounts();
	const matches = catalogMatches(search, category);
	const added = new Set((chief.userEvents ?? []).map((state) => state.eventId));
	const visible = matches.slice(0, shown);

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("add.title")}
			description={t("add.description")}
			footer={<Button onClick={onClose}>{t("add.close")}</Button>}
		>
			<Input
				type="search"
				data-autofocus
				aria-label={t("add.searchLabel")}
				placeholder={t("add.searchPlaceholder", { amount: formatNumber(counts.all) })}
				leadingIcon={<LuSearch size={16} />}
				value={search}
				onChange={(event) => {
					setSearch(event.target.value);
					setShown(PAGE_SIZE);
				}}
			/>
			<div role="group" aria-label={t("add.categoryLabel")} className="flex flex-wrap gap-2">
				{CATEGORY_FILTERS.map((id) => (
					<button
						key={id}
						type="button"
						aria-pressed={category === id}
						onClick={() => {
							setCategory(id);
							setShown(PAGE_SIZE);
						}}
						className={`min-h-11 rounded-md border-[1.5px] px-3 lg:min-h-9 ${
							category === id
								? "border-primary bg-primary text-on-primary font-semibold"
								: "border-line bg-surface hover:bg-tint"
						}`}
					>
						{t("add.categoryTab", {
							name: t(id === "all" ? "add.all" : `categories.${id}`),
							amount: formatNumber(counts[id]),
						})}
					</button>
				))}
			</div>
			<p role="status" className="text-muted">
				{t("add.showing", {
					shown: formatNumber(visible.length),
					total: formatNumber(matches.length),
				})}
			</p>
			{matches.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("add.none")}</p>
				</Card>
			) : (
				<Card>
					<ul className="divide-line divide-y-[1.5px]">
						{visible.map((event) => (
							<li
								key={event.id}
								className="flex items-center justify-between gap-3 p-3"
							>
								<div
									className={`flex min-w-0 flex-col gap-1 border-s-[3px] ps-3 ${CATEGORY_BORDER[event.category]}`}
								>
									<span className="font-semibold">{event.name}</span>
									<span className="text-muted text-sm">
										{event.duration ?? t("add.noDuration")}
									</span>
									<span className="flex flex-wrap gap-2">
										<EventTag>{t(`categories.${event.category}`)}</EventTag>
										<EventTag>{t(`gives.${defaultGives(event)}`)}</EventTag>
									</span>
								</div>
								{added.has(event.id) ? (
									<EventTag>{t("add.added")}</EventTag>
								) : (
									<Button
										aria-label={t("add.addNamed", { name: event.name })}
										onClick={() => onPick(event)}
									>
										{t("add.button")}
									</Button>
								)}
							</li>
						))}
					</ul>
				</Card>
			)}
			{matches.length > visible.length && (
				<Button onClick={() => setShown(shown + PAGE_SIZE)}>{t("add.showMore")}</Button>
			)}
		</Flyout>
	);
}

"use client";

import { useTranslations } from "next-intl";
import type { UserEventState } from "@/types/app";
import { dateTimeText } from "@/service/eventsFormat";
import { rollForward } from "@/service/eventsSchedule";
import type { EventsZone } from "@/service/eventsSchedule";
import { CORE_EVENT_IDS, gameEventIdOf } from "@/data/game/coreEvents";
import { gameEventById } from "@/data/game/gameEvents";
import type { GameEvent } from "@/data/game/gameEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { useRepeatText } from "./MyEventsTab";

export const CYCLE_EVENT_IDS = CORE_EVENT_IDS.filter((id) => id !== "hall").map(
	(id) => gameEventIdOf[id]
);

interface CoreCyclesCardProps {
	states: UserEventState[];
	zone: EventsZone;
	nowMs: number;
	onSet: (event: GameEvent) => void;
	onEdit: (state: UserEventState) => void;
}

export function CoreCyclesCard({ states, zone, nowMs, onSet, onEdit }: CoreCyclesCardProps) {
	const t = useTranslations("events.cycles");
	const repeatText = useRepeatText();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex flex-col gap-1">
				<SectionLabel className="text-muted">{t("title")}</SectionLabel>
				<p className="text-muted">{t("hint")}</p>
			</div>
			<ul className="divide-line divide-y-[1.5px]">
				{CYCLE_EVENT_IDS.map((eventId) => {
					const event = gameEventById(eventId);
					if (!event) return null;
					const state = states.find((item) => item.eventId === eventId);
					const next = state ? rollForward(state, nowMs).runs[0] : undefined;
					return (
						<li
							key={eventId}
							className="flex flex-wrap items-center justify-between gap-2 py-2"
						>
							<ItemIcon src={event.img} size={28} />
							<div className="flex min-w-0 flex-1 flex-col">
								<span className="font-medium">{event.name}</span>
								<span className="text-muted">
									{state && next
										? t("next", {
												date: dateTimeText(Date.parse(next.startsAt), zone),
												repeat: repeatText(state.repeat),
											})
										: t("notSet")}
								</span>
							</div>
							<Button onClick={() => (state ? onEdit(state) : onSet(event))}>
								{state ? t("edit") : t("set")}
							</Button>
						</li>
					);
				})}
			</ul>
		</Card>
	);
}

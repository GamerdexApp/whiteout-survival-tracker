"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import type { ChiefValues, CoreEventId, Playthrough } from "@/types/app";
import { toChiefValues } from "@/service/chiefs";
import {
	allCoreEventIds,
	CHIEF_NAME_MAX_LENGTH,
	CHIEF_NOTES_MAX_LENGTH,
	coreEvents,
	DEFAULT_HERO_GENERATION,
	MAX_HERO_GENERATION,
	STATE_NUMBER_MAX,
} from "@/data/chief";
import { Button } from "@/comps/ui/Button";
import { CheckChip } from "@/comps/ui/CheckChip";
import { Dialog } from "@/comps/ui/Dialog";
import { Field } from "@/comps/ui/Field";
import { InfoPopover } from "@/comps/ui/InfoPopover";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";
import { Textarea } from "@/comps/ui/Textarea";

interface ChiefDialogProps {
	open: boolean;
	chief: Playthrough | null;
	onClose: () => void;
	onSubmit: (values: ChiefValues) => void;
}

interface FormErrors {
	name?: string;
	stateNumber?: string;
	serverStartDate?: string;
}

const todayIso = () => {
	const now = new Date();
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const generationLabel = (generation: number) =>
	generation === 0 ? "Generation 0 (pre-Legendary)" : `Generation ${generation}`;

const generations = Array.from({ length: MAX_HERO_GENERATION + 1 }, (_, index) => index);

export function ChiefDialog({ open, chief, onClose, onSubmit }: ChiefDialogProps) {
	const formId = useId();
	const isEditing = chief !== null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={isEditing ? "Edit chief" : "New chief"}
			description={isEditing ? undefined : "Name it. The rest is optional."}
			footer={
				<>
					<Button onClick={onClose}>Cancel</Button>
					<Button type="submit" form={formId} variant="primary">
						{isEditing ? "Save changes" : "Create chief"}
					</Button>
				</>
			}
		>
			<ChiefForm formId={formId} chief={chief} onSubmit={onSubmit} />
		</Dialog>
	);
}

function ChiefForm({
	formId,
	chief,
	onSubmit,
}: {
	formId: string;
	chief: Playthrough | null;
	onSubmit: (values: ChiefValues) => void;
}) {
	const initial = chief ? toChiefValues(chief) : null;
	const [name, setName] = useState(initial?.name ?? "");
	const [stateNumber, setStateNumber] = useState(initial?.stateNumber?.toString() ?? "");
	const [serverStartDate, setServerStartDate] = useState(initial?.serverStartDate ?? "");
	const [generation, setGeneration] = useState(
		initial?.heroGenerationUnlocked ?? DEFAULT_HERO_GENERATION
	);
	const [shownEvents, setShownEvents] = useState<CoreEventId[]>(
		initial?.coreEventsShown ?? allCoreEventIds
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [submitted, setSubmitted] = useState(false);

	const trimmedStateNumber = stateNumber.trim();
	const parsedStateNumber = trimmedStateNumber === "" ? undefined : Number(trimmedStateNumber);
	const stateNumberIsValid =
		parsedStateNumber === undefined ||
		(/^\d+$/.test(trimmedStateNumber) &&
			parsedStateNumber >= 1 &&
			parsedStateNumber <= STATE_NUMBER_MAX);

	const errors: FormErrors = {};
	if (name.trim() === "") errors.name = "Enter a name for this chief.";
	if (!stateNumberIsValid) {
		errors.stateNumber = `Enter a whole number from 1 to ${STATE_NUMBER_MAX}.`;
	}
	if (serverStartDate > todayIso()) {
		errors.serverStartDate = "Enter a date that is not in the future.";
	}
	const visibleErrors = submitted ? errors : {};

	const toggleEvent = (id: CoreEventId, checked: boolean) => {
		setShownEvents((current) =>
			allCoreEventIds.filter((eventId) =>
				eventId === id ? checked : current.includes(eventId)
			)
		);
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		setSubmitted(true);
		if (Object.keys(errors).length > 0) return;

		onSubmit({
			name: name.trim(),
			stateNumber: parsedStateNumber,
			serverStartDate: serverStartDate || undefined,
			heroGenerationUnlocked: generation,
			coreEventsShown: shownEvents,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			<Field label="Name" error={visibleErrors.name}>
				<Input
					data-autofocus
					value={name}
					maxLength={CHIEF_NAME_MAX_LENGTH}
					autoComplete="off"
					onChange={(event) => setName(event.target.value)}
				/>
			</Field>
			<Field
				label="State number"
				optional
				hint="The state your chief lives in. Whole number."
				error={visibleErrors.stateNumber}
			>
				<Input
					value={stateNumber}
					inputMode="numeric"
					autoComplete="off"
					onChange={(event) => setStateNumber(event.target.value)}
				/>
			</Field>
			<Field
				label="Server start date"
				optional
				error={visibleErrors.serverStartDate}
				labelAction={
					<InfoPopover label="Where to find the server start date">
						<p>Open the game and go to the Server screen from your profile.</p>
						<p>
							Read the date the server opened. If it only shows the server day number,
							count back that many days from today.
						</p>
						<p>No date on screen? Ask your alliance leader or check state chat.</p>
						<p>
							A date within 21 days either way is enough. Research unlocks use 150 and
							600 days, so three weeks of error rarely changes the result.
						</p>
					</InfoPopover>
				}
			>
				<Input
					type="date"
					value={serverStartDate}
					max={todayIso()}
					onChange={(event) => setServerStartDate(event.target.value)}
				/>
			</Field>
			<Field
				label="Heroes unlocked up to"
				hint="Heroes of later generations stay hidden on the Heroes page and in Plan."
			>
				<Select
					value={generation}
					onChange={(event) => setGeneration(Number(event.target.value))}
				>
					{generations.map((value) => (
						<option key={value} value={value}>
							{generationLabel(value)}
						</option>
					))}
				</Select>
			</Field>
			<fieldset className="flex flex-col gap-1.5">
				<legend className="flex w-full items-center gap-2 font-medium">
					Core events shown
					<span className="text-muted font-mono text-xs font-normal">
						{shownEvents.length} of {coreEvents.length}
					</span>
				</legend>
				<div className="grid gap-2 sm:grid-cols-2">
					{coreEvents.map((event) => (
						<CheckChip
							key={event.id}
							label={event.label}
							checked={shownEvents.includes(event.id)}
							onChange={(checked) => toggleEvent(event.id, checked)}
						/>
					))}
				</div>
				<p className="text-muted text-xs">
					Hidden events leave the Core events tabs and their Event log. Turn them back on
					any time.
				</p>
			</fieldset>
			<Field label="Notes" optional>
				<Textarea
					value={notes}
					maxLength={CHIEF_NOTES_MAX_LENGTH}
					onChange={(event) => setNotes(event.target.value)}
				/>
			</Field>
		</form>
	);
}

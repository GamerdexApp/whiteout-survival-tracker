"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import type { ChiefValues, CoreEventId, Playthrough, UnlockOverrides } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { toChiefValues } from "@/service/chiefs";
import {
	allCoreEventIds,
	CHIEF_NAME_MAX_LENGTH,
	CHIEF_NOTES_MAX_LENGTH,
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
import { UnlockSettings } from "./UnlockSettings";

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

const generations = Array.from({ length: MAX_HERO_GENERATION + 1 }, (_, index) => index);

export function ChiefDialog({ open, chief, onClose, onSubmit }: ChiefDialogProps) {
	const t = useTranslations("chiefs.dialog");
	const formId = useId();
	const isEditing = chief !== null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			variant="wide"
			title={isEditing ? t("editTitle") : t("newTitle")}
			description={isEditing ? undefined : t("newDescription")}
			footer={
				<>
					<Button onClick={onClose}>{t("cancel")}</Button>
					<Button type="submit" form={formId} variant="primary">
						{isEditing ? t("save") : t("create")}
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
	const t = useTranslations("chiefs.dialog");
	const tEvents = useTranslations("chiefs.coreEvents");
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
	const [unlockOverrides, setUnlockOverrides] = useState<UnlockOverrides>(
		initial?.unlockOverrides ?? {}
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
	if (name.trim() === "") errors.name = t("errors.name");
	if (!stateNumberIsValid) {
		errors.stateNumber = t("errors.stateNumber", { max: String(STATE_NUMBER_MAX) });
	}
	if (serverStartDate > todayIso()) {
		errors.serverStartDate = t("errors.serverStartDate");
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
			unlockOverrides: Object.keys(unlockOverrides).length > 0 ? unlockOverrides : undefined,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form
			id={formId}
			onSubmit={handleSubmit}
			noValidate
			className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-x-6"
		>
			<Field label={t("name")} error={visibleErrors.name}>
				<Input
					data-autofocus
					value={name}
					maxLength={CHIEF_NAME_MAX_LENGTH}
					autoComplete="off"
					onChange={(event) => setName(event.target.value)}
				/>
			</Field>
			<Field
				label={t("stateNumber.label")}
				optional
				hint={t("stateNumber.hint")}
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
				label={t("serverStartDate.label")}
				optional
				error={visibleErrors.serverStartDate}
				labelAction={
					<span className="-my-2 inline-flex">
						<InfoPopover label={t("serverStartDate.info.label")}>
							<p>{t("serverStartDate.info.screen")}</p>
							<p>{t("serverStartDate.info.date")}</p>
							<p>{t("serverStartDate.info.missing")}</p>
							<p>{t("serverStartDate.info.tolerance")}</p>
						</InfoPopover>
					</span>
				}
			>
				<Input
					type="date"
					value={serverStartDate}
					max={todayIso()}
					onChange={(event) => setServerStartDate(event.target.value)}
				/>
			</Field>
			<UnlockSettings
				leading={
					<Field label={t("generation.label")} hint={t("generation.hint")}>
						<Select
							value={generation}
							onChange={(event) => setGeneration(Number(event.target.value))}
						>
							{generations.map((value) => (
								<option key={value} value={value}>
									{value === 0
										? t("generation.preLegendary")
										: t("generation.numbered", {
												generation: formatNumber(value),
											})}
								</option>
							))}
						</Select>
					</Field>
				}
				serverStartDate={serverStartDate}
				overrides={unlockOverrides}
				onChange={setUnlockOverrides}
			/>
			<fieldset className="flex flex-col gap-1.5 lg:col-span-2">
				<legend className="flex w-full items-center gap-2 font-medium">
					{t("events.legend")}
					<span className="text-muted font-mono text-xs font-normal">
						{t("events.shownOf", {
							shown: formatNumber(shownEvents.length),
							total: formatNumber(allCoreEventIds.length),
						})}
					</span>
				</legend>
				<div className="grid gap-2 sm:grid-cols-2">
					{allCoreEventIds.map((id) => (
						<CheckChip
							key={id}
							label={tEvents(id)}
							checked={shownEvents.includes(id)}
							onChange={(checked) => toggleEvent(id, checked)}
						/>
					))}
				</div>
				<p className="text-muted text-xs">{t("events.hint")}</p>
			</fieldset>
			<div className="lg:col-span-2">
				<Field label={t("notes")} optional>
					<Textarea
						value={notes}
						maxLength={CHIEF_NOTES_MAX_LENGTH}
						onChange={(event) => setNotes(event.target.value)}
					/>
				</Field>
			</div>
		</form>
	);
}

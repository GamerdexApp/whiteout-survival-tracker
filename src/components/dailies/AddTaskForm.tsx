"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/comps/ui/Button";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import type { DailiesActions } from "./useDailiesActions";

interface AddTaskFormProps {
	actions: DailiesActions;
	inline?: boolean;
}

export function AddTaskForm({ actions, inline = false }: AddTaskFormProps) {
	const t = useTranslations("dailies.add");
	const [label, setLabel] = useState("");

	const submit = (event: FormEvent) => {
		event.preventDefault();
		const trimmed = label.trim();
		if (!trimmed) return;
		if (actions.add(trimmed)) setLabel("");
	};

	const input = (
		<Input
			aria-label={inline ? t("label") : undefined}
			placeholder={inline ? t("label") : t("placeholder")}
			value={label}
			onChange={(event) => setLabel(event.target.value)}
		/>
	);

	if (inline) {
		return (
			<form onSubmit={submit} className="flex items-center gap-2">
				<div className="min-w-0 flex-1">{input}</div>
				<Button type="submit" variant="primary" disabled={!label.trim()}>
					{t("button")}
				</Button>
			</form>
		);
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-3">
			<Field label={t("label")}>{input}</Field>
			<div>
				<Button type="submit" variant="primary" disabled={!label.trim()}>
					{t("button")}
				</Button>
			</div>
		</form>
	);
}

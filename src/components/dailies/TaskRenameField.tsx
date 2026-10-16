"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Input } from "@/comps/ui/Input";

interface TaskRenameFieldProps {
	label: string;
	onCommit: (label: string) => void;
	onDone?: () => void;
	autoFocus?: boolean;
}

export function TaskRenameField({ label, onCommit, onDone, autoFocus }: TaskRenameFieldProps) {
	const t = useTranslations("dailies.tasks");
	const [draft, setDraft] = useState(label);

	const commit = () => {
		const trimmed = draft.trim();
		if (trimmed && trimmed !== label) onCommit(trimmed);
		else setDraft(label);
		onDone?.();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			event.currentTarget.blur();
		}
		if (event.key === "Escape" && onDone) {
			event.preventDefault();
			event.stopPropagation();
			setDraft(label);
			onDone();
		}
	};

	return (
		<Input
			aria-label={t("renameField")}
			value={draft}
			autoFocus={autoFocus}
			data-autofocus={autoFocus ? "" : undefined}
			onChange={(event) => setDraft(event.target.value)}
			onBlur={commit}
			onKeyDown={handleKeyDown}
		/>
	);
}

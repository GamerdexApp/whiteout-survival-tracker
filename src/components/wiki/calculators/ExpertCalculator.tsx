"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { ExpertDraft } from "@/service/calcExpert";
import { expertsNotIn, newExpertDraft, runExpertCalculator } from "@/service/calcExpert";
import { allExperts } from "@/data/game/calcExpert";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Note } from "@/comps/ui/Note";
import { Select } from "@/comps/ui/Select";
import { ExpertGoalCard } from "./expert/ExpertGoalCard";
import { ExpertResults } from "./expert/ExpertResults";

export function ExpertCalculator() {
	const t = useTranslations("calcExpert");
	const [drafts, setDrafts] = useState<ExpertDraft[]>(() => [newExpertDraft(allExperts[0])]);
	const result = useMemo(() => runExpertCalculator(drafts), [drafts]);

	const replaceDraft = (next: ExpertDraft) =>
		setDrafts(drafts.map((draft) => (draft.expert.id === next.expert.id ? next : draft)));
	const removeDraft = (expertId: string) =>
		setDrafts(drafts.filter((draft) => draft.expert.id !== expertId));

	return (
		<div className="flex flex-col gap-6">
			<p className="text-muted">{t("intro")}</p>
			<section className="flex flex-col gap-3" aria-labelledby="expert-calc-goals">
				<h2 id="expert-calc-goals" className="text-lg font-semibold">
					{t("goals.title")}
				</h2>
				<AddExpert drafts={drafts} onAdd={(draft) => setDrafts([...drafts, draft])} />
				{drafts.length === 0 ? (
					<Note>{t("goals.empty")}</Note>
				) : (
					<div className="grid gap-3 xl:grid-cols-2">
						{drafts.map((draft) => (
							<ExpertGoalCard
								key={draft.expert.id}
								draft={draft}
								onChange={replaceDraft}
								onRemove={() => removeDraft(draft.expert.id)}
							/>
						))}
					</div>
				)}
			</section>
			{drafts.length > 0 && <ExpertResults result={result} />}
		</div>
	);
}

function AddExpert({
	drafts,
	onAdd,
}: {
	drafts: ExpertDraft[];
	onAdd: (draft: ExpertDraft) => void;
}) {
	const t = useTranslations("calcExpert.add");
	const [selectedId, setSelectedId] = useState("");
	const addable = expertsNotIn(drafts);
	const selected = addable.find((expert) => expert.id === selectedId) ?? addable[0];

	if (!selected) {
		return (
			<Card className="p-4">
				<p className="text-muted">{t("allAdded")}</p>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
			<div className="min-w-0 flex-1">
				<Field label={t("label")}>
					<Select
						value={selected.id}
						onChange={(event) => setSelectedId(event.target.value)}
					>
						{addable.map((expert) => (
							<option key={expert.id} value={expert.id}>
								{expert.name}
							</option>
						))}
					</Select>
				</Field>
			</div>
			<Button variant="primary" onClick={() => onAdd(newExpertDraft(selected))}>
				<LuPlus size={16} aria-hidden="true" />
				{t("button")}
			</Button>
		</Card>
	);
}

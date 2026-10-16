"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { Playthrough } from "@/types/app";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { useNow } from "@/lib/hooks/useNow";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief } from "@/service/chiefs";
import { cycleDateAt, readDailies, summarizeDailies } from "@/service/dailies";
import { PageHeader } from "@/comps/layout/PageHeader";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { ActivityCard } from "./ActivityCard";
import { AddTaskForm } from "./AddTaskForm";
import { EditTasksSheet } from "./EditTasksSheet";
import { MissionsCard } from "./MissionsCard";
import { ResetDialog } from "./ResetDialog";
import { ResetTimeCard } from "./ResetTimeCard";
import { StarterList } from "./StarterList";
import { SummaryCard } from "./SummaryCard";
import { TasksCard } from "./TasksCard";
import { useDailiesActions } from "./useDailiesActions";

type Section = "inGame" | "tasks";

export function DailiesView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("dailies");
	const { ui } = useUiSettings();
	const isDesktop = useIsDesktop();
	const now = useNow();
	const actions = useDailiesActions(chief);
	const addInputRef = useRef<HTMLDivElement>(null);
	const [section, setSection] = useState<Section>("inGame");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	const state = readDailies(chief);
	const cycle = cycleDateAt(now, state.resetTimeUtc);
	const summary = summarizeDailies(state, cycle);

	const startAddingTask = () => {
		if (isDesktop) addInputRef.current?.querySelector("input")?.focus();
		else setSheetOpen(true);
	};

	const confirmReset = () => {
		if (actions.resetNow()) setResetOpen(false);
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: chief.name,
					details: describeChief(chief, ui.furnaceFullLabels),
				})}
				actions={
					<ButtonLink href="/wiki/dailies" variant="secondary">
						{t("view.wiki")}
					</ButtonLink>
				}
			/>
			<SummaryCard
				summary={summary}
				resetTime={state.resetTimeUtc}
				nowMs={now}
				onReset={() => setResetOpen(true)}
			/>
			<div className="lg:hidden">
				<SegmentedControl
					label={t("view.sections")}
					value={section}
					onChange={setSection}
					options={[
						{ id: "inGame", label: t("view.inGame") },
						{ id: "tasks", label: t("view.myTasks") },
					]}
				/>
			</div>
			<div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
				<div
					className={`flex min-w-0 flex-col gap-6 ${section === "inGame" ? "" : "max-lg:hidden"}`}
				>
					<ActivityCard activeness={summary.activeness} />
					<MissionsCard state={state} cycle={cycle} actions={actions} />
				</div>
				<div
					className={`flex min-w-0 flex-col gap-6 ${section === "tasks" ? "" : "max-lg:hidden"}`}
				>
					<TasksCard
						state={state}
						cycle={cycle}
						actions={actions}
						onEditList={() => setSheetOpen(true)}
						onAddTask={startAddingTask}
					/>
					<div ref={addInputRef} className="max-lg:hidden">
						<Card className="flex flex-col gap-3 p-4">
							<h2 className="font-semibold">{t("add.title")}</h2>
							<AddTaskForm actions={actions} />
						</Card>
					</div>
					<ResetTimeCard resetTime={state.resetTimeUtc} actions={actions} />
					<div className="max-lg:hidden">
						<StarterList state={state} actions={actions} />
					</div>
				</div>
			</div>
			<EditTasksSheet
				open={sheetOpen}
				onClose={() => setSheetOpen(false)}
				state={state}
				actions={actions}
			/>
			<ResetDialog
				open={resetOpen}
				onClose={() => setResetOpen(false)}
				onConfirm={confirmReset}
				summary={summary}
				resetTime={state.resetTimeUtc}
			/>
		</>
	);
}

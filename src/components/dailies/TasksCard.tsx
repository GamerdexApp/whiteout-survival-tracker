"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import type { DailiesState } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { isTaskDone } from "@/service/dailies";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { IconButton } from "@/comps/ui/IconButton";
import { TaskRenameField } from "./TaskRenameField";
import type { DailiesActions } from "./useDailiesActions";

interface TasksCardProps {
	state: DailiesState;
	cycle: string;
	actions: DailiesActions;
	onEditList: () => void;
	onAddTask: () => void;
}

export function TasksCard({ state, cycle, actions, onEditList, onAddTask }: TasksCardProps) {
	const t = useTranslations("dailies.tasks");
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const doneCount = state.tasks.filter((task) => isTaskDone(state, task.id, cycle)).length;

	if (state.tasks.length === 0) {
		return (
			<EmptyState
				title={t("emptyTitle")}
				description={t("emptyDescription")}
				actions={
					<>
						<Button variant="primary" onClick={onAddTask}>
							{t("addButton")}
						</Button>
						<Button onClick={actions.restoreStarter}>{t("restoreStarter")}</Button>
					</>
				}
			/>
		);
	}

	return (
		<Card>
			<div className="border-line flex items-start justify-between gap-3 border-b-[1.5px] p-4">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold">{t("title")}</h2>
					<p className="text-muted max-lg:hidden">{t("intro")}</p>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-muted font-mono text-xs whitespace-nowrap">
						{t("count", {
							done: formatNumber(doneCount),
							total: formatNumber(state.tasks.length),
						})}
					</span>
					<Button className="lg:hidden" onClick={onEditList}>
						{t("editList")}
					</Button>
				</div>
			</div>
			<ul>
				{state.tasks.map((task, index) => {
					const done = isTaskDone(state, task.id, cycle);
					const renaming = renamingId === task.id;
					return (
						<li
							key={task.id}
							className="border-line flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1 not-last:border-b-[1.5px]"
						>
							{renaming ? (
								<div className="min-w-0 flex-1 py-2">
									<TaskRenameField
										autoFocus
										label={task.label}
										onCommit={(label) => actions.rename(task.id, label)}
										onDone={() => setRenamingId(null)}
									/>
								</div>
							) : (
								<div className="flex min-w-0 flex-1 flex-col">
									<label className="flex min-h-11 cursor-pointer items-center gap-3 lg:min-h-10">
										<input
											type="checkbox"
											checked={done}
											onChange={(event) =>
												actions.setDone(task.id, event.target.checked)
											}
											className="accent-primary size-5 shrink-0"
										/>
										<span className={done ? "text-muted line-through" : ""}>
											{task.label}
										</span>
									</label>
									<div className="flex gap-3 pb-1 pl-8 max-lg:hidden">
										<button
											type="button"
											className="text-link text-sm"
											onClick={() => setRenamingId(task.id)}
										>
											{t("rename")}
										</button>
										<button
											type="button"
											className="text-danger text-sm"
											onClick={() => actions.remove(task.id)}
										>
											{t("remove")}
										</button>
									</div>
								</div>
							)}
							<span className="text-muted border-line rounded-sm border-[1.5px] px-1.5 font-mono text-xs">
								{task.presetId ? t("preset") : t("custom")}
							</span>
							<div className="flex gap-1 max-lg:hidden">
								<IconButton
									label={t("moveUp", { label: task.label })}
									className="border-line border-[1.5px] disabled:cursor-not-allowed disabled:opacity-40"
									disabled={index === 0}
									onClick={() => actions.move(task.id, -1)}
								>
									<LuChevronUp aria-hidden="true" />
								</IconButton>
								<IconButton
									label={t("moveDown", { label: task.label })}
									className="border-line border-[1.5px] disabled:cursor-not-allowed disabled:opacity-40"
									disabled={index === state.tasks.length - 1}
									onClick={() => actions.move(task.id, 1)}
								>
									<LuChevronDown aria-hidden="true" />
								</IconButton>
							</div>
						</li>
					);
				})}
			</ul>
		</Card>
	);
}

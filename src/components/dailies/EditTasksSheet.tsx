"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuChevronDown, LuChevronUp, LuX } from "react-icons/lu";
import type { DailiesState } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { IconButton } from "@/comps/ui/IconButton";
import { AddTaskForm } from "./AddTaskForm";
import { ResetTimeSelect } from "./ResetTimeSelect";
import { StarterList } from "./StarterList";
import { TaskRenameField } from "./TaskRenameField";
import type { DailiesActions } from "./useDailiesActions";

const COLLAPSED_TASK_COUNT = 5;

interface EditTasksSheetProps {
	open: boolean;
	onClose: () => void;
	state: DailiesState;
	actions: DailiesActions;
}

export function EditTasksSheet({ open, onClose, state, actions }: EditTasksSheetProps) {
	const t = useTranslations("dailies");
	const [expanded, setExpanded] = useState(false);
	const hiddenCount = Math.max(0, state.tasks.length - COLLAPSED_TASK_COUNT);
	const shown = expanded ? state.tasks : state.tasks.slice(0, COLLAPSED_TASK_COUNT);

	const removeAndClose = (taskId: string) => {
		if (actions.remove(taskId)) onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={t("sheet.title")}
			description={t("sheet.count", {
				count: state.tasks.length,
				amount: formatNumber(state.tasks.length),
			})}
			footer={
				<Button variant="primary" className="w-full" onClick={onClose} data-autofocus>
					{t("sheet.done")}
				</Button>
			}
		>
			<ul className="flex flex-col gap-2">
				{shown.map((task, index) => (
					<li key={task.id} className="flex items-center gap-1">
						<div className="min-w-0 flex-1">
							<TaskRenameField
								key={task.label}
								label={task.label}
								onCommit={(label) => actions.rename(task.id, label)}
							/>
						</div>
						<IconButton
							label={t("tasks.moveUp", { label: task.label })}
							className="border-line border-[1.5px] disabled:cursor-not-allowed disabled:opacity-40"
							disabled={index === 0}
							onClick={() => actions.move(task.id, -1)}
						>
							<LuChevronUp aria-hidden="true" />
						</IconButton>
						<IconButton
							label={t("tasks.moveDown", { label: task.label })}
							className="border-line border-[1.5px] disabled:cursor-not-allowed disabled:opacity-40"
							disabled={index === state.tasks.length - 1}
							onClick={() => actions.move(task.id, 1)}
						>
							<LuChevronDown aria-hidden="true" />
						</IconButton>
						<IconButton
							label={t("tasks.removeNamed", { label: task.label })}
							className="text-danger hover:bg-tint"
							onClick={() => removeAndClose(task.id)}
						>
							<LuX aria-hidden="true" />
						</IconButton>
					</li>
				))}
			</ul>
			{hiddenCount > 0 && (
				<Button
					className="border-dashed"
					aria-expanded={expanded}
					onClick={() => setExpanded(!expanded)}
				>
					{expanded
						? t("sheet.fewer")
						: t("sheet.more", {
								count: hiddenCount,
								amount: formatNumber(hiddenCount),
							})}
				</Button>
			)}
			<div className="flex flex-col gap-2">
				<h3 className="font-medium">{t("add.title")}</h3>
				<AddTaskForm actions={actions} inline />
			</div>
			<div className="border-line border-t-[1.5px] pt-3">
				<StarterList state={state} actions={actions} inSheet />
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<span className="shrink-0">{t("reset.label")}</span>
					<div className="flex-1">
						<ResetTimeSelect value={state.resetTimeUtc} onChange={actions.setReset} />
					</div>
				</div>
				<p className="text-muted">{t("reset.helpSheet")}</p>
			</div>
		</Dialog>
	);
}

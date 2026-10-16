"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuListFilter, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import type { ExpertChange, Goals } from "@/service/experts";
import {
	applyExpertChange,
	buildExpertViews,
	countExpertFilters,
	defaultExpertFilters,
	filterExpertViews,
	summarizeExperts,
	withSavedExpertsPlan,
} from "@/service/experts";
import type { ExpertFilters } from "@/service/experts";
import {
	cancelJob,
	endsAtAfter,
	finishLearning,
	learningJob,
	withJobEndsAt,
} from "@/service/queues";
import { findExpert } from "@/data/game/experts";
import { expertGenerations } from "@/data/game/experts";
import { PageHeader } from "@/comps/layout/PageHeader";
import { ManageUpgradeFlyout } from "@/comps/queues/ManageUpgradeFlyout";
import type { ManageTarget } from "@/comps/queues/ManageUpgradeFlyout";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { StatTile } from "@/comps/ui/StatTile";
import { useToast } from "@/comps/ui/Toast";
import { ExpertCard } from "./ExpertCard";
import { ExpertFiltersFlyout } from "./ExpertFiltersFlyout";
import { ExpertLearning } from "./ExpertLearning";
import { ExpertPlanFlyout } from "./ExpertPlanFlyout";
import { StartLearningFlyout } from "./StartLearningFlyout";

export function ExpertsView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("experts");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [filters, setFilters] = useState<ExpertFilters>(defaultExpertFilters);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [planOpen, setPlanOpen] = useState(false);
	const [startOpen, setStartOpen] = useState(false);
	const [manageOpen, setManageOpen] = useState(false);
	const tl = useTranslations("experts.learning");

	const views = useMemo(() => buildExpertViews(chief), [chief]);
	const summary = useMemo(() => summarizeExperts(views), [views]);
	const visible = useMemo(() => filterExpertViews(views, filters), [views, filters]);
	const activeFilters = countExpertFilters(filters);

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const applyChange = (expertChange: ExpertChange) => {
		const before = chief;
		if (!change((current) => applyExpertChange(current, expertChange))) return;
		if (expertChange.kind !== "recruited" || expertChange.recruited) return;
		const name = views.find((view) => view.expert.id === expertChange.expertId)?.expert.name;
		if (!name) return;
		showToast({
			variant: "info",
			title: t("toast.notRecruitedTitle", { name }),
			message: t("toast.notRecruitedMessage"),
			action: { label: t("toast.undo"), onAction: () => change(() => before) },
		});
	};

	const job = learningJob(chief);
	const jobSkill = job ? findExpert(job.expertId)?.skills[job.skillIndex] : undefined;
	const jobExpert = job ? findExpert(job.expertId) : undefined;
	const jobText =
		job && jobExpert && jobSkill
			? tl("jobTitle", {
					expert: jobExpert.name,
					skill: jobSkill.name,
					session: `${formatNumber(job.exp)} EXP`,
				})
			: "";
	const manageTarget: ManageTarget | null =
		job && manageOpen
			? {
					title: tl("title"),
					summary: jobText,
					slotLabel: tl("slotLabel"),
					finishText: tl("manageFinishText"),
					job,
				}
			: null;

	const startLearningSession = (next: (current: Playthrough) => Playthrough, what: string) => {
		if (!change(next)) return;
		setStartOpen(false);
		showToast({
			variant: "success",
			title: tl("toasts.started.title"),
			message: tl("toasts.started.message", { what }),
		});
	};

	const finishLearningSession = () => {
		if (!job) return;
		const before = chief;
		if (!change((current) => finishLearning(current, job, new Date().toISOString()))) return;
		setManageOpen(false);
		showToast({
			variant: "success",
			title: tl("toasts.finished.title", { what: jobText }),
			message: tl("toasts.finished.message"),
			action: { label: tl("toasts.undo"), onAction: () => change(() => before) },
		});
	};

	const cancelLearningSession = () => {
		if (!job) return;
		const before = chief;
		if (!change((current) => cancelJob(current, { kind: "learning" }))) return;
		setManageOpen(false);
		showToast({
			variant: "warning",
			title: tl("toasts.cancelled.title", { what: jobText }),
			message: tl("toasts.cancelled.message"),
			action: { label: tl("toasts.undo"), onAction: () => change(() => before) },
		});
	};

	const savePlan = (goals: Goals) => {
		change((current) => withSavedExpertsPlan(current, goals, new Date().toISOString()));
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: chief.name,
					total: formatNumber(views.length),
				})}
			/>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatTile
					value={t("stats.recruitedValue", {
						count: formatNumber(summary.recruited),
						total: formatNumber(summary.total),
					})}
					label={t("stats.recruited")}
				/>
				<StatTile
					value={formatNumber(summary.powerNow)}
					label={t("stats.powerNow")}
					emphasis
				/>
				<StatTile
					value={formatNumber(summary.powerAtMax)}
					label={t("stats.powerAtMax", { total: formatNumber(summary.total) })}
				/>
				<StatTile
					value={
						summary.highest
							? t("stats.highestValue", {
									name: summary.highest.name,
									affinity: formatNumber(summary.highest.affinity),
								})
							: t("stats.highestNone")
					}
					label={t("stats.highest")}
				/>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						aria-label={t("toolbar.searchLabel")}
						placeholder={t("toolbar.searchPlaceholder")}
						leadingIcon={<LuSearch size={16} />}
						value={filters.search}
						onChange={(event) => setFilters({ ...filters, search: event.target.value })}
					/>
				</div>
				<div className="flex w-full gap-3 lg:w-auto">
					<Button className="flex-1 lg:flex-none" onClick={() => setFiltersOpen(true)}>
						<LuListFilter size={16} aria-hidden="true" />
						{t("toolbar.filters")}
						{activeFilters > 0 && (
							<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
								{activeFilters}
							</span>
						)}
					</Button>
					<Button className="flex-1 lg:flex-none" onClick={() => setStartOpen(true)}>
						{tl("startButton")}
					</Button>
					<Button
						variant="primary"
						className="flex-1 lg:flex-none"
						onClick={() => setPlanOpen(true)}
					>
						{t("common.plan")}
					</Button>
				</div>
			</div>
			<p role="status" className="text-muted">
				{t("toolbar.status", {
					shown: formatNumber(visible.length),
					total: formatNumber(views.length),
				})}
				{summary.lockedByAge > 0 &&
					` ${t("toolbar.lockedNote", { count: formatNumber(summary.lockedByAge) })}`}
			</p>

			<ExpertLearning
				chief={chief}
				onManage={() => setManageOpen(true)}
				onFinish={finishLearningSession}
			/>

			{visible.length === 0 ? (
				<EmptyState
					title={t("toolbar.emptyTitle")}
					description={t("toolbar.emptyDescription")}
					actions={
						<Button onClick={() => setFilters(defaultExpertFilters())}>
							{t("toolbar.reset")}
						</Button>
					}
				/>
			) : (
				<ul className="lg:columns-2 lg:gap-3">
					{visible.map((view) => (
						<ExpertCard
							key={view.expert.id}
							view={view}
							chief={chief}
							onChange={applyChange}
						/>
					))}
				</ul>
			)}

			<ExpertFiltersFlyout
				open={filtersOpen}
				filters={filters}
				generations={expertGenerations}
				shown={visible.length}
				onChange={setFilters}
				onReset={() => setFilters({ ...defaultExpertFilters(), search: filters.search })}
				onClose={() => setFiltersOpen(false)}
			/>
			<StartLearningFlyout
				open={startOpen}
				chief={chief}
				onClose={() => setStartOpen(false)}
				onStart={startLearningSession}
			/>
			<ManageUpgradeFlyout
				target={manageTarget}
				onClose={() => setManageOpen(false)}
				onSetSecondsLeft={(seconds) =>
					change((current) =>
						withJobEndsAt(
							current,
							{ kind: "learning" },
							endsAtAfter(new Date(), seconds)
						)
					)
				}
				onFinish={finishLearningSession}
				onCancel={cancelLearningSession}
			/>
			<ExpertPlanFlyout
				open={planOpen}
				chief={chief}
				onClose={() => setPlanOpen(false)}
				onSave={savePlan}
			/>
		</>
	);
}

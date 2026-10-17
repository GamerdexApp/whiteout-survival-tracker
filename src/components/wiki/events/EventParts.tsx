"use client";

import type {
	GameEvent,
	GameEventMission,
	GameEventRanking,
	GameEventReward,
	GameEventTier,
} from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { isPartialNote, isPartialRewardList } from "@/service/wikiEvents";
import { rankingTablesOfEvent } from "@/data/game/gameEvents";
import { findItem } from "@/data/game/items";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ResponsiveTable } from "../parts/ResponsiveTable";
import { RecordSection } from "../records/RecordParts";
import { UnknownValue } from "../UnknownValue";

export function PartialListNote({ note }: { note: string | undefined }) {
	const t = useTranslations("wikiEvents.rewards");

	if (!isPartialNote(note)) return null;

	return <p className="text-muted italic">{t("partial")}</p>;
}

export function RewardList({ rewards }: { rewards: GameEventReward[] | undefined }) {
	const t = useTranslations("wikiEvents.rewards");

	if (!rewards?.length) return <UnknownValue />;

	return (
		<span className="flex flex-col gap-1">
			<span className="flex flex-wrap gap-x-3 gap-y-1">
				{rewards.map((reward, index) => {
					const item = reward.itemId ? findItem(reward.itemId) : undefined;
					const name = item?.name ?? reward.name;
					return (
						<span key={index} className="inline-flex items-center gap-1.5">
							<ItemIcon src={item?.img} size={16} />
							<span>
								{reward.amount === undefined
									? name
									: t("amountName", {
											amount: formatNumber(reward.amount),
											name,
										})}
								{reward.note && (
									<span className="text-muted text-xs"> {reward.note}</span>
								)}
							</span>
						</span>
					);
				})}
			</span>
			{isPartialRewardList(rewards) && (
				<span className="text-muted italic">{t("partial")}</span>
			)}
		</span>
	);
}

export function PhasesCard({ event }: { event: GameEvent }) {
	const t = useTranslations("wikiEvents.phases");

	if (!event.phases?.length) return null;

	return (
		<RecordSection title={t("title")}>
			<ResponsiveTable
				label={t("table")}
				titleColumnId="phase"
				rows={event.phases}
				rowKey={(row, index) => `${index}-${row.name}`}
				columns={[
					{ id: "phase", header: t("phase"), render: (row) => row.name },
					{
						id: "description",
						header: t("description"),
						render: (row) => row.description ?? <UnknownValue />,
						wideOnCard: true,
					},
				]}
			/>
		</RecordSection>
	);
}

export function MissionsTable({
	missions,
	pointsLabel,
}: {
	missions: GameEventMission[];
	pointsLabel: string | undefined;
}) {
	const t = useTranslations("wikiEvents.missions");

	return (
		<ResponsiveTable
			label={t("table")}
			titleColumnId="mission"
			rows={missions}
			rowKey={(row, index) => `${index}-${row.name}`}
			columns={[
				{ id: "mission", header: t("mission"), render: (row) => row.name },
				{ id: "group", header: t("group"), render: (row) => row.group },
				{
					id: "points",
					header: pointsLabel ?? t("points"),
					render: (row) => formatNumber(row.points),
					numeric: true,
				},
				{
					id: "rewards",
					header: t("rewards"),
					render: (row) => <RewardList rewards={row.rewards} />,
					wideOnCard: true,
				},
			]}
		/>
	);
}

export function TiersTable({
	tiers,
	scoreUnit,
}: {
	tiers: GameEventTier[];
	scoreUnit: string | undefined;
}) {
	const t = useTranslations("wikiEvents.tiers");
	return (
		<ResponsiveTable
			label={t("table")}
			titleColumnId="tier"
			rows={tiers}
			rowKey={(row, index) => `${index}-${row.name}`}
			columns={[
				{ id: "tier", header: t("tier"), render: (row) => row.name },
				{
					id: "score",
					header: t("score"),
					render: (row) =>
						row.scoreTotal === undefined ? (
							<UnknownValue />
						) : scoreUnit ? (
							t("scoreValue", {
								amount: formatNumber(row.scoreTotal),
								unit: scoreUnit,
							})
						) : (
							t("scoreValuePoints", { amount: formatNumber(row.scoreTotal) })
						),
					numeric: true,
				},
				{
					id: "rewards",
					header: t("rewards"),
					render: (row) => (
						<>
							<RewardList rewards={row.rewards} />
							{row.note && (
								<span className="text-muted block text-xs">{row.note}</span>
							)}
							<PartialListNote note={row.note} />
						</>
					),
					wideOnCard: true,
				},
			]}
		/>
	);
}

function RankingRows({ rankings }: { rankings: GameEventRanking[] }) {
	const t = useTranslations("wikiEvents.rankings");

	return (
		<ResponsiveTable
			label={t("table")}
			titleColumnId="rank"
			rows={rankings}
			rowKey={(row, index) => `${index}-${row.groupRanking}`}
			columns={[
				{ id: "rank", header: t("rank"), render: (row) => row.groupRanking },
				{
					id: "star",
					header: t("starChange"),
					render: (row) =>
						row.starChange === undefined ? (
							<UnknownValue />
						) : (
							formatNumber(row.starChange)
						),
					numeric: true,
				},
				{
					id: "rewards",
					header: t("rewards"),
					render: (row) => <RewardList rewards={row.rewards} />,
					wideOnCard: true,
				},
			]}
		/>
	);
}

export function RankingCards({ event }: { event: GameEvent }) {
	const t = useTranslations("wikiEvents.rankings");

	return rankingTablesOfEvent(event).map((table) => {
		const title =
			table.name ??
			(table.basedOn ? t("basedOn", { basis: table.basedOn }) : t(table.scope ?? "title"));
		return (
			<RecordSection key={table.id} title={title}>
				<PartialListNote
					note={event.tiers?.find((tier) => tier.name === table.name)?.note}
				/>
				<RankingRows rankings={table.rankings} />
			</RecordSection>
		);
	});
}

"use client";

import type {
	GameEvent,
	GameEventDay,
	GameEventShopOffer,
	GameEventVersion,
} from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { findItem } from "@/data/game/items";
import { DetailRows } from "../parts/DetailRows";
import { ResponsiveTable } from "../parts/ResponsiveTable";
import { RecordSection } from "../records/RecordParts";
import { UnknownValue } from "../UnknownValue";
import {
	MissionsTable,
	PartialListNote,
	PhasesCard,
	RankingCards,
	RewardList,
	TiersTable,
} from "./EventParts";

function DaySections({ day, event }: { day: GameEventDay; event: GameEvent }) {
	const t = useTranslations("wikiEvents.scoringRows");

	return (
		<>
			<RecordSection
				title={t("title", { name: day.name })}
				meta={
					day.victoryPoints === undefined
						? undefined
						: t("victoryPoints", { amount: formatNumber(day.victoryPoints) })
				}
			>
				{day.note && <p className="text-muted">{day.note}</p>}
				<PartialListNote note={day.note} />
				<ResponsiveTable
					label={t("table")}
					titleColumnId="action"
					rows={day.scoring}
					rowKey={(row, index) => `${index}-${row.action}`}
					columns={[
						{ id: "action", header: t("action"), render: (row) => row.action },
						{
							id: "points",
							header: t("points"),
							render: (row) => formatNumber(row.points),
							numeric: true,
						},
					]}
				/>
			</RecordSection>
			{day.milestones && (
				<RecordSection title={t("milestones", { name: day.name })}>
					<TiersTable tiers={day.milestones} scoreUnit={event.scoreUnit} />
				</RecordSection>
			)}
			{day.allianceMilestones && (
				<RecordSection title={t("allianceMilestones", { name: day.name })}>
					<TiersTable tiers={day.allianceMilestones} scoreUnit={event.scoreUnit} />
				</RecordSection>
			)}
		</>
	);
}

function VersionCard({ version, event }: { version: GameEventVersion; event: GameEvent }) {
	const t = useTranslations("wikiEvents.versions");

	return (
		<RecordSection title={t("title", { name: version.name })}>
			{version.note && <p className="text-muted">{version.note}</p>}
			{version.missions && (
				<>
					<h3 className="font-semibold">{t("missions")}</h3>
					<MissionsTable
						missions={version.missions}
						pointsLabel={event.missionPointsLabel}
					/>
				</>
			)}
			{version.tiers && (
				<>
					<h3 className="font-semibold">{t("chests")}</h3>
					<TiersTable tiers={version.tiers} scoreUnit={event.scoreUnit} />
				</>
			)}
		</RecordSection>
	);
}

function ShopTable({ offers, event }: { offers: GameEventShopOffer[]; event: GameEvent }) {
	const t = useTranslations("wikiEvents.shop");
	const currency =
		event.shopCurrencyName ??
		(event.shopCurrencyItemId ? findItem(event.shopCurrencyItemId)?.name : undefined);

	return (
		<ResponsiveTable
			label={t("table")}
			titleColumnId="offer"
			rows={offers}
			rowKey={(row, index) => `${index}-${row.reward.name}`}
			columns={[
				{
					id: "offer",
					header: t("offer"),
					render: (row) => <RewardList rewards={[row.reward]} />,
				},
				{
					id: "contents",
					header: t("contents"),
					render: (row) => (row.contents ? <RewardList rewards={row.contents} /> : null),
					wideOnCard: true,
				},
				{
					id: "cost",
					header: t("cost"),
					render: (row) =>
						currency
							? t("costValue", { amount: formatNumber(row.cost), currency })
							: formatNumber(row.cost),
					numeric: true,
				},
				{
					id: "limit",
					header: t("limit"),
					render: (row) => formatNumber(row.limit),
					numeric: true,
				},
			]}
		/>
	);
}

function ExtraSections({ event }: { event: GameEvent }) {
	const tLevels = useTranslations("wikiEvents.pointLevels");
	const tWaves = useTranslations("wikiEvents.waves");
	const tZones = useTranslations("wikiEvents.zones");
	const tShop = useTranslations("wikiEvents.shop");
	const tRewards = useTranslations("wikiEvents.rewards");
	const tTiers = useTranslations("wikiEvents.tiers");
	const tMissions = useTranslations("wikiEvents.missions");
	const tTips = useTranslations("wikiEvents.tips");

	return (
		<>
			{event.days?.map((day) => (
				<DaySections key={day.day} day={day} event={event} />
			))}
			{event.missions && (
				<RecordSection title={tMissions("title")}>
					<MissionsTable
						missions={event.missions}
						pointsLabel={event.missionPointsLabel}
					/>
				</RecordSection>
			)}
			{event.tiers?.some((tier) => tier.scoreTotal !== undefined || tier.rewards) && (
				<RecordSection title={tTiers("title")}>
					<TiersTable tiers={event.tiers} scoreUnit={event.scoreUnit} />
				</RecordSection>
			)}
			{event.versions?.map((version) => (
				<VersionCard key={version.name} version={version} event={event} />
			))}
			<RankingCards event={event} />
			{event.pointLevels && (
				<RecordSection title={tLevels("title")}>
					<ResponsiveTable
						label={tLevels("table")}
						titleColumnId="level"
						rows={event.pointLevels.levels}
						rowKey={(row) => String(row.level)}
						columns={[
							{
								id: "level",
								header: tLevels("level"),
								render: (row) => row.level,
								numeric: true,
							},
							{
								id: "personal",
								header: tLevels("personal"),
								render: (row) => formatNumber(row.personalPoints),
								numeric: true,
							},
							{
								id: "alliance",
								header: tLevels("alliance"),
								render: (row) => formatNumber(row.alliancePoints),
								numeric: true,
							},
							{
								id: "rewards",
								header: tLevels("rewards"),
								render: (row) => <RewardList rewards={row.rewards} />,
								wideOnCard: true,
							},
						]}
					/>
				</RecordSection>
			)}
			{event.waves && (
				<RecordSection title={tWaves("title")}>
					<ResponsiveTable
						label={tWaves("table")}
						titleColumnId="wave"
						rows={event.waves}
						rowKey={(row) => String(row.wave)}
						columns={[
							{
								id: "wave",
								header: tWaves("wave"),
								render: (row) => row.wave,
								numeric: true,
							},
							{
								id: "target",
								header: tWaves("target"),
								render: (row) => tWaves(row.target),
							},
							{
								id: "rule",
								header: tWaves("rule"),
								render: (row) => (
									<>
										{row.rule}
										{row.details && (
											<span className="text-muted block text-xs">
												{row.details}
											</span>
										)}
									</>
								),
								wideOnCard: true,
							},
						]}
					/>
				</RecordSection>
			)}
			{event.zones && (
				<RecordSection title={tZones("title")}>
					<ResponsiveTable
						label={tZones("table")}
						titleColumnId="zone"
						rows={event.zones}
						rowKey={(row) => row.name}
						columns={[
							{ id: "zone", header: tZones("zone"), render: (row) => row.name },
							{
								id: "days",
								header: tZones("days"),
								render: (row) => row.days.join(", "),
							},
							{
								id: "stats",
								header: tZones("statSources"),
								render: (row) => row.statSources,
								wideOnCard: true,
							},
							{
								id: "unlock",
								header: tZones("unlock"),
								render: (row) => row.unlock ?? <UnknownValue />,
								wideOnCard: true,
							},
						]}
					/>
				</RecordSection>
			)}
			{event.shop && (
				<RecordSection title={tShop("title")}>
					<ShopTable offers={event.shop} event={event} />
				</RecordSection>
			)}
			{event.shops?.map((shop) => (
				<RecordSection key={shop.name} title={tShop("titleNamed", { name: shop.name })}>
					<ShopTable offers={shop.offers} event={event} />
				</RecordSection>
			))}
			{event.rewards && (
				<RecordSection title={tRewards("title")}>
					<RewardList rewards={event.rewards} />
				</RecordSection>
			)}
			{event.tips && (
				<RecordSection title={tTips("title")}>
					<ul className="flex list-disc flex-col gap-1 ps-5">
						{event.tips.map((tip) => (
							<li key={tip}>{tip}</li>
						))}
					</ul>
				</RecordSection>
			)}
		</>
	);
}

export function EventDetail({ event }: { event: GameEvent }) {
	const t = useTranslations("wikiEvents.detail");
	const tCategory = useTranslations("wikiEvents.category");

	return (
		<>
			<RecordSection title={t("title", { name: event.name })}>
				<DetailRows
					rows={[
						{ label: t("category"), value: tCategory(event.category) },
						{ label: t("frequency"), value: event.frequency ?? <UnknownValue /> },
						{ label: t("duration"), value: event.duration ?? <UnknownValue /> },
						{ label: t("summary"), value: event.description },
						{
							label: t("requirements"),
							value: event.requirements?.length ? (
								<ul className="flex list-disc flex-col gap-1 ps-5">
									{event.requirements.map((requirement) => (
										<li key={requirement}>{requirement}</li>
									))}
								</ul>
							) : (
								t("noRequirements")
							),
						},
					]}
				/>
			</RecordSection>
			<PhasesCard event={event} />
			<ExtraSections event={event} />
		</>
	);
}

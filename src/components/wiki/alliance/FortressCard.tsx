import type { AllianceFortress } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { CardRows } from "../cost/CardRows";
import { RowButton } from "../cost/RowButton";
import { RecordSection } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";

function PhaseCount({ fortress }: { fortress: AllianceFortress }) {
	return fortress.rewards.length > 0 ? (
		<>{formatNumber(fortress.rewards.length)}</>
	) : (
		<UnknownValue />
	);
}

function PhaseOneReward({ fortress }: { fortress: AllianceFortress }) {
	return fortress.rewards.length > 0 ? <>{fortress.rewards[0].reward}</> : <UnknownValue />;
}

export function FortressDetail({ fortress }: { fortress: AllianceFortress }) {
	const t = useTranslations("wikiAllianceStructures");
	const columns: RecordColumn<AllianceFortress["rewards"][number]>[] = [
		{
			id: "phase",
			header: t("detail.columns.phase"),
			heading: true,
			cell: (entry) => <span className="font-mono">{formatNumber(entry.phase)}</span>,
		},
		{ id: "reward", header: t("detail.columns.reward"), cell: (entry) => entry.reward },
	];

	return (
		<RecordSection
			title={t("detail.title")}
			meta={
				fortress.rewards.length > 0
					? t("detail.phases", {
							count: fortress.rewards.length,
							amount: formatNumber(fortress.rewards.length),
						})
					: undefined
			}
		>
			{fortress.rewards.length === 0 ? (
				<p className="flex flex-wrap items-center gap-2">
					<UnknownValue />
					<span className="text-muted">{t("detail.noRewards")}</span>
				</p>
			) : (
				<CardRows
					columns={columns}
					rows={fortress.rewards}
					rowKey={(entry) => String(entry.phase)}
				/>
			)}
		</RecordSection>
	);
}

export function FortressCard({
	fortresses,
	onSelect,
}: {
	fortresses: AllianceFortress[];
	onSelect: (fortress: AllianceFortress) => void;
}) {
	const t = useTranslations("wikiAllianceStructures");

	const columns: RecordColumn<AllianceFortress>[] = [
		{
			id: "name",
			header: t("fortresses.columns.name"),
			heading: true,
			cell: (fortress) => (
				<RowButton onClick={() => onSelect(fortress)}>{fortress.name}</RowButton>
			),
		},
		{
			id: "kind",
			header: t("fortresses.columns.kind"),
			cell: (fortress) => t(`fortresses.kinds.${fortress.kind}`),
		},
		{
			id: "x",
			header: t("fortresses.columns.x"),
			cell: (fortress) => <span className="font-mono">{formatNumber(fortress.x)}</span>,
		},
		{
			id: "y",
			header: t("fortresses.columns.y"),
			cell: (fortress) => <span className="font-mono">{formatNumber(fortress.y)}</span>,
		},
		{
			id: "phases",
			header: t("fortresses.columns.phases"),
			cell: (fortress) => (
				<span className="font-mono">
					<PhaseCount fortress={fortress} />
				</span>
			),
		},
		{
			id: "phaseOne",
			header: t("fortresses.columns.phaseOne"),
			cell: (fortress) => <PhaseOneReward fortress={fortress} />,
		},
	];

	return (
		<RecordSection
			title={t("fortresses.title")}
			meta={t("fortresses.count", {
				count: fortresses.length,
				amount: formatNumber(fortresses.length),
			})}
		>
			{fortresses.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<RecordTable
					columns={columns}
					rows={fortresses}
					rowKey={(fortress) => fortress.id}
				/>
			)}
		</RecordSection>
	);
}

import type { AllianceBannerLevel } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { ResourceCostList } from "../cost/ResourceCostList";
import { RowButton } from "../cost/RowButton";
import { RecordSection } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";

export function BannerCost({ range }: { range: AllianceBannerLevel }) {
	const t = useTranslations("wikiAllianceStructures.banners");

	return range.cost.length > 0 ? (
		<ResourceCostList cost={range.cost} exact />
	) : (
		<span className="text-muted">{t("noCost")}</span>
	);
}

export function BannerCard({
	ranges,
	onSelect,
}: {
	ranges: AllianceBannerLevel[];
	onSelect: (range: AllianceBannerLevel) => void;
}) {
	const t = useTranslations("wikiAllianceStructures");

	const columns: RecordColumn<AllianceBannerLevel>[] = [
		{
			id: "range",
			header: t("banners.columns.range"),
			heading: true,
			cell: (range) => <RowButton onClick={() => onSelect(range)}>{range.name}</RowButton>,
		},
		{
			id: "min",
			header: t("banners.columns.min"),
			cell: (range) => <span className="font-mono">{formatNumber(range.minLevel)}</span>,
		},
		{
			id: "max",
			header: t("banners.columns.max"),
			cell: (range) => <span className="font-mono">{formatNumber(range.maxLevel)}</span>,
		},
		{
			id: "cost",
			header: t("banners.columns.cost"),
			cell: (range) => <BannerCost range={range} />,
		},
	];

	return (
		<RecordSection
			title={t("banners.title")}
			meta={t("banners.count", { count: ranges.length, amount: formatNumber(ranges.length) })}
		>
			{ranges.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<RecordTable columns={columns} rows={ranges} rowKey={(range) => range.id} />
			)}
		</RecordSection>
	);
}

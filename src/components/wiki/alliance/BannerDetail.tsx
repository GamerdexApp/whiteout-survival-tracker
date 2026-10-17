import type { AllianceBannerLevel } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { Card } from "@/comps/ui/Card";
import { RecordSection } from "../records/RecordParts";
import { BannerCost } from "./BannerCard";

export function BannerDetail({ range }: { range: AllianceBannerLevel }) {
	const t = useTranslations("wikiAllianceStructures.banners.detail");

	return (
		<RecordSection title={t("title")}>
			<Card className="flex flex-col gap-3 p-4">
				<dl className="grid grid-cols-[auto_1fr] gap-x-4">
					<div className="border-line col-span-2 grid grid-cols-subgrid border-b py-2">
						<dt className="text-muted">{t("fields.range")}</dt>
						<dd>{range.name}</dd>
					</div>
					<div className="border-line col-span-2 grid grid-cols-subgrid border-b py-2">
						<dt className="text-muted">{t("fields.min")}</dt>
						<dd className="font-mono">{formatNumber(range.minLevel)}</dd>
					</div>
					<div className="border-line col-span-2 grid grid-cols-subgrid border-b py-2">
						<dt className="text-muted">{t("fields.max")}</dt>
						<dd className="font-mono">{formatNumber(range.maxLevel)}</dd>
					</div>
					<div className="col-span-2 grid grid-cols-subgrid py-2">
						<dt className="text-muted">{t("fields.cost")}</dt>
						<dd>
							<BannerCost range={range} />
						</dd>
					</div>
				</dl>
			</Card>
		</RecordSection>
	);
}

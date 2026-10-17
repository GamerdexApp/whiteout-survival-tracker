import type { AllianceFortress } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { MAP_SIZE } from "@/data/game/alliance";
import { Card } from "@/comps/ui/Card";
import { RecordSection } from "../records/RecordParts";

const MARK = 36;

function Mark({ fortress, selected }: { fortress: AllianceFortress; selected: boolean }) {
	const { x, y, kind } = fortress;
	const ring = selected ? "stroke-primary" : "stroke-ink";

	if (kind === "castle") {
		return (
			<rect
				x={x - MARK}
				y={y - MARK}
				width={MARK * 2}
				height={MARK * 2}
				strokeWidth={selected ? 14 : 6}
				className={`fill-gold ${ring}`}
			/>
		);
	}

	if (kind === "stronghold") {
		return (
			<polygon
				points={`${x},${y - MARK} ${x + MARK},${y} ${x},${y + MARK} ${x - MARK},${y}`}
				strokeWidth={selected ? 14 : 6}
				className={`fill-primary ${ring}`}
			/>
		);
	}

	return (
		<circle
			cx={x}
			cy={y}
			r={MARK * 0.75}
			strokeWidth={selected ? 14 : 6}
			className={`fill-muted ${ring}`}
		/>
	);
}

export function FortressMap({
	fortresses,
	selectedId,
}: {
	fortresses: AllianceFortress[];
	selectedId: string;
}) {
	const t = useTranslations("wikiAllianceStructures.map");

	return (
		<RecordSection title={t("title")}>
			<Card className="flex flex-col gap-3 p-4">
				<svg
					role="img"
					aria-label={t("label")}
					viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
					className="bg-tint border-line aspect-square w-full rounded-md border-[1.5px]"
				>
					{fortresses.map((fortress) => (
						<Mark
							key={fortress.id}
							fortress={fortress}
							selected={fortress.id === selectedId}
						/>
					))}
				</svg>
				<ul className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-xs">
					<li>{t("legend.castle")}</li>
					<li>{t("legend.stronghold")}</li>
					<li>{t("legend.fortress")}</li>
				</ul>
				<p className="text-muted">{t("note", { size: formatNumber(MAP_SIZE) })}</p>
			</Card>
		</RecordSection>
	);
}

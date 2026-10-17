import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { WikiTimelineRow } from "@/data/game/wikiTimeline";
import type { TimelineLine } from "@/data/game/wikiTimeline";
import { ItemIcon } from "@/comps/ui/ItemIcon";

export type RowPhase = "unknown" | "past" | "near" | "future";

const SPINE_CLASSES: Record<RowPhase, string> = {
	unknown: "bg-line",
	past: "bg-primary",
	near: "bg-warn",
	future: "bg-line",
};

const BAND_CLASSES: Record<RowPhase, string> = {
	unknown: "",
	past: "",
	near: "bg-warn/10",
	future: "",
};

const CELL_CLASSES = "col-start-2 row-start-1 lg:col-start-auto lg:row-start-1";

function Spine({ phase, children }: { phase: RowPhase; children: React.ReactNode }) {
	return (
		<div className="relative col-start-1 row-span-3 row-start-1 flex justify-center lg:col-start-2 lg:row-span-1">
			<span
				aria-hidden="true"
				className={`absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 ${SPINE_CLASSES[phase]}`}
			/>
			<div className="relative flex flex-col items-center gap-0.5 py-3">{children}</div>
		</div>
	);
}

function LineCard({ lines, dashed }: { lines: TimelineLine[]; dashed: boolean }) {
	const t = useTranslations("wikiTimeline");

	return (
		<div
			className={`bg-surface flex flex-col gap-2 rounded-md border-[1.5px] p-3 lg:items-end lg:text-right ${
				dashed ? "border-line border-dashed" : "border-line"
			}`}
		>
			{lines.map((line) => {
				const names = line.names.join(", ");
				return (
					<div key={line.id} className="flex flex-col gap-1.5 lg:items-end">
						<span className="flex flex-wrap items-center gap-2 lg:flex-row-reverse lg:justify-start">
							<span className="text-muted border-line rounded-sm border px-1.5 font-mono text-xs uppercase">
								{t(`tags.${line.kind}`)}
							</span>
							{!line.members && (
								<span>
									{line.fireCrystalLevels
										? t("fireCrystalLevels", { names })
										: names}
								</span>
							)}
						</span>
						{line.members && (
							<ul className="flex flex-wrap gap-x-4 gap-y-1.5 lg:justify-end">
								{line.members.map((member) => (
									<li
										key={member.name}
										className="flex items-center gap-2 lg:flex-row-reverse"
									>
										<ItemIcon src={member.img} size={32} />
										{member.name}
									</li>
								))}
							</ul>
						)}
						{line.images.length > 0 && (
							<span className="flex flex-wrap gap-1 lg:flex-row-reverse">
								{line.images.map((src) => (
									<ItemIcon key={src} src={src} size={32} />
								))}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}

function HeroCard({
	generations,
	dashed,
}: {
	generations: WikiTimelineRow["heroGenerations"];
	dashed: boolean;
}) {
	const t = useTranslations("wikiTimeline");

	return (
		<div className="flex flex-col gap-2">
			{generations.map((entry) => (
				<div
					key={entry.generation}
					className={`bg-tint flex flex-col gap-2 rounded-md border-[1.5px] p-3 ${
						dashed ? "border-line border-dashed" : "border-transparent"
					}`}
				>
					<span className="text-muted font-mono text-xs uppercase">
						{t("heroGeneration", { generation: formatNumber(entry.generation) })}
					</span>
					<ul className="flex flex-wrap gap-x-4 gap-y-1">
						{entry.heroes.map((hero) => (
							<li key={hero.name} className="flex items-center gap-1.5">
								<ItemIcon src={hero.img} size={32} />
								{hero.name}
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}

interface TimelineRowViewProps {
	row: WikiTimelineRow;
	phase: RowPhase;
	daysLeft: number;
}

export function TimelineRowView({ row, phase, daysLeft }: TimelineRowViewProps) {
	const t = useTranslations("wikiTimeline");
	const dashed = phase === "future";
	const status =
		phase === "past"
			? t("status.unlocked")
			: phase === "near"
				? t("status.near")
				: phase === "future"
					? t("status.future", { count: daysLeft, amount: formatNumber(daysLeft) })
					: null;
	const day = formatNumber(row.day);

	return (
		<li
			data-day={row.day}
			data-phase={phase}
			className={`grid grid-cols-[2.75rem_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] lg:gap-x-0 ${BAND_CLASSES[phase]}`}
		>
			<Spine phase={phase}>
				<span className="bg-surface border-line rounded-full border-[1.5px] px-2 font-mono text-xs font-semibold lg:text-sm">
					<span className="lg:hidden">{day}</span>
					<span className="max-lg:hidden">{t("day", { day })}</span>
				</span>
				{status && (
					<span
						className={`bg-bg px-1 text-xs max-lg:hidden ${phase === "near" ? "text-warn font-medium" : "text-muted"}`}
					>
						{status}
					</span>
				)}
			</Spine>
			<p className="col-start-2 row-start-1 flex gap-2 pt-3 pb-1 font-medium lg:hidden">
				<span>{t("day", { day })}</span>
				{status && (
					<span className={phase === "near" ? "text-warn" : "text-muted"}>{status}</span>
				)}
			</p>
			{row.lines.length > 0 && (
				<div className="col-start-2 row-start-2 pb-3 lg:col-start-1 lg:row-start-1 lg:py-2 lg:pr-4">
					<LineCard lines={row.lines} dashed={dashed} />
				</div>
			)}
			{row.heroGenerations.length > 0 && (
				<div className="col-start-2 row-start-3 pb-3 lg:col-start-3 lg:row-start-1 lg:py-2 lg:pb-2 lg:pl-4">
					<HeroCard generations={row.heroGenerations} dashed={dashed} />
				</div>
			)}
		</li>
	);
}

interface TimelineMarkerProps {
	name: string;
	days: number;
	from: number;
	to: number;
	markerRef: React.Ref<HTMLLIElement>;
}

export function TimelineMarker({ name, days, from, to, markerRef }: TimelineMarkerProps) {
	const t = useTranslations("wikiTimeline");

	return (
		<li
			ref={markerRef}
			data-marker
			className="grid scroll-mt-24 grid-cols-[2.75rem_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)]"
		>
			<div className="relative col-start-1 row-start-1 flex justify-center lg:col-start-2">
				<span
					aria-hidden="true"
					className="bg-primary absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
				/>
				<span className="bg-primary text-on-primary relative my-3 self-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap max-lg:hidden">
					{t("marker.label")}
				</span>
				<span
					aria-hidden="true"
					className="bg-primary relative my-3 size-3 self-center rounded-full lg:hidden"
				/>
			</div>
			<div className="col-start-2 row-start-1 py-2 lg:col-start-1 lg:pr-4">
				<div className="bg-surface border-primary flex flex-col gap-1 rounded-md border-[1.5px] p-3 lg:text-right">
					<span className="text-primary font-semibold lg:hidden">
						{t("marker.label")}
					</span>
					<span className="font-semibold">
						{t("marker.title", { name, days: formatNumber(days) })}
					</span>
					<span className="text-muted text-xs">
						{t("marker.window", {
							window: formatNumber(WINDOW_DAYS),
							from: formatNumber(from),
							to: formatNumber(to),
						})}
					</span>
				</div>
			</div>
		</li>
	);
}

export const WINDOW_DAYS = 21;

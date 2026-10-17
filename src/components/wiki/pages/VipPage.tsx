"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatCompact, formatNumber } from "@/lib/format";
import { vipBonusAt, vipRunningXp, vipStatRows, vipTotalXp } from "@/service/wikiVip";
import { MAX_VIP_LEVEL, vipLevels } from "@/data/game/vip";
import type { VipLevel } from "@/data/game/vip";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { RecordSection } from "../records/RecordParts";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

interface LevelButtonProps {
	level: VipLevel;
	onOpen: (level: VipLevel) => void;
	className?: string;
}

function LevelButton({ level, onOpen, className = "" }: LevelButtonProps) {
	return (
		<button
			type="button"
			aria-haspopup="dialog"
			onClick={() => onOpen(level)}
			className={`border-line text-muted hover:text-ink flex min-h-11 items-center justify-center rounded-md border-[1.5px] px-2 whitespace-nowrap lg:min-h-9 ${className}`}
		>
			{level.name}
		</button>
	);
}

function Ladder({ onOpen }: { onOpen: (level: VipLevel) => void }) {
	const t = useTranslations("wikiVip.ladder");
	const cell = "px-2 py-2 text-center font-mono";

	return (
		<Card className="hidden overflow-x-auto lg:block">
			<table className="w-full border-collapse">
				<thead>
					<tr>
						<th scope="col" className="px-2 py-2 text-left">
							<SectionLabel className="text-muted">{t("row")}</SectionLabel>
						</th>
						{vipLevels.map((level) => (
							<th key={level.id} scope="col" className="px-0.5 py-1">
								<LevelButton
									level={level}
									onOpen={onOpen}
									className="w-full text-xs"
								/>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					<tr className="border-line border-t">
						<th scope="row" className="px-2 py-2 text-left font-normal">
							{t("xp")}
						</th>
						{vipLevels.map((level) => (
							<td key={level.id} className={cell}>
								{formatCompact(level.xpRequired)}
							</td>
						))}
					</tr>
					<tr className="border-line border-t">
						<th scope="row" className="px-2 py-2 text-left font-normal">
							{t("running")}
						</th>
						{vipLevels.map((level) => (
							<td key={level.id} className={cell}>
								{formatCompact(vipRunningXp(level))}
							</td>
						))}
					</tr>
					{vipStatRows.map((row) => (
						<tr key={row.statKey} className="border-line border-t">
							<th scope="row" className="px-2 py-2 text-left font-normal">
								{row.stat}
							</th>
							{vipLevels.map((level) => {
								const bonus = vipBonusAt(level, row.statKey);
								return (
									<td key={level.id} className={cell}>
										{bonus ? (
											bonus.value
										) : (
											<span className="text-muted">{t("none")}</span>
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</Card>
	);
}

function LevelPicker({ onOpen }: { onOpen: (level: VipLevel) => void }) {
	const t = useTranslations("wikiVip.ladder");

	return (
		<ul aria-label={t("pick")} className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:hidden">
			{vipLevels.map((level) => (
				<li key={level.id} className="contents">
					<LevelButton level={level} onOpen={onOpen} />
				</li>
			))}
		</ul>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="border-line grid grid-cols-[10rem_1fr] gap-4 border-t py-2">
			<dt className="text-muted">{label}</dt>
			<dd className="font-mono">{value}</dd>
		</div>
	);
}

function VipDetail({ level }: { level: VipLevel }) {
	const t = useTranslations("wikiVip.detail");

	return (
		<dl>
			<DetailRow label={t("xp")} value={formatNumber(level.xpRequired)} />
			<DetailRow label={t("running")} value={formatNumber(vipRunningXp(level))} />
			{level.bonuses.map((bonus) => (
				<DetailRow key={bonus.statKey} label={bonus.stat} value={bonus.value} />
			))}
		</dl>
	);
}

function VipList() {
	const t = useTranslations("wikiVip");
	const [openLevel, setOpenLevel] = useState<VipLevel | undefined>(undefined);

	return (
		<WikiPageShell
			id="vip"
			line={t("line", { max: formatNumber(MAX_VIP_LEVEL), total: formatCompact(vipTotalXp) })}
		>
			<RecordSection
				title={t("ladder.title")}
				meta={t("ladder.summary", {
					levels: formatNumber(vipLevels.length),
					rows: formatNumber(vipStatRows.length),
				})}
			>
				<LevelPicker onOpen={setOpenLevel} />
				<Ladder onOpen={setOpenLevel} />
			</RecordSection>
			{openLevel && (
				<Flyout open onClose={() => setOpenLevel(undefined)} title={openLevel.name}>
					<VipDetail level={openLevel} />
				</Flyout>
			)}
		</WikiPageShell>
	);
}

export function VipPage({ recordId }: WikiPageProps) {
	if (recordId !== undefined) return <WikiRecordMissing id="vip" />;

	return <VipList />;
}

"use client";

import { useTranslations } from "next-intl";
import { LuMinus, LuPlus } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { bannerLevelOf, currentBannerRow } from "@/service/alliance";
import { MAX_BANNER_LEVEL } from "@/data/game/alliance";
import { findItem } from "@/data/game/items";
import { CountInput } from "@/comps/troops/CountInput";
import { Card } from "@/comps/ui/Card";
import { IconButton } from "@/comps/ui/IconButton";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface BannerCardProps {
	chief: Playthrough;
	onLevelChange: (level: number) => void;
}

export function BannerCard({ chief, onLevelChange }: BannerCardProps) {
	const t = useTranslations("alliance.banner");
	const level = bannerLevelOf(chief);
	const row = currentBannerRow(chief);

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between gap-3">
				<h2 className="font-semibold">{t("title")}</h2>
				<span className="bg-tint text-primary rounded-full px-2.5 py-0.5 font-mono text-xs font-medium">
					{t("rangeChip", { range: row.name })}
				</span>
			</div>
			<div className="flex flex-col gap-1.5">
				<SectionLabel className="text-muted">{t("currentLevel")}</SectionLabel>
				<div className="flex items-center gap-2">
					<IconButton
						label={t("lower")}
						disabled={level <= 0}
						onClick={() => onLevelChange(level - 1)}
						className="border-line bg-surface hover:bg-tint border-[1.5px]"
					>
						<LuMinus size={16} aria-hidden="true" />
					</IconButton>
					<span className="w-28">
						<CountInput
							label={t("levelLabel")}
							value={level}
							max={MAX_BANNER_LEVEL}
							onCommit={onLevelChange}
						/>
					</span>
					<IconButton
						label={t("raise")}
						disabled={level >= MAX_BANNER_LEVEL}
						onClick={() => onLevelChange(level + 1)}
						className="border-line bg-surface hover:bg-tint border-[1.5px]"
					>
						<LuPlus size={16} aria-hidden="true" />
					</IconButton>
				</div>
				<span className="text-muted text-xs">
					{t("maxHint", { max: formatNumber(MAX_BANNER_LEVEL) })}
				</span>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">
					{t("costHeading", { range: row.name })}
				</SectionLabel>
				<ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{row.cells.map((cell, index) => {
						const item = findItem(cell.itemId);
						return (
							<li
								key={cell.itemId}
								className="border-line bg-tint flex items-center gap-2 rounded-md border-[1.5px] p-2"
							>
								<ItemIcon src={item?.img} size={24} />
								<span className="flex min-w-0 flex-col">
									<span className="text-muted text-xs">
										{item?.name ?? cell.itemId}
									</span>
									{cell.amount === null ? (
										<span className="text-muted font-mono font-semibold">
											{row.free && index === 0 ? t("noCost") : t("none")}
										</span>
									) : (
										<span className="font-mono font-semibold">
											{formatNumber(cell.amount)}
										</span>
									)}
								</span>
							</li>
						);
					})}
				</ul>
				<p className="text-muted text-xs">{t("noTimeOrPower")}</p>
			</div>
		</Card>
	);
}

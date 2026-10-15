"use client";

import type { Item } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { stepFor } from "@/service/inventory";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { CountControl } from "./CountControl";

interface ItemSheetProps {
	item: Item | null;
	count: number;
	onCountChange: (itemId: string, count: number) => void;
	onSetToZero: (item: Item) => void;
	onClose: () => void;
}

const stepChoices = [1, 10, 100, 1000];

export function ItemSheet({ item, count, onCountChange, onSetToZero, onClose }: ItemSheetProps) {
	const t = useTranslations("resources");
	const [chosenStep, setChosenStep] = useState<number | null>(null);
	const [shownId, setShownId] = useState<string | null>(null);

	if ((item?.id ?? null) !== shownId) {
		setShownId(item?.id ?? null);
		setChosenStep(null);
	}

	return (
		<Dialog
			open={item !== null}
			onClose={onClose}
			title={t("itemSheet.title")}
			footer={
				<Button variant="primary" onClick={onClose}>
					{t("done")}
				</Button>
			}
		>
			{item && (
				<>
					<div className="flex items-center gap-3">
						<ItemIcon src={item.img} size={56} />
						<div className="flex flex-col">
							<span className="text-base font-semibold">{item.name}</span>
							<span className="text-muted">{item.category}</span>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<SectionLabel className="text-muted">{t("owned")}</SectionLabel>
						<CountControl
							name={item.name}
							value={count}
							step={chosenStep ?? stepFor(item.id)}
							onChange={(next) => onCountChange(item.id, next)}
						/>
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-muted">{t("itemSheet.step")}</span>
							{stepChoices.map((choice) => (
								<Button
									key={choice}
									variant={
										(chosenStep ?? stepFor(item.id)) === choice
											? "primary"
											: "secondary"
									}
									aria-pressed={(chosenStep ?? stepFor(item.id)) === choice}
									onClick={() => setChosenStep(choice)}
								>
									{formatNumber(choice)}
								</Button>
							))}
						</div>
						<div>
							<Button
								variant="danger"
								disabled={count === 0}
								onClick={() => {
									onSetToZero(item);
									onClose();
								}}
							>
								{t("itemSheet.setToZero")}
							</Button>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<SectionLabel className="text-muted">
							{t("itemSheet.description")}
						</SectionLabel>
						<p className={item.description ? "" : "text-muted"}>
							{item.description ?? t("itemSheet.unknown")}
						</p>
					</div>
					<div className="flex flex-col gap-1">
						<SectionLabel className="text-muted">{t("sources")}</SectionLabel>
						{item.sources.length === 0 ? (
							<p className="text-muted italic">{t("sourcesUnknown")}</p>
						) : (
							<ul>
								{item.sources.map((source) => (
									<li
										key={source}
										className="border-line border-t-[1.5px] py-2 break-words first:border-t-0"
									>
										{source}
									</li>
								))}
							</ul>
						)}
					</div>
				</>
			)}
		</Dialog>
	);
}

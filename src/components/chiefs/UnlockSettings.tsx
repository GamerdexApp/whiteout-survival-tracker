"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { UnlockArea, UnlockOverrides } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { autoUnlockDay, UNLOCK_AREAS, unlockStepsOf, unlockTotalOf } from "@/service/unlocks";
import type { UnlockStep } from "@/service/unlocks";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";

interface UnlockSettingsProps {
	/** A field that sits first in the grid, such as the hero generation. */
	leading?: ReactNode;
	serverStartDate: string;
	overrides: UnlockOverrides;
	onChange: (overrides: UnlockOverrides) => void;
}

const AUTO = "auto";

export function UnlockSettings({
	leading,
	serverStartDate,
	overrides,
	onChange,
}: UnlockSettingsProps) {
	const t = useTranslations("unlocks");

	const stepLabel = (area: UnlockArea, step: UnlockStep) => {
		const day = formatNumber(step.day);
		if (area === "pets" || area === "experts") {
			return t(area === "pets" ? "dialog.stepPets" : "dialog.stepExperts", {
				day,
				count: formatNumber(step.cumulative),
				total: formatNumber(unlockTotalOf(area)),
			});
		}
		if (area === "fireCrystal") {
			return t("dialog.stepFc", { day, last: step.names[step.names.length - 1] });
		}
		return t("dialog.stepNamed", { day, name: step.names[0] });
	};

	const autoText = (area: UnlockArea) => {
		const day = autoUnlockDay({ serverStartDate: serverStartDate || undefined }, area);
		if (day === null) return t("dialog.autoUnknown");
		const step = unlockStepsOf(area).find((item) => item.day === day);
		return t("dialog.auto", {
			current: step ? stepLabel(area, step) : t("dialog.autoNone"),
		});
	};

	const choose = (area: UnlockArea, value: string) => {
		const { [area]: _removed, ...others } = overrides;
		onChange(value === AUTO ? others : { ...others, [area]: Number(value) });
	};

	return (
		<fieldset className="flex flex-col gap-3 lg:col-span-2">
			<legend className="font-medium">{t("dialog.legend")}</legend>
			<p className="text-muted">{t("dialog.hint")}</p>
			<div className="grid gap-3 lg:grid-cols-2 lg:gap-x-6">
				{leading}
				{UNLOCK_AREAS.map((area) => {
					const steps = unlockStepsOf(area);
					const canBeNone = steps[0].day > 0;
					return (
						<Field key={area} label={t(`areas.${area}`)}>
							<Select
								aria-label={t("dialog.pickLabel", { area: t(`areas.${area}`) })}
								value={
									overrides[area] === undefined ? AUTO : String(overrides[area])
								}
								onChange={(event) => choose(area, event.target.value)}
							>
								<option value={AUTO}>{autoText(area)}</option>
								{canBeNone && <option value="0">{t("dialog.none")}</option>}
								{steps.map((step) => (
									<option key={step.day} value={step.day}>
										{stepLabel(area, step)}
									</option>
								))}
							</Select>
						</Field>
					);
				})}
			</div>
		</fieldset>
	);
}

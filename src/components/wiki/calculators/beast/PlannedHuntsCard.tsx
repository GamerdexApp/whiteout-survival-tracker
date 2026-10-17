"use client";

import { useTranslations } from "next-intl";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { MAX_BEAST_COUNT, withRunAdded, withRunChanged, withRunRemoved } from "@/service/calcBeast";
import type { BeastCalculatorInputs } from "@/service/calcBeast";
import { CountInput } from "@/comps/troops/CountInput";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { IconButton } from "@/comps/ui/IconButton";
import { BeastLevelSelect, useBeastLevelBandName } from "./BeastLevelSelect";

interface PlannedHuntsCardProps {
	inputs: BeastCalculatorInputs;
	onChange: (inputs: BeastCalculatorInputs) => void;
}

export function PlannedHuntsCard({ inputs, onChange }: PlannedHuntsCardProps) {
	const t = useTranslations("calcBeast.planned");
	const bandName = useBeastLevelBandName();

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">{t("title")}</h2>
				<p className="text-muted">{t("hint")}</p>
			</div>
			{inputs.beastRuns.length === 0 && <p className="text-muted">{t("empty")}</p>}
			{inputs.beastRuns.length > 0 && (
				<ul className="flex flex-col gap-3">
					{inputs.beastRuns.map((run, index) => (
						<li
							key={index}
							className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
						>
							<div className="col-span-2 sm:col-span-1">
								<Field label={t("runLevel")}>
									<BeastLevelSelect
										level={run.level}
										onChange={(level) =>
											onChange(
												withRunChanged(inputs, index, { ...run, level })
											)
										}
									/>
								</Field>
							</div>
							<Field label={t("runCount")}>
								<CountInput
									value={run.count}
									max={MAX_BEAST_COUNT}
									onCommit={(count) =>
										onChange(withRunChanged(inputs, index, { ...run, count }))
									}
								/>
							</Field>
							<IconButton
								label={t("remove", { band: bandName(run.level) })}
								className="text-danger hover:bg-tint"
								onClick={() => onChange(withRunRemoved(inputs, index))}
							>
								<LuTrash2 size={18} aria-hidden="true" />
							</IconButton>
						</li>
					))}
				</ul>
			)}
			<div>
				<Button onClick={() => onChange(withRunAdded(inputs))}>
					<LuPlus size={16} aria-hidden="true" />
					{t("add")}
				</Button>
			</div>
			<Field label={t("polarTerrors")}>
				<CountInput
					value={inputs.polarTerrors}
					max={MAX_BEAST_COUNT}
					onCommit={(polarTerrors) => onChange({ ...inputs, polarTerrors })}
				/>
			</Field>
		</Card>
	);
}

"use client";

import { useTranslations } from "next-intl";
import { LuLock, LuLockOpen } from "react-icons/lu";
import type { EventDayResultState } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { CountInput } from "@/comps/troops/CountInput";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Input } from "@/comps/ui/Input";

const MAX_SCORE = 999_999_999_999;
const MAX_RANK = 9_999_999;

export const DAY_ROW_COLUMNS = "lg:grid-cols-[minmax(0,1fr)_8rem_5rem_5rem_6.5rem]";

interface EventLogDayRowProps {
	name: string;
	planTotal: number;
	result: EventDayResultState;
	opensLater: boolean;
	onChange: (patch: Partial<EventDayResultState>) => void;
}

export function EventLogDayRow({
	name,
	planTotal,
	result,
	opensLater,
	onChange,
}: EventLogDayRowProps) {
	const t = useTranslations("eventLog.results");
	const locked = result.locked === true;

	return (
		<div
			className={`flex flex-col gap-3 py-4 lg:grid lg:items-center lg:gap-3 ${DAY_ROW_COLUMNS}`}
		>
			<div className="flex items-start justify-between gap-3 lg:contents">
				<div className="flex min-w-0 flex-col gap-0.5">
					<span className="font-semibold">{name}</span>
					<span className="text-muted font-mono text-xs">
						{opensLater
							? t("notStarted")
							: t("plan", { total: formatNumber(planTotal) })}
					</span>
				</div>
				<div className="flex flex-col items-end gap-1 lg:col-start-5 lg:row-start-1">
					{opensLater ? (
						<span className="text-muted">{t("opensLater")}</span>
					) : locked ? (
						<>
							<Badge tone="locked">{t("locked")}</Badge>
							<button
								type="button"
								aria-label={t("unlockDay", { day: name })}
								onClick={() => onChange({ locked: false })}
								className="text-link text-sm underline"
							>
								{t("unlock")}
							</button>
						</>
					) : (
						<Button
							aria-label={t("lockDay", { day: name })}
							onClick={() => onChange({ locked: true })}
						>
							<LuLockOpen size={14} aria-hidden="true" />
							{t("lock")}
						</Button>
					)}
				</div>
			</div>
			<div className="grid grid-cols-3 gap-3 lg:contents">
				<ResultField
					label={t("score")}
					ariaLabel={t("scoreOf", { day: name })}
					placeholder={t("score")}
					max={MAX_SCORE}
					value={result.score}
					disabled={opensLater}
					locked={locked}
					onCommit={(score) => onChange({ score })}
				/>
				<ResultField
					label={t("rank")}
					ariaLabel={t("rankOf", { day: name })}
					placeholder={t("rank")}
					max={MAX_RANK}
					value={result.rank}
					disabled={opensLater}
					locked={locked}
					onCommit={(rank) => onChange({ rank })}
				/>
				<ResultField
					label={t("alliance")}
					ariaLabel={t("allianceOf", { day: name })}
					placeholder={t("allianceShort")}
					max={MAX_RANK}
					value={result.allianceRank}
					disabled={opensLater}
					locked={locked}
					onCommit={(allianceRank) => onChange({ allianceRank })}
				/>
			</div>
		</div>
	);
}

interface ResultFieldProps {
	label: string;
	ariaLabel: string;
	placeholder: string;
	max: number;
	value: number | undefined;
	disabled: boolean;
	locked: boolean;
	onCommit: (value: number) => void;
}

export function ResultField({
	label,
	ariaLabel,
	placeholder,
	max,
	value,
	disabled,
	locked,
	onCommit,
}: ResultFieldProps) {
	const t = useTranslations("eventLog.results");

	return (
		<div className="flex min-w-0 flex-col gap-1.5 lg:block">
			{label && (
				<span aria-hidden="true" className="text-muted text-sm lg:hidden">
					{label}
				</span>
			)}
			{disabled ? (
				<Input
					disabled
					aria-label={ariaLabel}
					placeholder={placeholder}
					className="text-right"
				/>
			) : locked ? (
				<span
					className={`relative block px-3 py-2 text-right font-mono lg:px-0 ${value === undefined ? "text-muted" : ""}`}
				>
					<span className="sr-only">{ariaLabel}</span>
					{value === undefined ? t("empty") : formatNumber(value)}
				</span>
			) : (
				<CountInput label={ariaLabel} value={value ?? null} max={max} onCommit={onCommit} />
			)}
		</div>
	);
}

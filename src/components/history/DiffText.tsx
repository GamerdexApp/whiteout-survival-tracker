import { useTranslations } from "next-intl";
import { isAtOrAbovePlan } from "@/service/historyEvents";
import { signedNumber, signedPercent } from "./useHistoryText";

interface DiffTextProps {
	difference: number;
	percent?: number | null;
	className?: string;
}

export function DiffText({ difference, percent = null, className = "" }: DiffTextProps) {
	const t = useTranslations("history");
	const tone = isAtOrAbovePlan({ difference }) ? "text-kept" : "text-danger";
	const amount = signedNumber(difference);

	return (
		<span className={`${tone} font-mono ${className}`}>
			<span className="sr-only">
				{isAtOrAbovePlan({ difference }) ? t("atOrAbovePlan") : t("belowPlan")}{" "}
			</span>
			{percent === null
				? amount
				: t("list.diffWithPercent", { amount, percent: signedPercent(percent) })}
		</span>
	);
}

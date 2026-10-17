import type { AllianceTechLevel } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { requirementsOfTechLevel } from "@/service/wikiAllianceTech";

export function TechRequirements({ level }: { level: AllianceTechLevel }) {
	const t = useTranslations("wikiAllianceTech.detail");
	const requirements = requirementsOfTechLevel(level);

	if (requirements.length === 0) return <span className="text-muted">{t("none")}</span>;

	return (
		<ul className="flex flex-col gap-0.5 max-lg:items-end">
			{requirements.map(({ name, level: required }) => (
				<li key={name}>{t("requirement", { name, level: formatNumber(required) })}</li>
			))}
		</ul>
	);
}

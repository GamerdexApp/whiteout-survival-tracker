"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { SkillGate } from "@/service/experts";

/** Says what holds a skill back: the affinity level or the total of the four skill levels. */
export function SkillGateText({ gate }: { gate: SkillGate }) {
	const t = useTranslations("experts.card");

	if (gate.kind === "total") {
		return t("skillTotal", {
			next: formatNumber(gate.level),
			total: formatNumber(gate.total),
			have: formatNumber(gate.have),
		});
	}
	if (gate.level === 1) return t("skillLocked", { level: formatNumber(gate.affinity) });
	return t("skillCapped", {
		next: formatNumber(gate.level),
		level: formatNumber(gate.affinity),
	});
}

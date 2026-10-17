import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { hasStage } from "@/service/calcChiefGear";
import type { ChiefGearLevel } from "@/data/game/calcChiefGear";
import { useGameLabels } from "@/comps/wiki/useGameLabels";

export function useLevelName() {
  const t = useTranslations("calcChiefGear.level");
  const labels = useGameLabels();

  return (level: ChiefGearLevel) => {
    const parts = {
      tier: labels.rarityTier(level.tier),
      stars: formatNumber(level.stars),
      stage: formatNumber(level.stage),
    };
    return hasStage(level) ? t("withStage", parts) : t("plain", parts);
  };
}

import { useTranslations } from "next-intl";
import { DEFAULT_RESET_TIME } from "@/service/dailies";

export const useResetTimeLabel = () => {
  const t = useTranslations("dailies.reset");
  return (time: string) =>
    time === DEFAULT_RESET_TIME
      ? t("timeDefault", { time })
      : t("time", { time });
};

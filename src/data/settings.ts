import type { Theme, UiSettings } from "@/types/app";

export const defaultUiSettings: Required<UiSettings> = {
  furnaceFullLabels: false,
  hideMaxed: false,
  calcUseBonuses: true,
  calcShowSpeedups: false,
  calcShowEventPoints: false,
};

export const themeOptions: { id: Theme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

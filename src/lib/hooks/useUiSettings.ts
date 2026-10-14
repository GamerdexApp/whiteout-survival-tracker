import type { UiSettings } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { defaultUiSettings } from "@/data/settings";

export const useUiSettings = () => {
  const { settings, updateSettings } = usePlaythrough();

  return {
    ui: { ...defaultUiSettings, ...settings.ui },
    setUi: (updates: UiSettings) =>
      updateSettings({ ui: { ...settings.ui, ...updates } }),
  };
};

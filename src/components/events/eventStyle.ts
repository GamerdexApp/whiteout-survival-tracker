import type { EventCategory } from "@/data/game/gameEvents";

export const CATEGORY_BAR: Record<EventCategory, string> = {
  alliance: "bg-added",
  solo: "bg-kept",
  rookie: "bg-fixed",
  holiday: "bg-changed",
};

export const CATEGORY_BORDER: Record<EventCategory, string> = {
  alliance: "border-added",
  solo: "border-kept",
  rookie: "border-fixed",
  holiday: "border-changed",
};

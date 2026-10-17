import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";

export function useLandingAction() {
  const { activePlaythrough, playthroughs, isLoaded } = usePlaythrough();
  const returningChief = isLoaded ? activePlaythrough : null;

  return {
    returningChief,
    chiefCount: isLoaded ? playthroughs.length : 0,
    primary: returningChief
      ? { id: "goToOverview" as const, href: "/overview" }
      : { id: "createFirstChief" as const, href: "/chiefs?new=1" },
  };
}

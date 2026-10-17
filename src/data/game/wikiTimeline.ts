import { serverTimeline } from "whiteout-survival-data";

export type TimelineLineKind = "event" | "feature" | "pets" | "experts";

export interface TimelineLine {
  id: string;
  kind: TimelineLineKind;
  names: string[];
  images: string[];
  /** Pets and experts, each with its own image beside its name. */
  members?: TimelineHero[];
  fireCrystalLevels?: boolean;
}

export interface TimelineHero {
  name: string;
  img?: string;
}

export interface TimelineHeroGeneration {
  generation: number;
  heroes: TimelineHero[];
}

export interface WikiTimelineRow {
  day: number;
  lines: TimelineLine[];
  heroGenerations: TimelineHeroGeneration[];
}

const heroGenerationsOf = (
  heroes: { name: string; img?: string; generation: number }[],
): TimelineHeroGeneration[] => {
  const generations = [...new Set(heroes.map((hero) => hero.generation))];
  return generations.map((generation) => ({
    generation,
    heroes: heroes
      .filter((hero) => hero.generation === generation)
      .map(({ name, img }) => ({ name, img })),
  }));
};

const rowOf = (
  milestone: ReturnType<ReturnType<typeof serverTimeline>["resolve"]>[number],
): WikiTimelineRow => {
  const lines: TimelineLine[] = [
    ...milestone.events.map((event): TimelineLine => ({
      id: `event-${event.id}`,
      kind: "event",
      names: [event.name],
      images: event.img ? [event.img] : [],
    })),
    ...milestone.unlocks.map((unlock, index): TimelineLine => ({
      id: `feature-${index}`,
      kind: "feature",
      names: [unlock.name],
      images: unlock.images ?? [],
    })),
  ];
  if (milestone.fireCrystalLevels.length > 0) {
    lines.push({
      id: "fire-crystal-levels",
      kind: "feature",
      names: milestone.fireCrystalLevels.map((level) => level.name),
      images: milestone.fireCrystalLevels.flatMap((level) =>
        level.img ? [level.img] : [],
      ),
      fireCrystalLevels: true,
    });
  }
  if (milestone.pets.length > 0) {
    lines.push({
      id: "pets",
      kind: "pets",
      names: milestone.pets.map((pet) => pet.name),
      images: [],
      members: milestone.pets.map(({ name, img }) => ({ name, img })),
    });
  }
  if (milestone.experts.length > 0) {
    lines.push({
      id: "experts",
      kind: "experts",
      names: milestone.experts.map((expert) => expert.name),
      images: [],
      members: milestone.experts.map(({ name, img }) => ({ name, img })),
    });
  }
  return {
    day: milestone.day,
    lines,
    heroGenerations: heroGenerationsOf(milestone.heroes),
  };
};

export const wikiTimelineRows: WikiTimelineRow[] = serverTimeline()
  .resolve()
  .map(rowOf)
  .sort((a, b) => a.day - b.day);

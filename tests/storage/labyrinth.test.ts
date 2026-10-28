import { describe, expect, it } from "vitest";
import type { HeroGearSet, LabyrinthTroopSplit } from "@/types/app";
import { catalogMatches, categoryCounts } from "@/service/eventsPage";
import { buildHeroViews, heroPowerParts } from "@/service/heroes";
import { emptyPiece, setPower, slotIds } from "@/service/heroGear";
import {
  buildLabyrinthView,
  glowstoneBonusPercentAt,
  justusBonusOf,
  justusLevelOf,
  stagesClearedOf,
  withZoneStages,
} from "@/service/labyrinth";
import {
  formationsDraftOf,
  heroChoicesFor,
  heroPowerWithGearOf,
  isDraftValid,
  splitTotalOf,
  withFormations,
} from "@/service/labyrinthFormations";
import type { FormationsDraft } from "@/service/labyrinthFormations";
import { addableGameEvents, allGameEvents } from "@/data/game/gameEvents";
import {
  LABYRINTH_GLOWSTONE_PER_STAGE,
  labyrinthZones,
} from "@/data/game/labyrinth";
import { emptyChief } from "./fixtures";

const zoneNamed = (name: string) =>
  labyrinthZones.find((zone) => zone.name === name)!;

describe("Labyrinth zones", () => {
  it("has six zones with unique ids", () => {
    const ids = labyrinthZones.map((zone) => zone.id);

    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
  });

  it("reads a missing stage as zero and keeps a saved stage within the zone", () => {
    const zone = zoneNamed("Cave of Monsters");

    expect(stagesClearedOf(emptyChief(), zone)).toBe(0);
    expect(
      stagesClearedOf(withZoneStages(emptyChief(), zone, 9999), zone),
    ).toBe(zone.stages);
    expect(stagesClearedOf(withZoneStages(emptyChief(), zone, -4), zone)).toBe(
      0,
    );
  });
});

describe("Labyrinth Glowstone", () => {
  it("pays the per stage amount once a week for each zone, whatever the number of open days", () => {
    const cave = zoneNamed("Cave of Monsters");
    const gaia = zoneNamed("Gaia Heart");
    const chief = withZoneStages(
      withZoneStages(emptyChief(), cave, 49),
      gaia,
      100,
    );

    const view = buildLabyrinthView(chief);

    // The package notes 49 Cave of Monsters stages showing 490 Glowstone.
    expect(cave.days).toHaveLength(2);
    expect(
      view.zones.find((zone) => zone.zone === cave)!.glowstonePerWeek,
    ).toBe(490);
    expect(view.weeklyBase).toBe((49 + 100) * LABYRINTH_GLOWSTONE_PER_STAGE);
  });

  it("adds the Justus Glorious Gains percent to the weekly total, rounded down", () => {
    expect(justusBonusOf(2000, 5)).toBe(400);
    expect(justusBonusOf(2000, 1)).toBe(80);
    expect(justusBonusOf(10, 1)).toBe(0);
  });

  it("gives no bonus before Justus is learned", () => {
    expect(glowstoneBonusPercentAt(0)).toBe(0);
    expect(justusBonusOf(2000, 0)).toBe(0);
    expect(buildLabyrinthView(emptyChief()).weeklyBonus).toBe(0);
  });

  it("reads the Justus level from the Experts page and never from this page", () => {
    // Justus has no stat bonus data yet, so the Experts page does not track him.
    expect(justusLevelOf(emptyChief())).toBe(0);
  });
});

describe("Labyrinth Core milestones", () => {
  it("marks a milestone reached when the stages cleared reach its Core total", () => {
    const land = zoneNamed("Land of Heroes");

    const view = buildLabyrinthView(withZoneStages(emptyChief(), land, 30));

    const reached = view.milestones.filter((entry) => entry.reached);
    expect(reached.map((entry) => entry.milestone.scoreTotal)).toEqual([
      10, 30,
    ]);
  });
});

describe("Events page", () => {
  it("does not offer the Labyrinth, which has its own page", () => {
    expect(
      addableGameEvents().some((event) => event.id === "the-labyrinth"),
    ).toBe(false);
    expect(catalogMatches("labyrinth", "all")).toEqual([]);
    expect(categoryCounts().all).toBe(allGameEvents().length - 1);
  });
});

describe("Labyrinth formations", () => {
  const heroZone = "land-of-heroes";
  const troopZone = "cave-of-monsters";

  const heroFormationsOf = (draft: FormationsDraft) => {
    const zone = draft[heroZone];
    if (zone.kind !== "heroes") throw new Error("Expected a hero zone");
    return zone.formations;
  };

  const filled = (): FormationsDraft => {
    const draft = formationsDraftOf(emptyChief());
    const [first] = heroFormationsOf(draft);
    first.heroes = { infantry: "a", lancer: "b", marksman: null };
    first.troops = { infantry: 50, lancer: 20, marksman: 30 };
    draft[troopZone] = {
      kind: "troops",
      troops: { infantry: 100, lancer: 0, marksman: 0 },
    };
    return draft;
  };

  it("gives the hero zones three formations and every other zone one troop split", () => {
    const draft = formationsDraftOf(emptyChief());

    expect(Object.keys(draft)).toEqual(labyrinthZones.map((zone) => zone.id));
    expect(heroFormationsOf(draft)).toHaveLength(3);
    expect(draft["gaia-heart"].kind).toBe("heroes");
    ["cave-of-monsters", "charm-mine", "research-center", "gear-forge"].forEach(
      (id) => expect(draft[id].kind).toBe("troops"),
    );
    expect(isDraftValid(draft)).toBe(true);
  });

  it("needs every troop split to total 100 or stay at 0", () => {
    const draft = filled();
    expect(isDraftValid(draft)).toBe(true);

    heroFormationsOf(draft)[1].troops = {
      infantry: 40,
      lancer: 40,
      marksman: 0,
    };
    expect(isDraftValid(draft)).toBe(false);

    heroFormationsOf(draft)[1].troops = { infantry: 0, lancer: 0, marksman: 0 };
    draft[troopZone] = {
      kind: "troops",
      troops: { infantry: 60, lancer: 30, marksman: 20 },
    };
    expect(isDraftValid(draft)).toBe(false);
  });

  it("keeps the formation of each zone apart from the others", () => {
    const chief = withFormations(emptyChief(), filled());

    const draft = formationsDraftOf(chief);

    expect(heroFormationsOf(draft)[0].heroes.infantry).toBe("a");
    const gaia = draft["gaia-heart"];
    expect(
      gaia.kind === "heroes" && gaia.formations[0].heroes.infantry,
    ).toBeNull();
    expect(
      splitTotalOf(
        (draft[troopZone] as { troops: LabyrinthTroopSplit }).troops,
      ),
    ).toBe(100);
    expect(draft["charm-mine"]).toEqual({
      kind: "troops",
      troops: { infantry: 0, lancer: 0, marksman: 0 },
    });
  });

  it("reads back what it saved", () => {
    const draft = filled();

    expect(formationsDraftOf(withFormations(emptyChief(), draft))).toEqual(
      draft,
    );
  });

  it("clears a saved troop split when the draft sets it back to 0", () => {
    const saved = withFormations(emptyChief(), filled());
    const draft = formationsDraftOf(saved);
    draft[troopZone] = {
      kind: "troops",
      troops: { infantry: 0, lancer: 0, marksman: 0 },
    };

    expect(
      withFormations(saved, draft).labyrinth?.formations?.[troopZone].troops,
    ).toBeUndefined();
  });

  it("keeps stage progress when formations are saved", () => {
    const cave = zoneNamed("Cave of Monsters");
    const chief = withFormations(
      withZoneStages(emptyChief(), cave, 12),
      filled(),
    );

    expect(stagesClearedOf(chief, cave)).toBe(12);
  });

  it("hides a hero that another formation of the zone uses, but keeps the hero it holds", () => {
    const veteran = { ...emptyChief(), heroGenerationUnlocked: 12 };
    const views = buildHeroViews(veteran).map((view) => ({
      ...view,
      owned: true,
    }));
    const powerOf = heroPowerWithGearOf(veteran);
    const infantry = views.filter((view) => view.hero.class === "Infantry");
    const formations = heroFormationsOf(formationsDraftOf(veteran));
    formations[0].heroes.infantry = infantry[0].hero.id;
    formations[1].heroes.infantry = infantry[1].hero.id;

    const forFirst = heroChoicesFor(
      views,
      formations,
      0,
      "infantry",
      powerOf,
    ).map((view) => view.hero.id);
    const forSecond = heroChoicesFor(
      views,
      formations,
      1,
      "infantry",
      powerOf,
    ).map((view) => view.hero.id);

    expect(forFirst).toContain(infantry[0].hero.id);
    expect(forFirst).not.toContain(infantry[1].hero.id);
    expect(forSecond).toContain(infantry[1].hero.id);
    expect(forSecond).not.toContain(infantry[0].hero.id);
  });

  it("lets two zones use the same hero", () => {
    const draft = filled();
    const gaia = draft["gaia-heart"];
    if (gaia.kind === "heroes") gaia.formations[0].heroes.infantry = "a";

    expect(isDraftValid(draft)).toBe(true);
  });
});

describe("Labyrinth hero choices", () => {
  const veteran = { ...emptyChief(), heroGenerationUnlocked: 12 };
  const ownedViews = () =>
    buildHeroViews(veteran).map((view) => ({ ...view, owned: true }));
  const firstFormation = () => {
    const zone = formationsDraftOf(veteran)["land-of-heroes"];
    return zone.kind === "heroes" ? zone.formations : [];
  };

  it("lists the strongest hero first and the heroes with unknown power last", () => {
    const powerOf = heroPowerWithGearOf(veteran);

    const powers = heroChoicesFor(
      ownedViews(),
      firstFormation(),
      0,
      "infantry",
      powerOf,
    ).map(powerOf);

    const known = powers.filter((power): power is number => power !== null);
    expect(known).toEqual([...known].sort((a, b) => b - a));
    expect(powers.slice(0, known.length)).toEqual(known);
  });

  it("adds the power of the gear set linked to the hero", () => {
    const view = ownedViews().find(
      (item) => heroPowerParts(item).total !== null,
    )!;
    const piece = { ...emptyPiece(), enhancement: 20 };
    const set: HeroGearSet = {
      id: "set-1",
      name: "Set",
      troopType: "infantry",
      heroId: view.hero.id,
      pieces: {
        ...Object.fromEntries(slotIds.map((slot) => [slot, piece])),
      } as HeroGearSet["pieces"],
    };
    const withGear = { ...veteran, heroGear: { sets: [set] } };

    const bare = heroPowerWithGearOf(veteran)(view);
    const geared = heroPowerWithGearOf(withGear)(view);

    expect(setPower(set)).toBeGreaterThan(0);
    expect(geared).toBe(bare! + setPower(set));
  });

  it("counts only the strongest set when several link to one hero", () => {
    const view = ownedViews().find(
      (item) => heroPowerParts(item).total !== null,
    )!;
    const setWith = (id: string, enhancement: number): HeroGearSet => ({
      id,
      name: id,
      troopType: "infantry",
      heroId: view.hero.id,
      pieces: Object.fromEntries(
        slotIds.map((slot) => [slot, { ...emptyPiece(), enhancement }]),
      ) as HeroGearSet["pieces"],
    });
    const weak = setWith("weak", 5);
    const strong = setWith("strong", 20);
    const chief = { ...veteran, heroGear: { sets: [weak, strong] } };

    expect(heroPowerWithGearOf(chief)(view)).toBe(
      heroPowerParts(view).total! + setPower(strong),
    );
  });
});

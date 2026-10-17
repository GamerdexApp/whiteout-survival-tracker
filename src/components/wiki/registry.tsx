"use client";

import type { ComponentType } from "react";
import type { WikiPageId } from "@/data/wiki";
import { AllianceStructuresPage } from "./pages/AllianceStructuresPage";
import { AllianceTechPage } from "./pages/AllianceTechPage";
import { BuildingsPage } from "./pages/BuildingsPage";
import { ChiefCharmsPage } from "./pages/ChiefCharmsPage";
import { ChiefGearPage } from "./pages/ChiefGearPage";
import { DailiesPage } from "./pages/DailiesPage";
import { DaybreakPage } from "./pages/DaybreakPage";
import { EventBuffsPage } from "./pages/EventBuffsPage";
import { EventsPage } from "./pages/EventsPage";
import { ExpertsPage } from "./pages/ExpertsPage";
import { FireCrystalPage } from "./pages/FireCrystalPage";
import { FireCrystalShardsPage } from "./pages/FireCrystalShardsPage";
import { HeroesPage } from "./pages/HeroesPage";
import { HeroGearPage } from "./pages/HeroGearPage";
import { ItemsPage } from "./pages/ItemsPage";
import { PetsPage } from "./pages/PetsPage";
import { ResearchPage } from "./pages/ResearchPage";
import { SkinsPage } from "./pages/SkinsPage";
import { TroopsPage } from "./pages/TroopsPage";
import { TundraAlbumPage } from "./pages/TundraAlbumPage";
import { VipPage } from "./pages/VipPage";
import type { WikiPageProps } from "./WikiPageProps";

export const wikiPageComponents: Record<WikiPageId, ComponentType<WikiPageProps>> = {
	buildings: BuildingsPage,
	fireCrystal: FireCrystalPage,
	heroes: HeroesPage,
	heroGear: HeroGearPage,
	experts: ExpertsPage,
	pets: PetsPage,
	chiefGear: ChiefGearPage,
	chiefCharms: ChiefCharmsPage,
	troops: TroopsPage,
	research: ResearchPage,
	fireCrystalShards: FireCrystalShardsPage,
	allianceTech: AllianceTechPage,
	allianceStructures: AllianceStructuresPage,
	daybreak: DaybreakPage,
	events: EventsPage,
	eventBuffs: EventBuffsPage,
	items: ItemsPage,
	skins: SkinsPage,
	vip: VipPage,
	tundraAlbum: TundraAlbumPage,
	dailies: DailiesPage,
};

import { skins } from "whiteout-survival-data";
import type { Skin, SkinType } from "whiteout-survival-data";

export const allSkins: Skin[] = skins().get();

export const findSkin = (id: string) => skins().find(id);

export const skinTypes: SkinType[] = [
  ...new Set(allSkins.map((skin) => skin.skinType)),
];

export const skinsOfType = (skinType: SkinType) =>
  skins().bySkinType(skinType).get();

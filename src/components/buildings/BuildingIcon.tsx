import type { BuildingView } from "@/service/buildings";

export function BuildingIcon({ view }: { view: BuildingView }) {
	const { building, order } = view;
	const level = building.levels.find((candidate) => candidate.order === order);
	const image =
		level?.tier === "fireCrystal" && building.fireCrystalImg
			? building.fireCrystalImg
			: building.img;

	if (!image) {
		return (
			<span
				aria-hidden="true"
				className="border-line size-10 shrink-0 rounded-md border-[1.5px] border-dashed"
			/>
		);
	}

	return (
		<img src={image} alt="" width={40} height={40} className="size-10 shrink-0 rounded-md" />
	);
}

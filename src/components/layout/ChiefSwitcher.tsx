"use client";

import { LuChevronDown, LuPlus } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/comps/ui/Menu";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const describeChief = (chief: Playthrough) =>
	chief.stateNumber === undefined ? "" : `State ${chief.stateNumber}`;

export function ChiefSwitcher({ onNavigate }: { onNavigate?: () => void }) {
	const { playthroughs, activePlaythrough, isLoaded, setActivePlaythrough } = usePlaythrough();

	const triggerName = !isLoaded ? "Loading" : (activePlaythrough?.name ?? "No chief yet");
	const triggerDetail = activePlaythrough ? describeChief(activePlaythrough) : "";

	return (
		<div className="flex flex-col gap-1.5">
			<SectionLabel className="text-sb-muted">Chief</SectionLabel>
			<Menu
				label="Switch chief"
				trigger={({ props }) => (
					<button
						type="button"
						disabled={!isLoaded}
						{...props}
						className="border-sb-line text-sb-text flex h-12 w-full items-center justify-between gap-2 rounded-md border-[1.5px] px-3 text-left"
					>
						<span className="flex min-w-0 items-center gap-2.5">
							<span
								aria-hidden="true"
								className="bg-sb-line flex size-7 shrink-0 items-center justify-center rounded font-mono text-xs uppercase"
							>
								{activePlaythrough?.name.charAt(0)}
							</span>
							<span className="flex min-w-0 flex-col">
								<span className="truncate font-medium">{triggerName}</span>
								{triggerDetail && (
									<span className="text-sb-muted truncate text-xs">
										{triggerDetail}
									</span>
								)}
							</span>
						</span>
						<LuChevronDown
							size={14}
							aria-hidden="true"
							className="text-sb-muted shrink-0"
						/>
					</button>
				)}
			>
				{(close) => (
					<>
						{playthroughs.length > 0 && (
							<>
								<MenuLabel>Chiefs</MenuLabel>
								{playthroughs.map((chief) => {
									const isActive = chief.id === activePlaythrough?.id;
									return (
										<MenuItem
											key={chief.id}
											active={isActive}
											onSelect={() => {
												setActivePlaythrough(chief.id);
												close();
											}}
										>
											<span className="flex min-w-0 flex-col">
												<span className="truncate font-medium">
													{chief.name}
												</span>
												<span className="text-muted truncate text-xs">
													{describeChief(chief)}
												</span>
											</span>
											{isActive && (
												<span className="text-primary font-mono text-xs font-medium">
													Active
												</span>
											)}
										</MenuItem>
									);
								})}
								<MenuSeparator />
							</>
						)}
						<MenuItem
							href="/chiefs"
							onSelect={() => {
								close();
								onNavigate?.();
							}}
							className="justify-start font-medium"
						>
							All chiefs
						</MenuItem>
						<MenuItem
							href="/chiefs?new=1"
							onSelect={() => {
								close();
								onNavigate?.();
							}}
							className="text-primary justify-start gap-2.5 font-semibold"
						>
							<LuPlus size={16} aria-hidden="true" />
							New chief
						</MenuItem>
					</>
				)}
			</Menu>
		</div>
	);
}

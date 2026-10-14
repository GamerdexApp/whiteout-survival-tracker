"use client";

import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { LuChevronDown, LuPlus } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { describeChief } from "@/service/chiefs";
import { Dialog } from "@/comps/ui/Dialog";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/comps/ui/Menu";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface ChiefChoicesProps {
	inMenu: boolean;
	close: () => void;
	onNavigate?: () => void;
}

function ChiefChoices({ inMenu, close, onNavigate }: ChiefChoicesProps) {
	const { playthroughs, activePlaythrough, setActivePlaythrough } = usePlaythrough();
	const role = inMenu ? "menuitem" : "button";
	const followLink = () => {
		close();
		onNavigate?.();
	};

	return (
		<>
			{playthroughs.length > 0 && (
				<>
					{inMenu && <MenuLabel>Chiefs</MenuLabel>}
					{playthroughs.map((chief) => {
						const isActive = chief.id === activePlaythrough?.id;
						return (
							<MenuItem
								key={chief.id}
								role={role}
								active={isActive}
								className="justify-between gap-2"
								onSelect={() => {
									setActivePlaythrough(chief.id);
									close();
								}}
							>
								<span className="flex min-w-0 flex-col">
									<span className="truncate font-medium">{chief.name}</span>
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
				role={role}
				href="/chiefs"
				onSelect={followLink}
				className="gap-2 font-medium"
			>
				All chiefs
			</MenuItem>
			<MenuItem
				role={role}
				href="/chiefs?new=1"
				onSelect={followLink}
				className="text-primary gap-2.5 font-semibold"
			>
				<LuPlus size={16} aria-hidden="true" />
				New chief
			</MenuItem>
		</>
	);
}

export function ChiefSwitcher({ onNavigate }: { onNavigate?: () => void }) {
	const { activePlaythrough, isLoaded } = usePlaythrough();
	const isDesktop = useIsDesktop();
	const [sheetOpen, setSheetOpen] = useState(false);

	const triggerName = !isLoaded ? "Loading" : (activePlaythrough?.name ?? "No chief yet");
	const triggerDetail = activePlaythrough ? describeChief(activePlaythrough) : "";

	const renderTrigger = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
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
						<span className="text-sb-muted truncate text-xs">{triggerDetail}</span>
					)}
				</span>
			</span>
			<LuChevronDown size={14} aria-hidden="true" className="text-sb-muted shrink-0" />
		</button>
	);

	return (
		<div className="flex flex-col gap-1.5">
			<SectionLabel className="text-sb-muted">Chief</SectionLabel>
			{isDesktop ? (
				<Menu label="Switch chief" trigger={({ props }) => renderTrigger(props)}>
					{(close) => <ChiefChoices inMenu close={close} onNavigate={onNavigate} />}
				</Menu>
			) : (
				<>
					{renderTrigger({
						"aria-haspopup": "dialog",
						onClick: () => setSheetOpen(true),
					})}
					<Dialog
						open={sheetOpen}
						onClose={() => setSheetOpen(false)}
						title="Switch chief"
					>
						<div className="-mx-2 flex flex-col gap-0.5">
							<ChiefChoices
								inMenu={false}
								close={() => setSheetOpen(false)}
								onNavigate={onNavigate}
							/>
						</div>
					</Dialog>
				</>
			)}
		</div>
	);
}

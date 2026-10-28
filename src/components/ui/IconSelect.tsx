"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { LuChevronDown } from "react-icons/lu";
import { useDismiss } from "@/lib/hooks/useDismiss";
import { useFieldControl } from "./Field";
import { ItemIcon } from "./ItemIcon";

export interface IconSelectOption {
	id: string;
	label: string;
	/** The image address. An option with no icon shows its label alone. */
	icon?: string;
}

interface IconSelectProps {
	label: string;
	options: IconSelectOption[];
	value: string;
	onChange: (id: string) => void;
}

const OPTION_SELECTOR = '[role="option"]';

function OptionLabel({ option }: { option: IconSelectOption }) {
	return (
		<span className="flex min-w-0 flex-1 items-center gap-2">
			{option.icon && <ItemIcon src={option.icon} size={24} />}
			<span className="truncate">{option.label}</span>
		</span>
	);
}

/**
 * A native select cannot show an image in its options, so this list draws its own rows. It reads
 * the id of an enclosing `Field`, so the label of the field names the button.
 */
export function IconSelect({ label, options, value, onChange }: IconSelectProps) {
	const field = useFieldControl();
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const selected = options.find((option) => option.id === value) ?? options[0];

	useDismiss(containerRef, open, () => setOpen(false));

	const focusTrigger = () =>
		containerRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();

	const focusSelectedOption = (node: HTMLDivElement | null) => {
		listRef.current = node;
		const active = node?.querySelector<HTMLElement>('[aria-selected="true"]');
		active?.focus();
		active?.scrollIntoView({ block: "nearest" });
	};

	const choose = (id: string) => {
		onChange(id);
		setOpen(false);
		focusTrigger();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape" && open) {
			event.preventDefault();
			setOpen(false);
			focusTrigger();
			return;
		}
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		event.preventDefault();
		if (!open) {
			setOpen(true);
			return;
		}
		const items = Array.from(
			listRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []
		);
		const index = items.indexOf(document.activeElement as HTMLElement);
		const step = event.key === "ArrowDown" ? 1 : -1;
		items[(index + step + items.length) % items.length]?.focus();
	};

	return (
		<div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
			<button
				type="button"
				id={field?.id}
				aria-describedby={field?.describedBy}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={label}
				onClick={() => setOpen((current) => !current)}
				className="border-line bg-surface text-ink flex min-h-11 w-full items-center gap-2 rounded-md border-[1.5px] ps-3 pe-3 text-start lg:min-h-9"
			>
				<OptionLabel option={selected} />
				<LuChevronDown size={16} aria-hidden="true" className="text-muted shrink-0" />
			</button>
			{open && (
				<div
					ref={focusSelectedOption}
					role="listbox"
					aria-label={label}
					className="border-line bg-surface text-ink absolute inset-x-0 top-full z-20 mt-1 flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-md border-[1.5px] p-1.5"
				>
					{options.map((option) => {
						const active = option.id === selected.id;
						return (
							<div
								key={option.id}
								role="option"
								aria-selected={active}
								tabIndex={-1}
								onClick={() => choose(option.id)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										choose(option.id);
									}
								}}
								className={`hover:bg-tint focus:bg-tint flex min-h-11 cursor-pointer items-center rounded-md px-2 outline-none lg:min-h-9 ${active ? "bg-tint" : ""}`}
							>
								<OptionLabel option={option} />
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode } from "react";

interface TriggerState {
	open: boolean;
	props: ButtonHTMLAttributes<HTMLButtonElement>;
}

interface MenuProps {
	label: string;
	trigger: (state: TriggerState) => ReactNode;
	children: ReactNode | ((close: () => void) => ReactNode);
	className?: string;
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]';

export function Menu({ label, trigger, children, className = "" }: MenuProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	const close = () => setOpen(false);

	const focusTrigger = () => {
		containerRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
	};

	useEffect(() => {
		if (!open) return;

		panelRef.current?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus();

		const closeOnOutsidePress = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener("pointerdown", closeOnOutsidePress);
		return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
	}, [open]);

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			event.stopPropagation();
			setOpen(false);
			focusTrigger();
			return;
		}

		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

		event.preventDefault();
		const items = Array.from(
			panelRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? []
		);
		const index = items.indexOf(document.activeElement as HTMLElement);
		const step = event.key === "ArrowDown" ? 1 : -1;
		items[(index + step + items.length) % items.length]?.focus();
	};

	return (
		<div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
			{trigger({
				open,
				props: {
					"aria-haspopup": "menu",
					"aria-expanded": open,
					onClick: () => setOpen((current) => !current),
				},
			})}
			{open && (
				<div
					ref={panelRef}
					role="menu"
					aria-label={label}
					className="border-line bg-surface text-ink absolute inset-x-0 top-full z-20 mt-1 flex flex-col gap-0.5 rounded-md border-[1.5px] p-1.5"
				>
					{typeof children === "function" ? children(close) : children}
				</div>
			)}
		</div>
	);
}

const menuItemClasses =
	"flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2.5 py-1 text-left hover:bg-tint lg:min-h-9";

interface MenuItemProps {
	children: ReactNode;
	onSelect?: () => void;
	href?: string;
	active?: boolean;
	className?: string;
}

export function MenuItem({ children, onSelect, href, active, className = "" }: MenuItemProps) {
	const classes = `${menuItemClasses} ${active ? "bg-tint" : ""} ${className}`;

	if (href) {
		return (
			<Link role="menuitem" href={href} onClick={onSelect} className={classes}>
				{children}
			</Link>
		);
	}

	return (
		<button type="button" role="menuitem" onClick={onSelect} className={classes}>
			{children}
		</button>
	);
}

export function MenuLabel({ children }: { children: ReactNode }) {
	return (
		<span className="text-muted px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase">
			{children}
		</span>
	);
}

export function MenuSeparator() {
	return <hr className="border-line my-1 border-t-[1.5px]" />;
}

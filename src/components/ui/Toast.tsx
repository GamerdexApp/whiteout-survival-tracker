"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { SectionLabel } from "./SectionLabel";

type ToastVariant = "success" | "info" | "undo" | "error";

interface ToastAction {
	label: string;
	onAction: () => void;
}

interface ToastOptions {
	variant: ToastVariant;
	title: string;
	message?: string;
	action?: ToastAction;
}

interface ToastItem extends ToastOptions {
	id: number;
}

const SECOND_MS = 1_000;

// An error stays until the player dismisses it.
const autoCloseMs: Record<ToastVariant, number | null> = {
	success: 6 * SECOND_MS,
	info: 6 * SECOND_MS,
	undo: 10 * SECOND_MS,
	error: null,
};

const variantStyles: Record<ToastVariant, { label: string; className: string }> = {
	success: { label: "Success", className: "text-kept" },
	info: { label: "Info", className: "text-added" },
	undo: { label: "Undo", className: "text-changed" },
	error: { label: "Error", className: "text-danger" },
};

const ToastContext = createContext<((options: ToastOptions) => void) | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const nextIdRef = useRef(0);
	const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

	const dismiss = (id: number) => {
		clearTimeout(timersRef.current.get(id));
		timersRef.current.delete(id);
		setToasts((current) => current.filter((toast) => toast.id !== id));
	};

	const show = (options: ToastOptions) => {
		const id = nextIdRef.current++;
		setToasts((current) => [{ ...options, id }, ...current]);

		const closeAfterMs = autoCloseMs[options.variant];
		if (closeAfterMs !== null) {
			timersRef.current.set(
				id,
				setTimeout(() => dismiss(id), closeAfterMs)
			);
		}
	};

	useEffect(() => {
		const timers = timersRef.current;
		return () => timers.forEach((timer) => clearTimeout(timer));
	}, []);

	return (
		<ToastContext.Provider value={show}>
			{children}
			<div
				role="status"
				aria-live="polite"
				className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 lg:left-auto lg:w-96"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className="border-line bg-surface text-ink pointer-events-auto flex items-start gap-2 rounded-md border-[1.5px] py-2 pr-1 pl-4"
					>
						<div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1">
							<SectionLabel className={variantStyles[toast.variant].className}>
								{variantStyles[toast.variant].label}
							</SectionLabel>
							<span className="font-medium">{toast.title}</span>
							{toast.message && <span className="text-muted">{toast.message}</span>}
						</div>
						{toast.action && (
							<Button
								variant="link"
								onClick={() => {
									toast.action?.onAction();
									dismiss(toast.id);
								}}
							>
								{toast.action.label}
							</Button>
						)}
						<IconButton
							label="Dismiss"
							className="text-muted hover:bg-tint"
							onClick={() => dismiss(toast.id)}
						>
							<LuX aria-hidden="true" />
						</IconButton>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

import { I18nProvider } from "@/i18n/I18nProvider";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData, Playthrough } from "@/types/app";
import { PlaythroughProvider, usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { SyncProvider } from "@/lib/contexts/SyncContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { ToastProvider } from "@/comps/ui/Toast";

/** Renders with the active chief as it is saved now, like a page behind the chief gate. */
export function Live({ children }: { children: (chief: Playthrough) => ReactNode }) {
	const { activePlaythrough } = usePlaythrough();
	return activePlaythrough ? children(activePlaythrough) : null;
}

let root: Root | null = null;
let container: HTMLElement | null = null;

export const seed = (chief: Playthrough) => {
	const data: AppData = { playthroughs: [chief], activePlaythroughId: chief.id };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const savedChief = () =>
	(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData).playthroughs[0];

/** Mounts the page inside the same providers as the app. */
export const mount = async (ui: ReactNode) => {
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
	await act(async () => {
		root!.render(
			<I18nProvider>
				<UIProvider>
					<ToastProvider>
						<PlaythroughProvider>
							<SyncProvider>{ui}</SyncProvider>
						</PlaythroughProvider>
					</ToastProvider>
				</UIProvider>
			</I18nProvider>
		);
	});
	return container;
};

export const unmount = async () => {
	await act(async () => root?.unmount());
	container?.remove();
	root = null;
	container = null;
};

export const page = () => container!;
export const text = () => page().textContent ?? "";

export const click = async (element: Element | null | undefined) => {
	if (!element) throw new Error("Nothing to click");
	await act(async () => {
		element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};

/** Types into a field the way a person does: the value changes and an input event fires. */
export const type = async (input: HTMLInputElement | null | undefined, value: string) => {
	if (!input) throw new Error("No field to type into");
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
			input,
			value
		);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
};

export const field = (label: string) =>
	page().querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);

export const button = (label: string | RegExp) =>
	[...page().querySelectorAll<HTMLElement>("button, [role=tab], summary")].find((element) => {
		const name = element.getAttribute("aria-label") ?? element.textContent ?? "";
		return typeof label === "string" ? name.trim() === label : label.test(name);
	});

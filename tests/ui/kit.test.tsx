import { afterEach, describe, expect, it, vi } from "vitest";
import { act, useState } from "react";
import { CountInput } from "@/comps/resources/CountControl";
import { CollapsibleSection } from "@/comps/ui/CollapsibleSection";
import { PlanFooter } from "@/comps/ui/PlanFooter";
import { Switch } from "@/comps/ui/Switch";
import { Tabs } from "@/comps/ui/Tabs";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { button, click, mount, page, text, type, unmount } from "../pages/harness";

afterEach(unmount);

describe("Switch", () => {
	const Demo = () => {
		const [on, setOn] = useState(false);
		return <Switch checked={on} onChange={setOn} label="Show completed" />;
	};

	it("turns on and off with a click", async () => {
		await mount(<Demo />);
		const toggle = () => page().querySelector("[role=switch]")!;

		expect(toggle().getAttribute("aria-checked")).toBe("false");
		await click(toggle());
		expect(toggle().getAttribute("aria-checked")).toBe("true");
		await click(toggle());
		expect(toggle().getAttribute("aria-checked")).toBe("false");
	});
});

describe("Tabs", () => {
	const Demo = () => {
		const [id, setId] = useState<"core" | "all">("core");
		return (
			<Tabs
				label="Views"
				tabs={[
					{ id: "core", label: "Core" },
					{ id: "all", label: "All", count: 418 },
				]}
				activeId={id}
				onChange={setId}
			>
				<p>{id} panel</p>
			</Tabs>
		);
	};

	it("shows the panel of the selected tab", async () => {
		await mount(<Demo />);

		expect(text()).toContain("core panel");
		await click(button(/^All/));
		expect(text()).toContain("all panel");
		expect(button(/^All/)?.getAttribute("aria-selected")).toBe("true");
	});

	it("moves between tabs with the arrow keys and wraps around", async () => {
		await mount(<Demo />);
		const list = page().querySelector("[role=tablist]")!;
		const press = (key: string) =>
			act(async () => {
				list.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
			});

		await press("ArrowRight");
		expect(text()).toContain("all panel");
		await press("ArrowRight");
		expect(text()).toContain("core panel");
		await press("ArrowLeft");
		expect(text()).toContain("all panel");
	});

	it("puts only the selected tab in the tab order", async () => {
		await mount(<Demo />);

		expect(button(/^Core/)?.getAttribute("tabindex")).toBe("0");
		expect(button(/^All/)?.getAttribute("tabindex")).toBe("-1");
	});
});

describe("ValueStepper", () => {
	const Demo = ({ min = 1, max = 3, start = 2 }) => {
		const [value, setValue] = useState(start);
		return <ValueStepper label="Skill" value={value} min={min} max={max} onChange={setValue} />;
	};

	it("steps one at a time inside its range", async () => {
		await mount(<Demo />);

		await click(button("Raise Skill"));
		expect(text()).toContain("3");
		await click(button("Lower Skill"));
		await click(button("Lower Skill"));
		expect(text()).toContain("1");
	});

	it("takes away the button that would leave the range", async () => {
		await mount(<Demo start={1} />);
		expect(button("Lower Skill")).toBeUndefined();
		expect(button("Raise Skill")).toBeDefined();
		await unmount();

		await mount(<Demo start={3} />);
		expect(button("Raise Skill")).toBeUndefined();
		expect(button("Lower Skill")).toBeDefined();
	});

	it("offers no step at all when the range is one value", async () => {
		await mount(<Demo min={2} max={2} start={2} />);

		expect(button("Lower Skill")).toBeUndefined();
		expect(button("Raise Skill")).toBeUndefined();
	});
});

describe("CollapsibleSection", () => {
	it("starts closed and opens on request", async () => {
		await mount(
			<>
				<CollapsibleSection title="Closed one">
					<p>inside</p>
				</CollapsibleSection>
				<CollapsibleSection title="Open one" defaultOpen>
					<p>inside</p>
				</CollapsibleSection>
			</>
		);
		const [closed, open] = [...page().querySelectorAll("details")];

		expect(closed.open).toBe(false);
		expect(open.open).toBe(true);
	});
});

describe("CountInput", () => {
	it("keeps only digits and passes the number on", async () => {
		const onChange = vi.fn();
		await mount(<CountInput label="Meat owned" value={0} onChange={onChange} />);
		const input = page().querySelector<HTMLInputElement>("input")!;

		await type(input, "1a2,3");
		expect(onChange).toHaveBeenLastCalledWith(123);
		await type(input, "");
		expect(onChange).toHaveBeenLastCalledWith(0);
	});

	it("shows the count with thousands separators", async () => {
		await mount(<CountInput label="Meat owned" value={1500000} onChange={() => {}} />);

		expect(page().querySelector<HTMLInputElement>("input")!.value).toBe("1,500,000");
	});
});

describe("PlanFooter", () => {
	const footer = (props: Partial<Parameters<typeof PlanFooter>[0]> = {}) => (
		<PlanFooter
			closeLabel="Close"
			onClose={() => {}}
			saveLabel="Save plan"
			onSave={() => {}}
			{...props}
		/>
	);

	it("keeps Close first and Save plan last, with the export between them", async () => {
		await mount(
			footer({
				exportAction: {
					label: "Export to Core Events",
					disabled: false,
					onClick: () => {},
				},
			})
		);
		const labels = [...page().querySelectorAll("button")].map((item) => item.textContent);

		expect(labels).toEqual(["Close", "Export to Core Events", "Save plan"]);
	});

	it("shows the save status above the buttons, and only when there is one", async () => {
		await mount(footer({ savedText: "Plan saved today" }));
		const status = page().querySelector("span[role=status]")!;
		const firstButton = page().querySelector("button")!;

		expect(status.textContent).toContain("Plan saved today");
		expect(
			status.compareDocumentPosition(firstButton) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		await unmount();

		await mount(footer());
		expect(page().querySelector("span[role=status]")).toBeNull();
	});

	it("disables the export and keeps its hint as a tooltip when nothing can be exported", async () => {
		const onClick = vi.fn();
		await mount(
			footer({
				exportAction: {
					label: "Export",
					disabled: true,
					title: "Nothing to export",
					onClick,
				},
			})
		);
		const exportButton = button("Export") as HTMLButtonElement;

		expect(exportButton.disabled).toBe(true);
		expect(exportButton.title).toBe("Nothing to export");
		await click(exportButton);
		expect(onClick).not.toHaveBeenCalled();
	});

	it("calls the close and save handlers", async () => {
		const onClose = vi.fn();
		const onSave = vi.fn();
		await mount(footer({ onClose, onSave }));

		await click(button("Close"));
		await click(button("Save plan"));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSave).toHaveBeenCalledTimes(1);
	});
});

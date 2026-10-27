import { Button } from "./Button";

interface ExportAction {
	label: string;
	disabled: boolean;
	title?: string;
	onClick: () => void;
}

interface PlanFooterProps {
	/** The text of the save status chip. Without it the chip is left out. */
	savedText?: string;
	closeLabel: string;
	onClose: () => void;
	exportAction?: ExportAction;
	saveLabel: string;
	onSave: () => void;
}

/**
 * The footer of a plan flyout. The save status sits on its own row. The buttons stay on one row
 * with Close at the start and the export and save actions at the end.
 */
export function PlanFooter({
	savedText,
	closeLabel,
	onClose,
	exportAction,
	saveLabel,
	onSave,
}: PlanFooterProps) {
	return (
		<div className="flex w-full flex-col gap-2">
			{savedText && (
				<span
					role="status"
					className="border-line bg-surface text-muted inline-flex h-8 items-center gap-2 self-start rounded-full border-[1.5px] px-3 font-mono text-xs"
				>
					<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
					{savedText}
				</span>
			)}
			<div className="flex flex-nowrap justify-end gap-2 *:min-w-0">
				<Button className="me-auto" onClick={onClose}>
					{closeLabel}
				</Button>
				{exportAction && (
					<Button
						disabled={exportAction.disabled}
						title={exportAction.title}
						onClick={exportAction.onClick}
					>
						{exportAction.label}
					</Button>
				)}
				<Button variant="primary" onClick={onSave}>
					{saveLabel}
				</Button>
			</div>
		</div>
	);
}

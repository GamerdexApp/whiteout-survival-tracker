interface CheckboxFieldProps {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}

export function CheckboxField({ label, checked, disabled = false, onChange }: CheckboxFieldProps) {
	return (
		<label
			className={`flex min-h-11 items-center gap-2 lg:min-h-9 ${disabled ? "text-muted cursor-not-allowed" : "cursor-pointer"}`}
		>
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={(event) => onChange(event.target.checked)}
				className="accent-primary size-4"
			/>
			{label}
		</label>
	);
}

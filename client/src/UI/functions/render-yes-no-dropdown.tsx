import { Input, Label } from 'reactstrap';

interface YesNoDropdownProps {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function RenderYesNoDropdown({ id, label, value, onChange, disabled }: YesNoDropdownProps) {
  return (
    <>
      <Label for={id}>{label}</Label>
      <Input
        id={id}
        type="select"
        value={value ? 'yes' : 'no'}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === 'yes')}
      >
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </Input>
    </>
  );
}

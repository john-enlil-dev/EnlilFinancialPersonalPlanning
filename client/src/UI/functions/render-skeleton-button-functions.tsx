import { Button } from 'reactstrap';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function RenderPrimaryButton({ label, onClick, disabled, type = 'button' }: ButtonProps) {
  return (
    <Button color="primary" onClick={onClick} disabled={disabled} type={type}>
      {label}
    </Button>
  );
}

export function RenderDefaultButton({ label, onClick, disabled, type = 'button' }: ButtonProps) {
  return (
    <Button color="secondary" outline onClick={onClick} disabled={disabled} type={type}>
      {label}
    </Button>
  );
}

export function RenderDangerButton({ label, onClick, disabled, type = 'button' }: ButtonProps) {
  return (
    <Button color="danger" onClick={onClick} disabled={disabled} type={type}>
      {label}
    </Button>
  );
}

import { Button } from 'reactstrap';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: string;
}

function renderContent(label: string, icon?: string) {
  return (
    <span className="enlil-btn-content">
      {icon && <i className={`bi ${icon} enlil-btn-icon`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

export function RenderPrimaryButton({ label, onClick, disabled, type = 'button', icon }: ButtonProps) {
  return (
    <Button
      color="primary"
      className="enlil-btn enlil-btn-primary"
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {renderContent(label, icon)}
    </Button>
  );
}

export function RenderDefaultButton({ label, onClick, disabled, type = 'button', icon }: ButtonProps) {
  return (
    <Button
      color="secondary"
      className="enlil-btn enlil-btn-default"
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {renderContent(label, icon)}
    </Button>
  );
}

export function RenderDangerButton({ label, onClick, disabled, type = 'button', icon }: ButtonProps) {
  return (
    <Button
      color="danger"
      className="enlil-btn enlil-btn-danger"
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {renderContent(label, icon)}
    </Button>
  );
}

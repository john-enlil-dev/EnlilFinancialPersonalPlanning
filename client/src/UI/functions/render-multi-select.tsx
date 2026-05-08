import Select from 'react-select';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  id: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export function RenderMultiSelect({
  id,
  options,
  selectedValues,
  onChange,
  placeholder,
  size = 'md',
}: MultiSelectProps) {
  const selected = options.filter((o) => selectedValues.includes(o.value));
  const isSm = size === 'sm';

  return (
    <Select
      inputId={id}
      isMulti
      options={options}
      value={selected}
      onChange={(opts) => onChange(opts.map((o) => o.value))}
      placeholder={placeholder ?? 'Select...'}
      classNamePrefix="rs"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      styles={{
        control: (base) => ({
          ...base,
          backgroundColor: 'var(--bs-body-bg)',
          borderColor: 'var(--bs-border-color)',
          minHeight: isSm ? '32px' : '38px',
          fontSize: isSm ? '0.85rem' : '1rem',
        }),
        valueContainer: (base) => ({ ...base, padding: isSm ? '0 6px' : '2px 8px' }),
        menuPortal: (base) => ({ ...base, zIndex: 1080 }),
        menu: (base) => ({ ...base, backgroundColor: 'var(--bs-body-bg)' }),
        multiValue: (base) => ({ ...base, backgroundColor: 'var(--enlil-accent-soft)' }),
        multiValueLabel: (base) => ({ ...base, color: 'rgba(255,255,255,0.95)' }),
        multiValueRemove: (base) => ({
          ...base,
          color: 'rgba(255,255,255,0.7)',
          ':hover': { backgroundColor: 'var(--enlil-accent)', color: '#fff' },
        }),
        input: (base) => ({ ...base, color: 'var(--bs-body-color)' }),
        placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.45)' }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? 'var(--bs-secondary-bg)' : 'transparent',
          color: 'var(--bs-body-color)',
        }),
      }}
    />
  );
}

import CreatableSelect from 'react-select/creatable';

interface CreatableSubtypeSelectProps {
  id: string;
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
  placeholder?: string;
}

export function RenderCreatableSubtypeSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
}: CreatableSubtypeSelectProps) {
  const optionList = options.map((o) => ({ value: o, label: o }));
  const selected = value ? { value, label: value } : null;

  return (
    <CreatableSelect
      inputId={id}
      isClearable
      options={optionList}
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? null)}
      placeholder={placeholder ?? 'Select or type...'}
      classNamePrefix="rs"
      styles={{
        control: (base) => ({ ...base, backgroundColor: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color)' }),
        menu: (base) => ({ ...base, backgroundColor: 'var(--bs-body-bg)' }),
        singleValue: (base) => ({ ...base, color: 'var(--bs-body-color)' }),
        input: (base) => ({ ...base, color: 'var(--bs-body-color)' }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? 'var(--bs-secondary-bg)' : 'transparent',
          color: 'var(--bs-body-color)',
        }),
      }}
    />
  );
}

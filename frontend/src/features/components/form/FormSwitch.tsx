interface FormSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  fieldDef: {
    label: string;
    description?: string;
  };
}

export const FormSwitch = ({ value, onChange, fieldDef }: FormSwitchProps) => (
  <label className="switch-label">
    <input
      type="checkbox"
      checked={!!value} // S'assurer que la valeur est toujours un booléen
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="switch-slider"></span>
    {/* Le texte du switch est sa description ou son label */}
    <span className="switch-text">{fieldDef.description || fieldDef.label}</span>
  </label>
);

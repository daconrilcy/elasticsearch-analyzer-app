import styles from './FormSwitch.module.scss'

interface FormSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  fieldDef: {
    label: string;
    description?: string;
  };
}

export const FormSwitch = ({ value, onChange, fieldDef }: FormSwitchProps) => (
  <label className={styles.switchLabel}>
    <input
      type="checkbox"
      checked={!!value} // S'assurer que la valeur est toujours un booléen
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className={styles.switchSlider}></span>
    {/* Le texte du switch est sa description ou son label */}
    <span className={styles.switchText}>{fieldDef.description || fieldDef.label}</span>
  </label>
);

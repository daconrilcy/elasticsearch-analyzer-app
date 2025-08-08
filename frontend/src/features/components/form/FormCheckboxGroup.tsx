
interface CheckboxChoice {
  label: string;
  value: string;
}

interface FormCheckboxGroupProps {
  value: string[]; // La valeur est un tableau de strings
  onChange: (value: string[]) => void;
  fieldDef: {
    choices: CheckboxChoice[];
  };
}

import styles from './FormCheckboxGroup.module.scss'

export const FormCheckboxGroup = ({ value, onChange, fieldDef }: FormCheckboxGroupProps) => {
  // Correction : On spécifie explicitement que le Set contiendra des 'string'.
  const selectedValues = Array.isArray(value) ? new Set<string>(value) : new Set<string>();

  const handleCheckboxChange = (choiceValue: string, isChecked: boolean) => {
    // Correction : On s'assure que le nouveau Set est aussi de type Set<string>.
    const newSelectedValues = new Set<string>(selectedValues);
    if (isChecked) {
      newSelectedValues.add(choiceValue);
    } else {
      newSelectedValues.delete(choiceValue);
    }
    // `Array.from` retournera maintenant correctement un `string[]`.
    onChange(Array.from(newSelectedValues));
  };

  return (
    <div className={styles.checkboxGroupContainer}>
      {fieldDef.choices.map((choice) => (
        <label key={choice.value} className={styles.checkboxLabel}>
          <input
            type="checkbox"
            value={choice.value}
            checked={selectedValues.has(choice.value)}
            onChange={(e) => handleCheckboxChange(choice.value, e.target.checked)}
          />
          <span className={styles.checkboxCustom}></span>
          <span className={styles.checkboxText}>{choice.label}</span>
        </label>
      ))}
    </div>  
  );
};

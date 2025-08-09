import React from 'react';
import styles from './FormSelect.module.scss';

interface SelectChoice {
  label: string;
  value: string;
}

interface FormSelectProps {
  // La valeur peut être une chaîne unique ou un tableau de chaînes pour la sélection multiple
  value: string | string[];
  onChange: (value: string | string[]) => void;
  fieldDef: {
    placeholder?: string;
    multiple?: boolean;
    choices?: SelectChoice[];
  };
}

export const FormSelect = ({ value, onChange, fieldDef }: FormSelectProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fieldDef.multiple) {
      // Pour la sélection multiple, on récupère toutes les options sélectionnées
      const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
      onChange(selectedValues);
    } else {
      // Pour la sélection unique, on récupère la seule valeur
      onChange(e.target.value);
    }
  };

  return (
    <select
      className={styles['form-select']}
      value={value ?? (fieldDef.multiple ? [] : '')} // Assurer une valeur par défaut correcte
      onChange={handleChange}
      multiple={fieldDef.multiple}
      // La taille s'ajuste pour montrer plusieurs options si la sélection est multiple
      size={fieldDef.multiple ? 5 : 1} 
    >
      {!fieldDef.multiple && (
        <option value="" disabled>
          {fieldDef.placeholder || 'Sélectionner...'}
        </option>
      )}
      {fieldDef.choices?.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  );
};

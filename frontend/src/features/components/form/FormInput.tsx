import React from 'react';

interface FormInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  fieldDef: {
    itemType?: 'text' | 'number';
    placeholder?: string;
  };
}

import styles from './FormInput.module.scss';

export const FormInput = ({ value, onChange, fieldDef }: FormInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convertir en nombre si le type est 'number', sinon garder en string
    const newValue = fieldDef.itemType === 'number' 
      ? Number(e.target.value) || 0 
      : e.target.value;
    onChange(newValue);
  };

  return (
    <input
      className={styles['form-input']}
      type={fieldDef.itemType || 'text'}
      value={value ?? ''} // Utiliser ?? '' pour s'assurer que la valeur n'est jamais null/undefined
      placeholder={fieldDef.placeholder}
      onChange={handleChange}
    />
  );
};

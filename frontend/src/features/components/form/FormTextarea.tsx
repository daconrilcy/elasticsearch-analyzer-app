import React from 'react';
import styles from './FormTextarea.module.scss';

interface FormTextareaProps {
  // La valeur peut être une simple chaîne ou un tableau de chaînes pour les listes
  value: string | string[];
  onChange: (value: string | string[]) => void;
  fieldDef: {
    placeholder?: string;
    // Indique si la valeur doit être traitée comme une liste
    return?: 'list' | 'string'; 
  };
}

export const FormTextarea = ({ value, onChange, fieldDef }: FormTextareaProps) => {
  // Formate la valeur pour l'affichage : si c'est un tableau, on joint les éléments par un retour à la ligne.
  const displayValue = Array.isArray(value) ? value.join('\n') : value ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // Si le JSON spécifie que la valeur de retour est une liste, on divise le texte par ligne.
    if (fieldDef.return === 'list') {
      const listValue = text.split('\n').filter(line => line.trim() !== ''); // Ignore les lignes vides
      onChange(listValue);
    } else {
      // Sinon, on renvoie simplement le texte brut.
      onChange(text);
    }
  };

  return (
    <textarea
      className={styles['form-textarea']}
      value={displayValue}
      placeholder={fieldDef.placeholder}
      onChange={handleChange}
      rows={5} // Hauteur par défaut
    />
  );
};

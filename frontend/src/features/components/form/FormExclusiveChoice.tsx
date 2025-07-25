import { useState } from 'react';
import { FormField } from '../FormField';

interface ExclusiveChoiceProps {
  value: { [key: string]: any };
  onChange: (value: { [key: string]: any }) => void;
  paramDef: {
    elements: any[];
  };
}

export const FormExclusiveChoice = ({ value, onChange, paramDef }: ExclusiveChoiceProps) => {
  // --- CORRECTION LOGIQUE ---
  // On utilise un état local pour suivre quelle *option* est active,
  // car plusieurs options peuvent partager le même nom de paramètre (ex: "stopwords").
  // On initialise en trouvant le type de l'option qui correspond à la valeur actuelle.
  const [activeOptionType, setActiveOptionType] = useState<string>(() => {
    const currentParamName = Object.keys(value || {})[0];
    const initialElement = paramDef.elements.find(p => p.name === currentParamName);
    return initialElement?.type || paramDef.elements[0]?.type;
  });

  const handleChoiceChange = (paramType: string, paramName: string) => {
    // Met à jour l'option active dans l'UI
    setActiveOptionType(paramType);
    // Réinitialise la valeur dans le store en envoyant un objet avec la clé correspondante
    onChange({ [paramName]: null });
  };

  const handleValueChange = (newValue: any) => {
    // Met à jour la valeur pour le paramètre actuellement actif
    const activeParam = paramDef.elements.find(p => p.type === activeOptionType);
    if (activeParam) {
      onChange({ [activeParam.name]: newValue });
    }
  };

  // On trouve la définition et la valeur du champ à afficher en se basant sur l'option active
  const activeParamDef = paramDef.elements.find(p => p.type === activeOptionType);
  const activeParamValue = activeParamDef ? value?.[activeParamDef.name] : null;

  return (
    <div className="exclusive-choice-container">
      <div className="exclusive-choice-radios">
        {paramDef.elements.map((param) => {
          const uniqueKey = `${param.name}_${param.type}`;
          
          return (
            <label key={uniqueKey} className="radio-label">
              <input
                type="radio"
                name={paramDef.elements.map(p => p.name).join('-')}
                // Le bouton est "coché" si son type correspond à l'option active
                checked={activeOptionType === param.type}
                onChange={() => handleChoiceChange(param.type, param.name)}
              />
              <span className="radio-text">{param.field.label}</span>
            </label>
          );
        })}
      </div>

      <div className="exclusive-choice-content">
        {activeParamDef && (
          <FormField
            paramDef={activeParamDef}
            value={activeParamValue}
            onChange={handleValueChange}
          />
        )}
      </div>
    </div>
  );
};

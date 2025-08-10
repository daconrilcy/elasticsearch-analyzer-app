import React from 'react';
import { FormInput } from '@features/analyzers/components/form/FormInput';
import { FormSwitch } from '@features/analyzers/components/form/FormSwitch';
import { FormCheckboxGroup } from '@features/analyzers/components/form/FormCheckboxGroup';
import { FormTextarea } from '@features/analyzers/components/form/FormTextarea';
import { FormSelect } from '@features/analyzers/components/form/FormSelect';
import { FormFile } from '@features/analyzers/components/form/FormFile';

// Le mapper qui associe le nom du composant du JSON au composant React
const componentMap: { [key: string]: React.ElementType } = {
  input: FormInput,
  switch: FormSwitch,
  'checkbox-group': FormCheckboxGroup,
  textarea: FormTextarea,
  select: FormSelect,
  file: FormFile,
};

interface FormFieldProps {
  value: any;
  onChange: (value: any) => void;
  paramDef: any;
}

export const FormField = ({ value, onChange, paramDef }: FormFieldProps) => {
  const { field } = paramDef;
  const ComponentToRender = componentMap[field.component];

  if (!ComponentToRender) {
    return <p>Composant de formulaire inconnu : {field.component}</p>;
  }

  // On passe les props nécessaires au composant enfant
  return <ComponentToRender value={value} onChange={onChange} fieldDef={field} />;
};

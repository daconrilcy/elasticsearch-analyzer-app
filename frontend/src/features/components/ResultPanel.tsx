import { type AnalysisStep } from '../store/analysisStore';

interface ResultPanelProps {
  steps: AnalysisStep[];
  isLoading: boolean;
  isVisible: boolean;
}

/**
 * Détermine le type d'étape à partir de son nom pour lui assigner une couleur.
 * @param stepName Le nom de l'étape (ex: "After 'standard' (tokenizer)")
 * @returns Le type de l'étape (ex: "tokenizer")
 */
const getStepType = (stepName: string): string => {
    const lowerCaseName = stepName.toLowerCase();
    if (lowerCaseName.includes('input')) return 'input';
    if (lowerCaseName.includes('char_filter')) return 'char-filter';
    if (lowerCaseName.includes('tokenizer')) return 'tokenizer';
    if (lowerCaseName.includes('token_filter')) return 'token-filter';
    if (lowerCaseName.includes('error')) return 'error';
    return 'default';
};

/**
 * Formate le nom de l'étape pour un affichage plus propre.
 * @param stepName Le nom brut de l'étape
 * @returns Un nom formaté (ex: "Input Text" -> "Input")
 */
const formatStepLabel = (stepName: string): string => {
    const type = getStepType(stepName);
    switch (type) {
        case 'input': return 'Input';
        case 'char-filter': return 'Char Filter';
        case 'tokenizer': return 'Tokenizer';
        case 'token-filter': return 'Token Filter';
        case 'error': return 'Error';
        default: return 'Step';
    }
}

export function ResultPanel({ steps, isLoading, isVisible }: ResultPanelProps) {
  if (isLoading) {
    return (
      <aside className="result-panel">
        <div className="loading-container">
          <span>Analyse en cours...</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`result-panel ${isVisible ? 'visible' : ''}`}>
      <h3 className="result-panel-header">Résultat Détaillé</h3>
      <div className="steps-container-scrollable">
        <div className="steps-container">
          {steps.map((step, index) => {
            const stepType = getStepType(step.step_name);
            const stepLabel = formatStepLabel(step.step_name);

            return (
              <div key={index} className="analysis-step">
                <div className="step-header">
                  <span className={`step-tag tag-${stepType}`}>{stepLabel}</span>
                  <span className="step-name-text">{step.step_name}</span>
                </div>
                <div className="step-output">
                  {Array.isArray(step.output) ? (
                    step.output.map((token, tokenIndex) => (
                      <span key={tokenIndex} className="token">{token}</span>
                    ))
                  ) : (
                    <span className="initial-text">{step.output}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

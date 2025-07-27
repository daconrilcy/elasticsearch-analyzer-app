// src/features/components/ResultPanel.tsx
import { useAnalysisStore, type AnalysisStep } from '../store/analysisStore';

const getStepType = (stepName: string): string => {
    const lowerCaseName = stepName.toLowerCase();
    if (lowerCaseName.includes('input')) return 'input';
    if (lowerCaseName.includes('char_filter')) return 'char-filter';
    if (lowerCaseName.includes('tokenizer')) return 'tokenizer';
    if (lowerCaseName.includes('token_filter')) return 'token-filter';
    if (lowerCaseName.includes('error')) return 'error';
    return 'default';
};

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

export function ResultPanel({ isVisible }: { isVisible: boolean }) {
  const { analysisSteps, isLoading, validationIssues } = useAnalysisStore();

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-container">Analyse en cours...</div>;
    }

    if (validationIssues.length > 0) {
      return (
        <div className="validation-issues">
          <h4>Actions requises :</h4>
          <ul>
            {validationIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    if (analysisSteps.length === 0) {
        return <div className="placeholder">Les résultats de l'analyse s'afficheront ici.</div>
    }

    return (
      <div className="steps-container">
        {analysisSteps.map((step: AnalysisStep, index: number) => {
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
                  step.output.map((token: string, tokenIndex: number) => (
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
    );
  };

  return (
    <aside className={`result-panel ${isVisible ? 'visible' : ''}`}>
      <h3 className="result-panel-header">Résultat Détaillé</h3>
      <div className="steps-container-scrollable">
        {renderContent()}
      </div>
    </aside>
  );
}

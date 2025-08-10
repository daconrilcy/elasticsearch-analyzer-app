// src/features/components/ResultPanel.tsx
import { useAnalysisStore, type AnalysisStep } from '@shared/lib';
import styles from './ResultPanel.module.scss'

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
  // Utilisation du nom correct 'analysisSteps' depuis le store.
  const { analysisSteps, isLoading, validationIssues } = useAnalysisStore();

  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.loadingContainer}>Analyse en cours...</div>;
    }

    if (validationIssues.length > 0) {
      return (
        <div className={styles.validationIssues}>
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
        return <div className={styles.placeholder}>Les résultats de l'analyse s'afficheront ici.</div>
    }

    return (
      <div className={styles.stepsContainer}>
        {analysisSteps.map((step: AnalysisStep, index: number) => {
          const stepType = getStepType(step.step_name);
          const stepLabel = formatStepLabel(step.step_name);
          return (
            <div key={index} className={styles.analysisStep}>
              <div className={styles.stepHeader}>
                <span className={`${styles.stepTag} ${styles[`tag${stepType.charAt(0).toUpperCase() + stepType.slice(1)}`]}`}>{stepLabel}</span>
                <span className={styles.stepNameText}>{step.step_name}</span>
              </div>
              <div className={styles.stepOutput}>
                {Array.isArray(step.output) ? (
                  step.output.map((token: string, tokenIndex: number) => (
                    <span key={tokenIndex} className={styles.token}>{token}</span>
                  ))
                ) : (
                  <span className={styles.initialText}>{step.output}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className={`${styles.resultPanel} ${isVisible ? 'visible' : ''}`}>
      <h3 className={styles.resultPanelHeader}>Résultat Détaillé</h3>
      <div className={styles.stepsContainerScrollable}>
        {renderContent()}
      </div>
    </aside>
  );
}

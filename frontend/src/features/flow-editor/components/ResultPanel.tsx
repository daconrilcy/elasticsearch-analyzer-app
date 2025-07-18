import './ResultPanel.css';

// Le type pour une étape d'analyse, importé ou défini ici
interface AnalysisStep {
  step_name: string;
  output: string | string[];
}

interface ResultPanelProps {
  steps: AnalysisStep[];
  isLoading: boolean;
}

export function ResultPanel({ steps, isLoading }: ResultPanelProps) {
  return (
    <aside className="result-panel">
      <h3>Résultat Détaillé</h3>
      {isLoading ? (
        <div className="loading">Analyse en cours...</div>
      ) : (
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="analysis-step">
              <h4 className="step-name">{step.step_name}</h4>
              <div className="step-output">
                {Array.isArray(step.output) ? (
                  // Si la sortie est un tableau de tokens
                  step.output.map((token, tokenIndex) => (
                    <span key={tokenIndex} className="token">{token}</span>
                  ))
                ) : (
                  // Si la sortie est le texte initial
                  <span className="initial-text">{step.output}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

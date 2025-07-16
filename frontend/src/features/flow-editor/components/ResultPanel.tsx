// frontend/src/components/ResultPanel.tsx
import './ResultPanel.css';

// Les props contiendront les tokens à afficher
interface ResultPanelProps {
  tokens: string[];
  isLoading: boolean;
}

export function ResultPanel({ tokens, isLoading }: ResultPanelProps) {
  return (
    <div className="result-panel">
      <h3>Résultat</h3>
      {isLoading ? (
        <div className="loading">Analyse en cours...</div>
      ) : (
        <div className="tokens-container">
          {tokens.map((token, index) => (
            <span key={index} className="token">{token}</span>
          ))}
        </div>
      )}
    </div>
  );
}
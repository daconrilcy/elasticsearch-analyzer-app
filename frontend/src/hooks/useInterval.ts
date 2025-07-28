import { useEffect, useRef } from 'react';

/**
 * Un custom hook React qui facilite l'utilisation de setInterval de manière déclarative.
 * @param callback La fonction à exécuter à chaque intervalle.
 * @param delay Le délai en millisecondes entre chaque exécution. Si null, l'intervalle est arrêté.
 */
export function useInterval(callback: () => void, delay: number | null) {
  // Correction : Le hook useRef doit être initialisé avec une valeur (ici, null).
  // Le type a été ajusté pour accepter 'null'.
  const savedCallback = useRef<(() => void) | null>(null);

  // Mémorise le dernier callback fourni.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Met en place l'intervalle.
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

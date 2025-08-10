import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@shared/lib';
import styles from './LoginPage.module.scss'

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage = ({ onSwitchToRegister }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    try {
      await login({ username, password });
      toast.success('Connexion réussie !');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className={styles.loginPageContainer}>
      <div className={styles.loginFormWrapper}>
        <h1 className={styles.loginTitle}>Analyzer UI</h1>
        <p className={styles.loginSubtitle}>Connectez-vous pour accéder à vos projets</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              placeholder="Entrez votre nom d'utilisateur"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Entrez votre mot de passe"
            />
          </div>
          <button type="submit" className={styles.loginButton} disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        {/* --- LIGNE AJOUTÉE --- */}
        <div className={styles.switchFormLink}>
          <span>Pas encore de compte ? </span>
          <button onClick={onSwitchToRegister}>Inscrivez-vous</button>
        </div>
      </div>
    </div>
  );
};

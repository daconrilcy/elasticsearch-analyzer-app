import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';


interface RegisterPageProps {
  // Fonction pour basculer vers la vue de connexion
  onSwitchToLogin: () => void;
}

export const RegisterPage = ({ onSwitchToLogin }: RegisterPageProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    try {
      await register({ username, email, password });
      toast.success('Inscription réussie ! Vous êtes maintenant connecté.');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-wrapper">
        <h1 className="login-title">Créer un Compte</h1>
        <p className="login-subtitle">Rejoignez la plateforme pour créer vos analyseurs</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              placeholder="Choisissez un nom d'utilisateur"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="Entrez votre e-mail"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Choisissez un mot de passe sécurisé"
            />
          </div>
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        <div className="switch-form-link">
          <span>Déjà un compte ? </span>
          <button onClick={onSwitchToLogin}>Connectez-vous</button>
        </div>
      </div>
    </div>
  );
};

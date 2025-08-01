import { useState } from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

/**
 * Ce composant gère l'affichage soit de la page de connexion,
 * soit de la page d'inscription, et permet de basculer entre les deux.
 */
export const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  if (isLoginView) {
    return <LoginPage onSwitchToRegister={() => setIsLoginView(false)} />;
  }

  return <RegisterPage onSwitchToLogin={() => setIsLoginView(true)} />;
};

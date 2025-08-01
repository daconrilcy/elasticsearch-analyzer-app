// src/libs/axios.ts
import Axios from 'axios';

// Vous pouvez ajouter ici la configuration de base pour tous vos appels API.
// Par exemple, l'URL de base de votre backend, les headers, etc.
export const axios = Axios.create({
  // baseURL: 'http://localhost:8000', // Décommentez si votre backend est sur un port différent
});

// Ici, vous pouvez aussi ajouter des intercepteurs pour gérer
// globalement les erreurs ou les tokens d'authentification.
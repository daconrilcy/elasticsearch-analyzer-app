import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useProjectStore, type ProjectListItem } from '../store/projectStore';
import { useGraphStore } from '../store/graphStore';
import { useAuthStore } from '../store/authStore';

// Icône de déconnexion
const PowerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
    <line x1="12" y1="2" x2="12" y2="12"></line>
  </svg>
);

export function Header() {
  const {
    projectList, currentProject, fetchProjects, loadProject,
    saveProject, createNewProject, setCurrentProjectName, exportCurrentProject,
  } = useProjectStore();

  const { graph } = useGraphStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  const handleSave = () => {
    if (!currentProject.name.trim()) {
      toast.error("Veuillez donner un nom à votre projet.");
      return;
    }
    saveProject(graph);
  };
  
  const handleCreateNew = () => {
      createNewProject();
  };

  // --- CORRECTION : Nouvelle fonction pour gérer la déconnexion ---
  const handleLogout = () => {
    logout();
    toast.success("Vous avez été déconnecté.");
  };

  return (
    <header className="app-header">
      <div className="project-title">
        <input
          type="text"
          value={currentProject.name}
          onChange={(e) => setCurrentProjectName(e.target.value)}
          placeholder="Nom du projet"
        />
      </div>

      <div className="project-actions">
        <select
          className="project-selector"
          onChange={(e) => { if (e.target.value) { loadProject(Number(e.target.value)); } }}
          value={currentProject.id || ''}
        >
          <option value="" disabled>Charger un projet...</option>
          {projectList.map((p: ProjectListItem) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <button onClick={exportCurrentProject} className="action-button" disabled={currentProject.id === null}>
          Exporter
        </button>

        <button onClick={handleSave} className="action-button">Sauvegarder</button>
        <button onClick={handleCreateNew} className="action-button primary">Nouveau Projet</button>
      </div>

      <div className="user-info">
        {user && <span className="username">Bienvenue, {user.username}</span>}
        {/* Le bouton appelle maintenant la nouvelle fonction handleLogout */}
        <button onClick={handleLogout} className="logout-button">
          <PowerIcon />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

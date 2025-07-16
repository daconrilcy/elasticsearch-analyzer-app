import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useFlowEditorStore } from '../store';
import './Header.css';

export function Header() {
  const {
    projectList,
    currentProject,
    fetchProjects,
    loadProject,
    saveCurrentProject,
    createNewProject,
    setCurrentProjectName,
    exportCurrentProject,
  } = useFlowEditorStore();

  // Charger la liste des projets au premier rendu du composant
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Gestionnaire pour la sauvegarde, avec une validation simple
  const handleSave = () => {
    if (!currentProject.name.trim()) {
      toast.error("Veuillez donner un nom à votre projet.");
      return;
    }
    saveCurrentProject();
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
          onChange={(e) => {
            if (e.target.value) {
              loadProject(Number(e.target.value));
            }
          }}
          value={currentProject.id || ''}
        >
          <option value="" disabled>Charger un projet...</option>
          {projectList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        
        <button 
          onClick={exportCurrentProject} 
          className="action-button"
          disabled={currentProject.id === null}
          title={currentProject.id === null ? "Sauvegardez d'abord le projet" : "Exporter la configuration"}
        >
          Exporter
        </button>

        <button onClick={handleSave} className="action-button">Sauvegarder</button>
        <button onClick={createNewProject} className="action-button primary">Nouveau Projet</button>
      </div>
    </header>
  );
}

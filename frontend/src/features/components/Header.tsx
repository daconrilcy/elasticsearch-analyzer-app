import { useEffect } from 'react';
import toast from 'react-hot-toast';
// Correction: Import the new, separated stores and necessary types
import { useProjectStore, type ProjectListItem } from '../store/projectStore';
import { useGraphStore } from '../store/graphStore';

export function Header() {
  // Correction: Get state and actions from the correct stores
  const {
    projectList,
    currentProject,
    fetchProjects,
    loadProject,
    saveProject,
    createNewProject,
    setCurrentProjectName,
    exportCurrentProject,
  } = useProjectStore();

  const { graph } = useGraphStore();

  // Load the project list when the component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handler for saving, with simple validation
  const handleSave = () => {
    if (!currentProject.name.trim()) {
      toast.error("Veuillez donner un nom à votre projet.");
      return;
    }
    // Pass the current graph from the graphStore to the save action
    saveProject(graph);
  };
  
  const handleCreateNew = () => {
      // The createNewProject action now handles resetting the other stores
      createNewProject();
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
          {/* Correction: Explicitly type 'p' */}
          {projectList.map((p: ProjectListItem) => (
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
        <button onClick={handleCreateNew} className="action-button primary">Nouveau Projet</button>
      </div>
    </header>
  );
}
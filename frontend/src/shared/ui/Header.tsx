import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
// --- CORRECTION : L'import du store est séparé de l'import du type ---
import { useProjectStore, useGraphStore, useAuthStore } from '@shared/lib';
import type { ProjectListItem } from '@shared/types/api.v1'; // Le type est importé depuis sa source
import styles from './Header.module.scss'

// Icône de déconnexion (inchangée)
const PowerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
        <line x1="12" y1="2" x2="12" y2="12"></line>
    </svg>
);

export function Header() {
    const location = useLocation();
    const isAnalyzerPage = location.pathname.startsWith('/analyzer');

    const {
        projectList, currentProject, fetchProjects, loadProject,
        saveProject, createNewProject, setCurrentProjectName, exportCurrentProject,
    } = useProjectStore();
    const { graph } = useGraphStore();
    const { isAuthenticated, user, logout } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && isAnalyzerPage) {
            fetchProjects();
        }
    }, [isAuthenticated, isAnalyzerPage, fetchProjects]);

    // ... (Le reste du fichier est identique)
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

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Vous avez été déconnecté.");
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            toast.error("Erreur lors de la déconnexion. Veuillez réessayer.");
        }
    };

    return (
        <header className={styles.appHeader}>
            <div className={styles.faviconContainer}>
                <img src="/favicon.ico" alt="Logo" className={styles.favicon} />
            </div>
            {isAnalyzerPage ? (
                <>
                    <div className={styles.projectTitle}>
                        <input type="text" value={currentProject.name} onChange={(e) => setCurrentProjectName(e.target.value)} placeholder="Nom du projet" />
                    </div>
                    <div className={styles.projectActions}>
                        <select className="select" onChange={(e) => { if (e.target.value) { loadProject(Number(e.target.value)); } }} value={currentProject.id || ''}>
                            <option value="" disabled>Charger un projet...</option>
                            {projectList.map((p: ProjectListItem) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                        <button onClick={exportCurrentProject} className="button" disabled={currentProject.id === null}>Exporter</button>
                        <button onClick={handleSave} className="button">Sauvegarder</button>
                        <button onClick={handleCreateNew} className="button primary">Nouveau Projet</button>
                    </div>
                </>
            ) : (
                <>
                    <div className={styles.pageTitle}>
                        <h1>Gestion des Données</h1>
                    </div>
                    <div className={styles.projectActionsPlaceholder}></div>
                </>
            )}
            <div className={styles.userInfo}>
                {user && <span className={styles.username}>Bienvenue, {user.username}</span>}
                <button onClick={handleLogout} className={styles.logoutButton}>
                    <PowerIcon />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}
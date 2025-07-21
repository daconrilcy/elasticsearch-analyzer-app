// frontend/src/services/projectService.ts

import { type AnalyzerGraph } from "@/shared/types/analyzer.d";

const API_BASE_URL = '/api/v1/projects';

// On définit un type pour la liste des projets pour être plus explicite
export interface ProjectListItem {
  id: number;
  name: string;
}

export const projectService = {
  /**
   * Récupère la liste de tous les projets.
   */
  async getAll(): Promise<ProjectListItem[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des projets.');
    }
    return response.json();
  },

  /**
   * Récupère un projet complet par son ID.
   */
  async getById(projectId: number): Promise<any> { // Note: utiliser un type plus précis que 'any'
    const response = await fetch(`${API_BASE_URL}/${projectId}`);
    if (!response.ok) {
      throw new Error('Erreur lors du chargement du projet.');
    }
    return response.json();
  },

  /**
   * Sauvegarde un projet (création ou mise à jour).
   */
  async save(project: { id: number | null; name: string; graph: AnalyzerGraph }): Promise<any> {
    const isNew = project.id === null;
    const url = isNew ? API_BASE_URL : `${API_BASE_URL}/${project.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    // Nettoyage du graphe avant envoi
    const graphPayload = {
        nodes: project.graph.nodes.map(node => ({ ...node.data, meta: { position: node.position, type: node.type } })),
        edges: project.graph.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: project.name, description: "N/A", graph: graphPayload }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la sauvegarde du projet.');
    }
    return response.json();
  },
};
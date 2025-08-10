// src/services/graphValidationService.ts
import type { AnalyzerGraph, CustomNode } from "@shared/types/analyzer.d";
import { Kind } from "@shared/types/analyzer.d";
import { findComponentDefinition } from "@shared/lib";

/**
 * Valide la structure et la configuration d'un graphe d'analyseur côté client.
 * @param graph L'objet AnalyzerGraph à valider.
 * @returns Un tableau de messages d'erreur. Si le tableau est vide, le graphe est valide.
 */
export function validateGraph(graph: AnalyzerGraph): string[] {
    const issues: string[] = [];
    const nodeMap = new Map(graph.nodes.map(node => [node.id, node]));
    const edgeMap = new Map(graph.edges.map(edge => [edge.source, edge.target]));
    const allNodeIds = new Set(graph.nodes.map(n => n.id));

    const startNode = graph.nodes.find(n => n.data.kind === Kind.Input);
    if (!startNode) {
        issues.push("Le nœud 'Input' est manquant.");
        return issues; // Bloquant
    }

    const pathNodeIds = new Set<string>();
    let currentNode: CustomNode | undefined = startNode;

    // 1. Parcourir le chemin principal et identifier tous les nœuds connectés
    while (currentNode) {
        if (pathNodeIds.has(currentNode.id)) {
            issues.push("Un cycle a été détecté dans le graphe. Le pipeline doit être linéaire.");
            return issues; // Bloquant
        }
        pathNodeIds.add(currentNode.id);

        if (currentNode.data.kind === Kind.Output) break;

        const targetId = edgeMap.get(currentNode.id);
        if (!targetId) {
            // Si un nœud n'a pas de cible et que ce n'est pas l'output, il est non connecté.
            issues.push(`Le nœud "${currentNode.data.label || currentNode.data.name}" n'est pas connecté à la suite du pipeline.`);
            break;
        }
        currentNode = nodeMap.get(targetId);
    }

    // 2. Détecter les nœuds orphelins (non connectés au chemin principal)
    const orphanNodes = [...allNodeIds].filter(id => !pathNodeIds.has(id));
    if (orphanNodes.length > 0) {
        const orphanLabels = orphanNodes
            .map(id => `"${nodeMap.get(id)?.data.label || nodeMap.get(id)?.data.name}"`)
            .join(', ');
        issues.push(`Les nœuds suivants ne sont pas connectés au pipeline principal : ${orphanLabels}.`);
    }

    // 3. Vérifier les paramètres de chaque nœud sur le chemin principal
    for (const nodeId of pathNodeIds) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        const definition = findComponentDefinition(node.data.kind, node.data.name);
        if (definition?.params?.elements) {
            for (const paramDef of definition.params.elements) {
                if (paramDef.mandatory) {
                    const nodeParams = node.data.params || {};
                    if (!(paramDef.name in nodeParams) || nodeParams[paramDef.name] === null || nodeParams[paramDef.name] === '') {
                        issues.push(`Le paramètre obligatoire "${paramDef.field.label}" du nœud "${node.data.label || node.data.name}" n'est pas configuré.`);
                    }
                }
            }
        }
    }

    return issues;
}

# 📚 **Index de Documentation - Elasticsearch Analyzer App**

## 🎯 **Vue d'ensemble**

Cette documentation couvre tous les aspects de l'application Elasticsearch Analyzer App, du développement au déploiement en production, en passant par l'utilisation du Mapping DSL et du Mapping Studio.

## 📁 **Structure de la Documentation**

### **🏗️ Architecture et Déploiement**
- **[Guide de Déploiement](deployment/README.md)** - Déploiement en production
- **[Plan de Publication V2](deployment/publication-plan-v2.md)** - Plan de déploiement V2
- **[Checklist de Fermeture V2](deployment/v2-closure-checklist.md)** - Checklist de fermeture V2
- **[Résumé Implémentation V2.1](deployment/v21-implementation-summary.md)** - Résumé V2.1
- **[Documentation Legacy](deployment/legacy.md)** - Ancienne documentation de déploiement

### **🔧 Mapping DSL**
- **[Guide Utilisateur V2](mapping/README.md)** - Prise en main du DSL V2
- **[Guide V2 (Legacy)](mapping/readme-v2.md)** - Guide utilisateur V2 original
- **[Guide V2.1 (Legacy)](mapping/readme-v21.md)** - Guide utilisateur V2.1
- **[Opérations V2](mapping/operations.md)** - Référence des opérations
- **[Migration V1→V2](mapping/migration.md)** - Guide de transition
- **[Exemples Avancés](mapping/examples.md)** - Cas d'usage réels
- **[Gel du Schéma V2](mapping/schema-freeze.md)** - Statut du schéma V2
- **[Fichiers de Travail](mapping/working-files-readme.md)** - Documentation des fichiers de travail

### **🎨 Interface Utilisateur**
- **[Mapping Studio V2.2](frontend/README.md)** - Guide utilisateur frontend
- **[Déploiement Frontend](frontend/deployment.md)** - Guide de déploiement
- **[Rapport Taille Bundle](frontend/bundle-size-report.md)** - Analyse de la taille du bundle
- **[Gestion des Scrollbars](frontend/scrollbars.md)** - Gestion des barres de défilement
- **[Prêt Production V2.2.1](frontend/production-ready-v2.2.1.md)** - Statut production V2.2.1
- **[Prêt Production](frontend/production-ready.md)** - Statut production général
- **[Statut Final V2.2.1](frontend/status-final-v2.2.1.md)** - Statut final V2.2.1
- **[Checklist Régression Visuelle](frontend/visual-regression-checklist.md)** - Tests de régression
- **[Inventaire Post-Migration](frontend/post-migration-inventory.md)** - Inventaire post-migration

#### **🎯 Composants Frontend**
- **[Composants Datagrid](frontend/components/datagrid-readme.md)** - Documentation des composants de grille
- **[Mappings V2.2](frontend/mappings/readme-v2.2.md)** - Guide des mappings V2.2
- **[Itérations Micro V2.2.1](frontend/mappings/micro-iterations-v2.2.1.md)** - Itérations de développement
- **[Mission Accomplie](frontend/mappings/mission-accomplished.md)** - Statut d'achèvement
- **[Prévisualisation](frontend/preview/readme.md)** - Guide de prévisualisation
- **[Correction Scrollbars](frontend/preview/scrollbar-fix.md)** - Correction des barres de défilement
- **[Scrollbars Complétés](frontend/preview/scrollbar-fix-complete.md)** - Statut des corrections

### **📊 Monitoring et Observabilité**
- **[Guide de Monitoring](monitoring/README.md)** - Configuration Prometheus, Grafana, alertes
- **[Métriques V2](monitoring/v2-metrics.md)** - Métriques spécifiques V2
- **[Documentation Legacy](monitoring/legacy.md)** - Ancienne documentation monitoring

### **🧪 Tests et Qualité**
- **[Tests Backend](testing/backend.md)** - Suite de tests backend
- **[Tests Frontend](testing/frontend.md)** - Tests et validation frontend
- **[Performance](testing/performance.md)** - Tests de performance

### **🏗️ Architecture**
- **[Architecture V2](architecture/README.md)** - Vue d'ensemble technique

## 🚀 **Démarrage Rapide**

### **1. Services Docker**
```bash
# Démarrer tous les services
docker-compose up -d
```

### **2. Backend**
```bash
cd backend
python main.py
```

### **3. Frontend**
```bash
cd frontend
npm install
npm run dev
```

### **4. Monitoring**
- **Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3000 (admin/admin)

## 📊 **Fonctionnalités Principales**

### **Backend V2.2**
- **Mapping DSL V2.2** : Opérations array avancées, options de champ ES
- **Mapping DSL V2.1** : Containers, JSONPath, opérations de base
- **API REST** : Validation, compilation, dry-run, application
- **Monitoring** : Métriques Prometheus, alertes, dashboards Grafana

### **Frontend V2.2.1**
- **Mapping Studio** : Interface visuelle pour créer et éditer les mappings
- **Validation en temps réel** : Feedback immédiat sur les erreurs
- **Templates prêts à l'emploi** : Contacts, adresses, logs
- **Gestion des versions** : Diff visuel, historique des changements

## 🔗 **Liens Utiles**

### **Application**
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

### **Monitoring**
- **Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3000
- **Métriques** : http://localhost:8000/metrics

## 📋 **Guides par Niveau d'Expertise**

### **👶 Débutant**
1. **[Guide de Déploiement](deployment/README.md)** - Premiers pas
2. **[Mapping Studio](frontend/README.md)** - Interface utilisateur
3. **[Exemples de Base](mapping/examples.md)** - Cas d'usage simples

### **👨‍💻 Développeur**
1. **[Mapping DSL](mapping/README.md)** - Création de mappings
2. **[API Backend](backend/docs/README.md)** - Intégration
3. **[Tests](testing/backend.md)** - Validation et qualité

### **🚀 Expert**
1. **[Architecture](architecture/README.md)** - Conception système
2. **[Monitoring](monitoring/README.md)** - Observabilité avancée
3. **[Performance](testing/performance.md)** - Optimisation

## 🧪 **Tests et Validation**

### **Suite de Tests Complète**
```bash
# Tests backend
cd backend
pytest tests/ -v

# Tests frontend
cd frontend
npm test

# Tests de performance
pytest tests/performance/ -v
```

### **Validation des Mappings**
- **Syntaxe** : Validation JSON Schema
- **Sémantique** : Vérification des opérations
- **Performance** : Tests de charge et latence
- **Compatibilité** : Tests de régression V1→V2

## 📈 **Métriques et Monitoring**

### **Métriques Clés**
- **Performance** : Latence des opérations, taux de succès
- **Utilisation** : Nombre de mappings créés, opérations utilisées
- **Qualité** : Taux d'erreur, validation des données
- **Système** : Ressources, base de données, Elasticsearch

### **Alertes Configurées**
- **Critiques** : Taux d'erreur > 5%, échecs d'application
- **Warnings** : Latence P95 > 100ms, cache JSONPath < 70%
- **Info** : Nouveaux mappings, mises à jour de schéma

## 🔒 **Sécurité et Conformité**

### **Authentification**
- **JWT Tokens** : Gestion des sessions sécurisées
- **Rate Limiting** : Protection contre la surcharge
- **Validation stricte** : Contrôle des entrées utilisateur

### **Limites de Sécurité**
- **Taille des mappings** : 1MB maximum
- **Profondeur des pipelines** : 10 niveaux maximum
- **Timeout d'exécution** : 30 secondes maximum

## 📚 **Ressources Supplémentaires**

### **Documentation Externe**
- [FastAPI](https://fastapi.tiangolo.com/) - Framework backend
- [React](https://react.dev/) - Framework frontend
- [Elasticsearch](https://www.elastic.co/) - Moteur de recherche
- [Prometheus](https://prometheus.io/) - Monitoring

### **Schémas et Spécifications**
- **Mapping Schema V2** : `app/domain/mapping/validators/common/mapping.schema.json`
- **API OpenAPI** : `http://localhost:8000/openapi.json`
- **Tests d'intégration** : `tests/integration/`

## 🚨 **Support et Maintenance**

### **Procédures d'Urgence**
1. **Vérifier les métriques** : Prometheus + Grafana
2. **Analyser les logs** : Backend + Frontend
3. **Contrôler la santé** : Health checks des services
4. **Identifier le problème** : Métriques de performance

### **Maintenance Préventive**
- **Mise à jour des dépendances** : Mensuelle
- **Rotation des logs** : Quotidienne
- **Sauvegarde des données** : Hebdomadaire
- **Tests de régression** : Avant chaque déploiement

## 📝 **Contribution**

### **Standards de Documentation**
- **Format** : Markdown avec emojis pour la lisibilité
- **Structure** : Hiérarchie claire avec navigation
- **Exemples** : Code fonctionnel et cas d'usage réels
- **Mise à jour** : Synchronisation avec le code

### **Workflow de Contribution**
1. **Créer une branche** pour les modifications
2. **Mettre à jour la documentation** en parallèle du code
3. **Tester les exemples** et liens
4. **Pull Request** avec validation

## 🔄 **Migration de Documentation**

La documentation a été entièrement réorganisée en décembre 2024. Pour plus d'informations sur cette réorganisation, consultez le **[Guide de Migration](../MIGRATION_README.md)**.

### **Avantages de la Nouvelle Organisation :**
- ✅ **Structure claire** par catégorie fonctionnelle
- ✅ **Navigation simplifiée** avec index centralisé
- ✅ **Guides unifiés** au lieu de fichiers dispersés
- ✅ **Maintenance facilitée** avec organisation logique
- ✅ **Recherche améliorée** par domaine d'expertise

---

**Version** : 2.2.1  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Production Ready  
**Documentation** : ✅ **Réorganisée et Complète**

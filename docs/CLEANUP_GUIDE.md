# 🧹 **Guide de Nettoyage - Fichiers Temporaires Python**

## 📋 **Vue d'ensemble**

Ce guide explique comment nettoyer efficacement tous les fichiers temporaires Python de votre projet Elasticsearch Analyzer App pour libérer de l'espace disque et maintenir un code propre.

## 🚨 **Types de Fichiers à Nettoyer**

### **📁 Dossiers de Cache**
| Dossier | Description | Taille Typique |
|---------|-------------|----------------|
| **`__pycache__/`** | Cache des modules Python | 1-10 MB |
| **`.pytest_cache/`** | Cache des tests pytest | 100 KB - 1 MB |
| **`.mypy_cache/`** | Cache de vérification de types | 500 KB - 5 MB |
| **`.ruff_cache/`** | Cache du linter Ruff | 100 KB - 1 MB |
| **`.pylint.d/`** | Cache du linter Pylint | 50-500 KB |

### **📄 Fichiers Compilés**
| Extension | Description | Taille Typique |
|-----------|-------------|----------------|
| **`.pyc`** | Fichiers compilés Python | 1-50 KB |
| **`.pyo`** | Fichiers optimisés Python | 1-50 KB |
| **`.egg-info/`** | Métadonnées des packages | 10-100 KB |

### **📊 Rapports et Logs**
| Fichier | Description | Taille Typique |
|---------|-------------|----------------|
| **`.coverage`** | Rapport de couverture de code | 100 KB - 1 MB |
| **`htmlcov/`** | Rapports HTML de couverture | 1-10 MB |
| **`*.log`** | Fichiers de logs | 1 KB - 1 MB |

## 🚀 **Méthodes de Nettoyage**

### **1. 🐍 Script Python Automatique**

J'ai créé un script de nettoyage intelligent : `cleanup-python.py`

#### **Utilisation Basique**
```bash
# Simulation (recommandé)
python cleanup-python.py

# Nettoyage réel
python cleanup-python.py --force

# Affichage détaillé
python cleanup-python.py --verbose

# Nettoyer un dossier spécifique
python cleanup-python.py --path ./backend --force
```

#### **Options Disponibles**
| Option | Description | Défaut |
|--------|-------------|---------|
| **`--dry-run`** | Simulation sans suppression | ✅ Activé |
| **`--verbose`** | Affichage détaillé | ❌ Désactivé |
| **`--path`** | Dossier à nettoyer | `.` (courant) |
| **`--force`** | Suppression sans confirmation | ❌ Désactivé |

### **2. 🔧 Script PowerShell (Windows)**

Pour les utilisateurs Windows : `cleanup-python.ps1`

#### **Utilisation**
```powershell
# Simulation
.\cleanup-python.ps1

# Nettoyage réel
.\cleanup-python.ps1 -Force

# Affichage détaillé
.\cleanup-python.ps1 -Verbose

# Nettoyer un dossier spécifique
.\cleanup-python.ps1 -Path .\backend -Force
```

### **3. 🧹 Nettoyage Manuel**

#### **Suppression des Dossiers de Cache**
```bash
# Supprimer tous les __pycache__
find . -type d -name "__pycache__" -exec rm -rf {} +

# Supprimer tous les .pyc
find . -name "*.pyc" -delete

# Supprimer le cache pytest
rm -rf .pytest_cache/

# Supprimer le cache mypy
rm -rf .mypy_cache/
```

#### **Suppression des Rapports**
```bash
# Supprimer les rapports de couverture
rm -f .coverage
rm -rf htmlcov/

# Supprimer les logs
find . -name "*.log" -delete
```

## 📊 **Estimation de l'Espace Libéré**

### **🔍 Analyse Pré-nettoyage**
```bash
# Voir la taille des dossiers de cache
du -sh */__pycache__ 2>/dev/null | sort -hr
du -sh .pytest_cache .mypy_cache 2>/dev/null

# Compter les fichiers
find . -name "*.pyc" | wc -l
find . -type d -name "__pycache__" | wc -l
```

### **📈 Espace Typique Libéré**
| Type de Projet | Espace Libéré | Fréquence |
|----------------|----------------|-----------|
| **Petit projet** | 1-5 MB | Hebdomadaire |
| **Projet moyen** | 5-20 MB | Hebdomadaire |
| **Gros projet** | 20-100 MB | Hebdomadaire |
| **Projet avec tests** | +50% | Après tests |

## ⚠️ **Précautions et Bonnes Pratiques**

### **🔒 Sécurité**
- **Toujours commencer par une simulation** (`--dry-run`)
- **Vérifier les fichiers** avant suppression
- **Sauvegarder** si nécessaire
- **Utiliser Git** pour le contrôle de version

### **🚫 Ne Jamais Supprimer**
- **Code source** (`.py`, `.js`, `.ts`)
- **Configuration** (`.env`, `config/`)
- **Documentation** (`.md`, `docs/`)
- **Données** (`.db`, `data/`)

### **✅ Bonnes Pratiques**
- **Nettoyer régulièrement** (hebdomadaire)
- **Nettoyer après les tests** importants
- **Nettoyer avant les commits** majeurs
- **Documenter** les nettoyages effectués

## 🔄 **Intégration dans le Workflow**

### **1. 🚀 Pré-commit**
```bash
# Nettoyer avant chaque commit
python cleanup-python.py --path . --force
git add .
git commit -m "feat: Nouvelle fonctionnalité"
```

### **2. 🧪 Post-tests**
```bash
# Nettoyer après les tests
pytest tests/ -v
python cleanup-python.py --path . --force
```

### **3. 📦 Pré-déploiement**
```bash
# Nettoyer avant déploiement
python cleanup-python.py --path . --force
docker build -t app .
```

## 📚 **Scripts et Outils**

### **🔧 Scripts Disponibles**
| Script | Plateforme | Usage |
|--------|------------|-------|
| **`cleanup-python.py`** | Multi-plateforme | Nettoyage intelligent |
| **`cleanup-python.ps1`** | Windows | Nettoyage PowerShell |
| **`cleanup-python.sh`** | Linux/Mac | Nettoyage Shell |

### **📋 Alias Utiles**
```bash
# Ajouter à votre .bashrc ou .zshrc
alias cleanpy='python cleanup-python.py --verbose'
alias cleanpy-force='python cleanup-python.py --force --verbose'
```

## 🚨 **Dépannage**

### **Erreur : "Permission Denied"**
```bash
# Vérifier les permissions
ls -la __pycache__/

# Utiliser sudo si nécessaire (attention !)
sudo python cleanup-python.py --path /path/to/project
```

### **Erreur : "File in Use"**
```bash
# Arrêter les processus Python
pkill -f python

# Ou redémarrer l'IDE
# Puis relancer le nettoyage
```

### **Erreur : "Path Not Found"**
```bash
# Vérifier le chemin
pwd
ls -la

# Utiliser le chemin absolu
python cleanup-python.py --path /chemin/complet/vers/projet
```

## 📊 **Métriques de Nettoyage**

### **📈 Suivi de l'Espace**
```bash
# Avant nettoyage
df -h .

# Nettoyage
python cleanup-python.py --force

# Après nettoyage
df -h .

# Différence
echo "Espace libéré : $(( $(df -h . | tail -1 | awk '{print $3}') - $(df -h . | tail -1 | awk '{print $4}') ))"
```

### **📋 Historique des Nettoyages**
```bash
# Créer un fichier de suivi
echo "$(date): Nettoyage effectué - $(python cleanup-python.py --dry-run | grep 'Espace à libérer')" >> cleanup_history.log
```

## ✅ **Vérification Post-nettoyage**

### **🔍 Vérifications**
```bash
# Vérifier qu'il ne reste plus de cache
find . -name "__pycache__" -type d
find . -name "*.pyc" -type f

# Vérifier l'espace libéré
df -h .

# Vérifier que l'application fonctionne
python -m pytest tests/ -v
```

### **🚀 Tests de Fonctionnement**
```bash
# Tester le backend
cd backend
python main.py

# Tester le frontend
cd frontend
npm run dev
```

---

**Version** : 1.0  
**Dernière mise à jour** : Août 2024  
**Statut** : ✅ **Guide Complet**  
**Nettoyage** : ✅ **Automatisé et Sécurisé**

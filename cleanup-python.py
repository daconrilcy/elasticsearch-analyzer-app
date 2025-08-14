#!/usr/bin/env python3
"""
🧹 Script de Nettoyage Python - Elasticsearch Analyzer App
Supprime tous les fichiers temporaires Python du projet
"""

import os
import shutil
import glob
from pathlib import Path
import argparse

def find_python_cache_files(root_dir):
    """Trouve tous les fichiers de cache Python"""
    patterns = [
        "**/__pycache__",
        "**/*.pyc",
        "**/*.pyo",
        "**/.pytest_cache",
        "**/*.egg-info",
        "**/.coverage",
        "**/htmlcov",
        "**/.mypy_cache",
        "**/.ruff_cache",
        "**/.pylint.d",
        "**/*.log",
        "**/.DS_Store",
        "**/Thumbs.db"
    ]
    
    files_to_remove = []
    dirs_to_remove = []
    
    for pattern in patterns:
        matches = glob.glob(os.path.join(root_dir, pattern), recursive=True)
        for match in matches:
            if os.path.isfile(match):
                files_to_remove.append(match)
            elif os.path.isdir(match):
                dirs_to_remove.append(match)
    
    return files_to_remove, dirs_to_remove

def calculate_size(files, dirs):
    """Calcule la taille totale des fichiers à supprimer"""
    total_size = 0
    
    for file_path in files:
        try:
            total_size += os.path.getsize(file_path)
        except OSError:
            pass
    
    for dir_path in dirs:
        try:
            for root, dirs_in, files_in in os.walk(dir_path):
                for file_in in files_in:
                    try:
                        total_size += os.path.getsize(os.path.join(root, file_in))
                    except OSError:
                        pass
        except OSError:
            pass
    
    return total_size

def format_size(size_bytes):
    """Formate la taille en format lisible"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def cleanup_python_cache(root_dir, dry_run=False, verbose=False):
    """Nettoie les fichiers de cache Python"""
    print(f"🧹 Nettoyage des fichiers temporaires Python dans : {root_dir}")
    print("=" * 60)
    
    # Trouver les fichiers à supprimer
    files_to_remove, dirs_to_remove = find_python_cache_files(root_dir)
    
    if not files_to_remove and not dirs_to_remove:
        print("✅ Aucun fichier temporaire trouvé !")
        return
    
    # Calculer la taille totale
    total_size = calculate_size(files_to_remove, dirs_to_remove)
    print(f"📊 Fichiers à supprimer : {len(files_to_remove)}")
    print(f"📁 Dossiers à supprimer : {len(dirs_to_remove)}")
    print(f"💾 Espace à libérer : {format_size(total_size)}")
    print()
    
    if dry_run:
        print("🔍 Mode simulation - Aucun fichier ne sera supprimé")
        print()
        
        if verbose:
            print("📋 Fichiers qui seraient supprimés :")
            for file_path in sorted(files_to_remove):
                print(f"  📄 {file_path}")
            
            print("\n📋 Dossiers qui seraient supprimés :")
            for dir_path in sorted(dirs_to_remove):
                print(f"  📁 {dir_path}")
        
        return
    
    # Demander confirmation
    response = input("❓ Continuer la suppression ? (y/N): ")
    if response.lower() != 'y':
        print("❌ Opération annulée")
        return
    
    # Supprimer les fichiers
    removed_files = 0
    removed_dirs = 0
    errors = 0
    
    print("\n🗑️  Suppression en cours...")
    
    # Supprimer les fichiers
    for file_path in files_to_remove:
        try:
            os.remove(file_path)
            removed_files += 1
            if verbose:
                print(f"  ✅ Supprimé : {file_path}")
        except OSError as e:
            errors += 1
            if verbose:
                print(f"  ❌ Erreur : {file_path} - {e}")
    
    # Supprimer les dossiers
    for dir_path in dirs_to_remove:
        try:
            shutil.rmtree(dir_path)
            removed_dirs += 1
            if verbose:
                print(f"  ✅ Supprimé : {dir_path}")
        except OSError as e:
            errors += 1
            if verbose:
                print(f"  ❌ Erreur : {dir_path} - {e}")
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DU NETTOYAGE")
    print("=" * 60)
    print(f"✅ Fichiers supprimés : {removed_files}")
    print(f"✅ Dossiers supprimés : {removed_dirs}")
    print(f"❌ Erreurs : {errors}")
    print(f"💾 Espace libéré : {format_size(total_size)}")
    
    if errors > 0:
        print(f"\n⚠️  {errors} erreur(s) lors de la suppression")
        print("   Certains fichiers peuvent être verrouillés ou protégés")

def main():
    parser = argparse.ArgumentParser(
        description="🧹 Nettoyage des fichiers temporaires Python",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation :
  python cleanup-python.py                    # Nettoyage normal
  python cleanup-python.py --dry-run         # Simulation sans suppression
  python cleanup-python.py --verbose         # Affichage détaillé
  python cleanup-python.py --path ./backend  # Nettoyer un dossier spécifique
        """
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulation sans suppression (par défaut)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Affichage détaillé des opérations"
    )
    
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Dossier racine à nettoyer (par défaut: dossier courant)"
    )
    
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Suppression forcée sans confirmation"
    )
    
    args = parser.parse_args()
    
    # Vérifier que le dossier existe
    if not os.path.exists(args.path):
        print(f"❌ Erreur : Le dossier '{args.path}' n'existe pas")
        return 1
    
    # Mode dry-run par défaut pour la sécurité
    if not args.dry_run and not args.force:
        print("🔒 Mode simulation activé par défaut pour la sécurité")
        print("   Utilisez --force pour une suppression réelle")
        args.dry_run = True
    
    try:
        cleanup_python_cache(args.path, args.dry_run, args.verbose)
        return 0
    except KeyboardInterrupt:
        print("\n\n❌ Opération interrompue par l'utilisateur")
        return 1
    except Exception as e:
        print(f"\n❌ Erreur inattendue : {e}")
        return 1

if __name__ == "__main__":
    exit(main())

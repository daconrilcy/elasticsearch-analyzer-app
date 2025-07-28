"""sync_es_files.py """
import shutil
from pathlib import Path

# --- Configuration ---
# Le dossier source dans votre projet backend
SOURCE_DIR = Path(__file__).parent / "app" / "es_analysis_files"
# Le dossier de destination dans votre instance Elasticsearch (ajustez si nécessaire)
# C'est le chemin typique dans une installation Docker.
DEST_DIR = Path("/usr/share/elasticsearch/config/analysis")


def sync_files():
    """
    Synchronise les fichiers du dossier SOURCE_DIR vers DEST_DIR.

    Copie un fichier si :
    - Il n'existe pas dans la destination.
    - Sa date de dernière modification est plus récente dans la source.
    """
    print("--- Début de la synchronisation des fichiers d'analyse ES ---")

    # S'assurer que les dossiers existent
    SOURCE_DIR.mkdir(exist_ok=True)
    DEST_DIR.mkdir(exist_ok=True)

    source_files = [f for f in SOURCE_DIR.iterdir() if f.is_file()]

    if not source_files:
        print("Aucun fichier à synchroniser dans le dossier source.")
        return

    copied_count = 0
    skipped_count = 0

    for src_file in source_files:
        dest_file = DEST_DIR / src_file.name

        should_copy = False
        if not dest_file.exists():
            print(f"[Nouveau] Le fichier '{src_file.name}' n'existe pas dans la destination.")
            should_copy = True
        else:
            src_mtime = src_file.stat().st_mtime
            dest_mtime = dest_file.stat().st_mtime
            if src_mtime > dest_mtime:
                print(f"[Modifié] Le fichier source '{src_file.name}' est plus récent.")
                should_copy = True

        if should_copy:
            try:
                shutil.copy2(src_file, dest_file)  # copy2 préserve les métadonnées
                print(f"  -> Copié : '{src_file.name}' vers '{DEST_DIR}'")
                copied_count += 1
            except Exception as e:
                print(f"  -> ERREUR lors de la copie de '{src_file.name}': {e}")
        else:
            skipped_count += 1

    print("\n--- Synchronisation terminée ---")
    print(f"Fichiers copiés/mis à jour : {copied_count}")
    print(f"Fichiers ignorés (à jour) : {skipped_count}")


if __name__ == "__main__":
    # Pour exécuter ce script manuellement, vous devez le faire
    # à l'intérieur du conteneur Elasticsearch.
    # Exemple : docker-compose exec elasticsearch python /chemin/vers/sync_es_files.py
    # Il est plus pratique de l'intégrer au démarrage du conteneur.
    sync_files()

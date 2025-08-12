# Playbook Incident - Mappings API

## Symptôme : P95 > 1.5s

### 1. Diagnostic rapide (5 min)

```bash
# Vérifier les métriques Prometheus
curl -s "http://localhost:8000/metrics" | grep -E "(dry_run_duration|mapping_validate_errors|dry_run_issues)"

# Vérifier les logs récents
tail -f logs/app.log | grep -E "(dry-run|mapping|performance)"
```

### 2. Vérifications immédiates

#### A. Taille payload > 5MB ?
```bash
# Vérifier les requêtes récentes avec gros payloads
grep "413" logs/access.log | tail -10
```

**Action d'urgence :** `MAPPINGS_MAX_BODY_SIZE=5242880` (5MB)

#### B. Dictionnaires > 50k sans cache ?
```bash
# Vérifier la taille des dictionnaires actifs
curl -s "http://localhost:8000/api/v1/dictionaries" | jq '.[] | select(.entries | length > 50000)'
```

**Action d'urgence :** Activer le cache normalisé dans `executor.py`

#### C. Patterns regex suspects ?
```bash
# Chercher les erreurs E_REGEX_GUARD
grep "E_REGEX_GUARD" logs/app.log | tail -10
```

**Action d'urgence :** `MAPPINGS_STRICT_REGEX=true`

### 3. Mesures d'urgence (10 min)

```bash
# Réduire le budget d'opérations
export MAPPINGS_OP_BUDGET=150

# Activer le mode strict regex
export MAPPINGS_STRICT_REGEX=true

# Rate limiting agressif
export MAPPINGS_RATE_LIMIT=60  # 60 req/minute par IP
```

### 4. Rollback si nécessaire

```bash
# Désactiver les mappings problématiques
curl -X PATCH "http://localhost:8000/api/v1/mappings/{id}/versions/{version_id}" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'

# Redémarrer avec paramètres conservateurs
MAPPINGS_OP_BUDGET=100 MAPPINGS_STRICT_REGEX=true python main.py
```

### 5. Monitoring post-incident

- Surveiller P95 pendant 1h
- Vérifier que `E_ID_CONFLICT = 0`
- Analyser les patterns de charge anormaux

### 6. Prévention

- Ajouter des alertes sur `payload_size > 1MB`
- Monitoring des dictionnaires > 10k entrées
- Alertes sur patterns regex > 100 caractères

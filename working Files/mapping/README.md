# Common Validator — Mapping DSL

**Single source of truth:** `mapping.schema.json` (JSON Schema Draft 2020-12).
Use AJV (TS) and jsonschema (Python) with the same schema. Extra cross-field rules are enforced in lightweight post-validators on both sides.

## Files
- `mapping.schema.json` — schema commun
- `ts/validateMapping.ts` — validateur TypeScript (AJV) + checks additionnels
- `py/validator.py` — validateur Python (jsonschema) + checks additionnels

## TypeScript
```bash
npm i ajv ajv-formats json-schema-to-ts
# tsconfig.json: { "compilerOptions": { "resolveJsonModule": true, "esModuleInterop": true } }
```
```ts
import { validateMapping, type Mapping } from "./ts/validateMapping";
import mapping from "./mapping.schema.json" assert { type: "json" }; // ou charge ton JSON réel

const res = validateMapping(yourMappingJson);
if (!res.ok) console.error(res.errors);
```

## Python
```bash
pip install jsonschema
```
```py
from py.validator import validate_mapping
ok, errors = validate_mapping(your_mapping_dict)
if not ok:
    for e in errors:
        print(e["code"], e["path"], e["msg"])
```

## Notes
- Le schéma capture les contraintes structurales et les règles principales (ex.: `date_parse` ⇒ `type: date`, `keyword` ⇒ pas d'`analyzer`).
- Les règles nécessitant une connaissance globale (unicité des targets, existence des analyzers, collisions `*.raw`) sont gérées en post-validation.
- Prêt pour V2: `InputJsonPath` est déjà défini dans le schéma, même si non utilisé dans V1.

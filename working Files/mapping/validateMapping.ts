// ts/validateMapping.ts
import Ajv, {DefinedError} from "ajv";
import addFormats from "ajv-formats";
import schema from "../mapping.schema.json";
import { FromSchema } from "json-schema-to-ts";

export type Mapping = FromSchema<typeof schema>;

const ajv = new Ajv({allErrors: true, strict: true});
addFormats(ajv);
const validateFn = ajv.compile(schema);

export type ValidationIssue = { code: string; path: string; msg: string; };

function pathFromError(e: DefinedError): string { return e.instancePath || ""; }

function analyzerExists(name: string, mapping: any): boolean {
  return Boolean(mapping.settings?.analysis?.analyzer && name in mapping.settings.analysis.analyzer);
}

function normalizerExists(name: string, mapping: any): boolean {
  return Boolean(mapping.settings?.analysis?.normalizer && name in mapping.settings.analysis.normalizer);
}

export function validateMapping(data: unknown): { ok: true; data: Mapping } | { ok: false; errors: ValidationIssue[] } {
  const valid = validateFn(data);
  if (!valid) {
    const errs: ValidationIssue[] = (validateFn.errors || []).map((e) => ({
      code: e.keyword.toUpperCase(),
      path: pathFromError(e as DefinedError),
      msg: `${e.instancePath || ""} ${e.message || ""}`.trim(),
    }));
    return { ok: false, errors: errs };
  }
  const mapping = data as any;

  const errors: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (let i=0;i<mapping.fields.length;i++){
    const f = mapping.fields[i];
    if (seen.has(f.target)) errors.push({code:"E_TARGET_DUPLICATE", path:`/fields/${i}/target`, msg:`duplicate target '${f.target}'`});
    else seen.add(f.target);
    if (f.analyzer && !analyzerExists(f.analyzer, mapping)) errors.push({code:"E_ANALYZER_NOT_FOUND", path:`/fields/${i}/analyzer`, msg:`analyzer '${f.analyzer}' not found`});
    if (f.normalizer && !normalizerExists(f.normalizer, mapping)) errors.push({code:"E_NORMALIZER_NOT_FOUND", path:`/fields/${i}/normalizer`, msg:`normalizer '${f.normalizer}' not found`});
    const mfNames = new Set<string>();
    for (let j=0;j<(f.multi_fields||[]).length;j++){
      const mf = f.multi_fields[j];
      if (mfNames.has(mf.name)) errors.push({code:"E_MULTI_FIELD_COLLISION", path:`/fields/${i}/multi_fields/${j}/name`, msg:`multi_field name '${mf.name}' duplicated`});
      else mfNames.add(mf.name);
      if (mf.analyzer && !analyzerExists(mf.analyzer, mapping)) errors.push({code:"E_ANALYZER_NOT_FOUND", path:`/fields/${i}/multi_fields/${j}/analyzer`, msg:`analyzer '${mf.analyzer}' not found`});
      if (mf.normalizer && !normalizerExists(mf.normalizer, mapping)) errors.push({code:"E_NORMALIZER_NOT_FOUND", path:`/fields/${i}/multi_fields/${j}/normalizer`, msg:`normalizer '${mf.normalizer}' not found`});
    }
    if ((f.multi_fields||[]).some((m:any)=>m.name==="raw") && mapping.fields.some((ff:any)=>ff.target===`${f.target}.raw`)){
      errors.push({code:"E_MULTI_FIELD_RESERVED_RAW_COLLISION", path:`/fields/${i}`, msg:`'.raw' reserved collision on '${f.target}'`});
    }
  }
  if (!mapping.id_policy) errors.push({code:"E_ID_CONFLICT_POLICY_MISSING", path:`/id_policy`, msg:`id_policy is required`});
  if (errors.length) return { ok:false, errors };
  return { ok:true, data: mapping as Mapping };
}

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Montée en charge
    { duration: '2m', target: 20 },  // Charge soutenue
    { duration: '1m', target: 0 },   // Dégradation
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // SLO: P95 < 1.5s
    http_req_failed: ['rate<0.05'],    // < 5% d'erreurs
  },
};

const payload = JSON.stringify({
  "dsl_version": "1.0",
  "index": "load-test",
  "globals": {
    "nulls": [""],
    "bool_true": ["true"],
    "bool_false": ["false"],
    "decimal_sep": ".",
    "thousands_sep": ",",
    "date_formats": ["yyyy-MM-dd"],
    "default_tz": "UTC",
    "empty_as_null": true,
    "preview": {"sample_size": 100}
  },
  "id_policy": {
    "from": ["id"],
    "op": "concat",
    "sep": ":",
    "on_conflict": "overwrite"
  },
  "fields": [
    {
      "target": "id",
      "type": "keyword",
      "input": [{"kind": "column", "name": "id"}],
      "pipeline": []
    },
    {
      "target": "name",
      "type": "text",
      "input": [{"kind": "column", "name": "name"}],
      "pipeline": []
    },
    {
      "target": "age",
      "type": "long",
      "input": [{"kind": "column", "name": "age"}],
      "pipeline": []
    }
  ],
  "sample": {
    "rows": [
      {"id": "1", "name": "John Doe", "age": "25"},
      {"id": "2", "name": "Jane Smith", "age": "30"},
      {"id": "3", "name": "Bob Johnson", "age": "35"}
    ]
  }
});

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Test endpoint dry-run
  const dryRunResponse = http.post(
    'http://localhost:8000/api/v1/mappings/dry-run/test',
    payload,
    params
  );

  check(dryRunResponse, {
    'dry-run status is 200': (r) => r.status === 200,
    'dry-run response time < 1.5s': (r) => r.timings.duration < 1500,
    'dry-run has docs_preview': (r) => JSON.parse(r.body).docs_preview !== undefined,
  });

  // Test endpoint check-ids
  const checkIdsPayload = JSON.stringify({
    "mapping": {
      "id_policy": {
        "from": ["id"],
        "op": "concat",
        "sep": ":"
      }
    },
    "sample": {
      "rows": [
        {"id": "1"},
        {"id": "2"},
        {"id": "3"}
      ]
    }
  });

  const checkIdsResponse = http.post(
    'http://localhost:8000/api/v1/mappings/check-ids/test',
    checkIdsPayload,
    params
  );

  check(checkIdsResponse, {
    'check-ids status is 200': (r) => r.status === 200,
    'check-ids response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // 1 seconde entre les requêtes
}

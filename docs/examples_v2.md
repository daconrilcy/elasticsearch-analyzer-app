# 🚀 **Exemples Avancés V2 - Elasticsearch Mapping DSL**

## 📋 **Vue d'ensemble**

Ce guide présente des exemples avancés et des cas d'usage complexes de la V2, démontrant la puissance des nouvelles fonctionnalités.

## 🏢 **Exemple 1 : Système de gestion d'entreprise**

### **Structure des données d'entrée :**
```json
{
  "company_id": "ENT001",
  "employees": [
    {
      "id": "EMP001",
      "name": "John Doe",
      "department": "IT",
      "salary": "75000",
      "skills": ["Python", "Elasticsearch", "Docker"],
      "projects": [
        {
          "name": "Migration V2",
          "role": "Lead Developer",
          "hours": "120"
        }
      ]
    }
  ],
  "departments": [
    {
      "name": "IT",
      "budget": "500000",
      "manager": "Jane Smith"
    }
  ]
}
```

### **Mapping V2 complet :**
```json
{
  "dsl_version": "2.0",
  "index": "enterprise_v2",
  "containers": [
    {
      "path": "employees[]",
      "type": "nested"
    },
    {
      "path": "departments[]",
      "type": "nested"
    },
    {
      "path": "employees[].projects[]",
      "type": "nested"
    }
  ],
  "fields": [
    {
      "target": "company_id",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "company_id"}
      ]
    },
    {
      "target": "employees.employee_id",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.employees[*].id"}
      ]
    },
    {
      "target": "employees.name",
      "type": "text",
      "input": [
        {"kind": "jsonpath", "expr": "$.employees[*].name"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "trim"},
            {"op": "titlecase"}
          ]
        }
      ]
    },
    {
      "target": "employees.salary_clean",
      "type": "long",
      "input": [
        {"kind": "jsonpath", "expr": "$.employees[*].salary"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "trim"},
            {"op": "regex_replace", "pattern": "[^0-9]", "replacement": ""},
            {"op": "cast", "to": "long"}
          ]
        }
      ]
    },
    {
      "target": "employees.skills_joined",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.employees[*].skills"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "join", "sep": "|"}
          ]
        }
      ]
    },
    {
      "target": "employees.total_hours",
      "type": "long",
      "input": [
        {"kind": "jsonpath", "expr": "$.employees[*].projects[*].hours"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "cast", "to": "long"}
          ]
        },
        {"op": "sum"}
      ]
    },
    {
      "target": "departments.budget_formatted",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.departments[*].budget"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "cast", "to": "long"},
            {
              "op": "format_number",
              "format": "#,##0",
              "locale": "fr-FR"
            }
          ]
        }
      ]
    }
  ]
}
```

### **Résultat généré :**
```json
{
  "_id": "ENT001",
  "_source": {
    "company_id": "ENT001",
    "employees": [
      {
        "employee_id": "EMP001",
        "name": "John Doe",
        "salary_clean": 75000,
        "skills_joined": "Python|Elasticsearch|Docker",
        "total_hours": 120
      }
    ],
    "departments": [
      {
        "budget_formatted": "500 000"
      }
    ]
  }
}
```

## 🏥 **Exemple 2 : Système de santé**

### **Structure des données d'entrée :**
```json
{
  "patient_id": "PAT001",
  "visits": [
    {
      "date": "2024-01-15",
      "diagnosis": "Hypertension",
      "medications": [
        {
          "name": "Lisinopril",
          "dosage": "10mg",
          "frequency": "daily"
        }
      ],
      "vitals": {
        "blood_pressure": "140/90",
        "heart_rate": "85",
        "temperature": "36.8"
      }
    }
  ],
  "allergies": ["Penicillin", "Sulfa drugs"],
  "emergency_contact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1-555-0123"
  }
}
```

### **Mapping V2 avec validation médicale :**
```json
{
  "dsl_version": "2.0",
  "index": "patients_v2",
  "containers": [
    {
      "path": "visits[]",
      "type": "nested"
    },
    {
      "path": "visits[].medications[]",
      "type": "nested"
    },
    {
      "path": "visits[].vitals",
      "type": "object"
    },
    {
      "path": "emergency_contact",
      "type": "object"
    }
  ],
  "fields": [
    {
      "target": "patient_id",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "patient_id"}
      ]
    },
    {
      "target": "visits.visit_date",
      "type": "date",
      "input": [
        {"kind": "jsonpath", "expr": "$.visits[*].date"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "cast", "to": "date", "format": "yyyy-MM-dd"}
          ]
        }
      ]
    },
    {
      "target": "visits.diagnosis_normalized",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.visits[*].diagnosis"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "trim"},
            {"op": "lower"},
{"op": "regex_replace", "pattern": "\\s+", "replacement": "_"}
          ]
        }
      ]
    },
    {
      "target": "visits.medications_summary",
      "type": "text",
      "input": [
        {"kind": "jsonpath", "expr": "$.visits[*].medications[*]"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {
              "op": "concat",
              "sep": " - ",
              "values": [
                {"kind": "jsonpath", "expr": "$.name"},
                {"kind": "jsonpath", "expr": "$.dosage"},
                {"kind": "jsonpath", "expr": "$.frequency"}
              ]
            }
          ]
        },
        {"op": "join", "sep": "; "}
      ]
    },
    {
      "target": "visits.blood_pressure_systolic",
      "type": "long",
      "input": [
        {"kind": "jsonpath", "expr": "$.visits[*].vitals.blood_pressure"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "regex_extract", "pattern": "(\\d+)/\\d+"},
            {"op": "cast", "to": "long"}
          ]
        }
      ]
    },
    {
      "target": "visits.blood_pressure_diastolic",
      "type": "long",
      "input": [
        {"kind": "jsonpath", "expr": "$.visits[*].vitals.blood_pressure"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "regex_extract", "pattern": "\\d+/(\\d+)"},
            {"op": "cast", "to": "long"}
          ]
        }
      ]
    },
    {
      "target": "allergies_formatted",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.allergies[*]"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "trim"},
            {"op": "titlecase"}
          ]
        },
        {"op": "join", "sep": ", "}
      ]
    },
    {
      "target": "emergency_contact.phone_clean",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.emergency_contact.phone"}
      ],
      "pipeline": [
        {"op": "trim"},
        {"op": "regex_replace", "pattern": "[^0-9+]", "replacement": ""}
      ]
    }
  ]
}
```

## 🏫 **Exemple 3 : Système éducatif**

### **Structure des données d'entrée :**
```json
{
  "student_id": "STU001",
  "courses": [
    {
      "code": "MATH101",
      "name": "Calculus I",
      "grades": [
        {"type": "midterm", "score": "85", "weight": "0.3"},
        {"type": "final", "score": "92", "weight": "0.7"}
      ],
      "attendance": [true, true, false, true, true]
    }
  ],
  "profile": {
    "major": "Computer Science",
    "gpa": "3.75",
    "graduation_year": "2026"
  }
}
```

### **Mapping V2 avec calculs académiques :**
```json
{
  "dsl_version": "2.0",
  "index": "students_v2",
  "containers": [
    {
      "path": "courses[]",
      "type": "nested"
    },
    {
      "path": "courses[].grades[]",
      "type": "nested"
    },
    {
      "path": "profile",
      "type": "object"
    }
  ],
  "fields": [
    {
      "target": "student_id",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "student_id"}
      ]
    },
    {
      "target": "courses.course_code",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.courses[*].code"}
      ]
    },
    {
      "target": "courses.course_name",
      "type": "text",
      "input": [
        {"kind": "jsonpath", "expr": "$.courses[*].name"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "trim"},
            {"op": "titlecase"}
          ]
        }
      ]
    },
    {
      "target": "courses.weighted_average",
      "type": "double",
      "input": [
        {"kind": "jsonpath", "expr": "$.courses[*].grades[*]"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {
              "op": "multiply",
              "values": [
                {"kind": "jsonpath", "expr": "$.score"},
                {"kind": "jsonpath", "expr": "$.weight"}
              ]
            }
          ]
        },
        {"op": "sum"}
      ]
    },
    {
      "target": "courses.attendance_rate",
      "type": "double",
      "input": [
        {"kind": "jsonpath", "expr": "$.courses[*].attendance[*]"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {
              "op": "when",
              "cond": {"eq": true},
              "then": [{"op": "literal", "value": 1}],
              "else": [{"op": "literal", "value": 0}]
            }
          ]
        },
        {"op": "average"}
      ]
    },
    {
      "target": "profile.gpa_formatted",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.profile.gpa"}
      ],
      "pipeline": [
        {"op": "cast", "to": "double"},
        {
          "op": "format_number",
          "format": "0.00",
          "locale": "en-US"
        }
      ]
    },
    {
      "target": "profile.graduation_status",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.profile.graduation_year"}
      ],
      "pipeline": [
        {"op": "cast", "to": "long"},
        {
          "op": "when",
          "cond": {"lte": 2024},
          "then": [{"op": "literal", "value": "graduated"}],
          "else": [{"op": "literal", "value": "enrolled"}]
        }
      ]
    }
  ]
}
```

## 🏭 **Exemple 4 : Système de fabrication**

### **Structure des données d'entrée :**
```json
{
  "order_id": "ORD001",
  "products": [
    {
      "sku": "PROD001",
      "quantity": "100",
      "specifications": {
        "color": "Red",
        "size": "Large",
        "material": "Cotton"
      },
      "quality_checks": [
        {"test": "color_fastness", "result": "PASS", "score": "95"},
        {"test": "durability", "result": "PASS", "score": "88"}
      ]
    }
  ],
  "production_line": "LINE_A",
  "schedule": {
    "start_date": "2024-02-01",
    "end_date": "2024-02-15",
    "shifts": ["morning", "afternoon", "night"]
  }
}
```

### **Mapping V2 avec contrôle qualité :**
```json
{
  "dsl_version": "2.0",
  "index": "manufacturing_v2",
  "containers": [
    {
      "path": "products[]",
      "type": "nested"
    },
    {
      "path": "products[].specifications",
      "type": "object"
    },
    {
      "path": "products[].quality_checks[]",
      "type": "nested"
    },
    {
      "path": "schedule",
      "type": "object"
    }
  ],
  "fields": [
    {
      "target": "order_id",
      "type": "keyword",
      "input": [
        {"kind": "column", "name": "order_id"}
      ]
    },
    {
      "target": "products.product_sku",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.products[*].sku"}
      ]
    },
    {
      "target": "products.quantity_clean",
      "type": "long",
      "input": [
        {"kind": "jsonpath", "expr": "$.products[*].quantity"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "trim"},
            {"op": "cast", "to": "long"}
          ]
        }
      ]
    },
    {
      "target": "products.specs_summary",
      "type": "text",
      "input": [
        {"kind": "jsonpath", "expr": "$.products[*].specifications"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {
              "op": "concat",
              "sep": ", ",
              "values": [
                {"kind": "jsonpath", "expr": "$.color"},
                {"kind": "jsonpath", "expr": "$.size"},
                {"kind": "jsonpath", "expr": "$.material"}
              ]
            }
          ]
        }
      ]
    },
    {
      "target": "products.quality_score_avg",
      "type": "double",
      "input": [
        {"kind": "jsonpath", "expr": "$.products[*].quality_checks[*].score"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "cast", "to": "long"}
          ]
        },
        {"op": "average"}
      ]
    },
    {
      "target": "products.quality_status",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.products[*].quality_checks[*]"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {
              "op": "when",
              "cond": {"eq": "PASS"},
              "then": [{"op": "literal", "value": "approved"}],
              "else": [{"op": "literal", "value": "rejected"}]
            }
          ]
        },
        {
          "op": "when",
          "cond": {"contains": "rejected"},
          "then": [{"op": "literal", "value": "quality_issue"}],
          "else": [{"op": "literal", "value": "quality_ok"}]
        }
      ]
    },
    {
      "target": "schedule.duration_days",
      "type": "long",
      "input": [
        {"kind": "jsonpath", "expr": "$.schedule.start_date"},
        {"kind": "jsonpath", "expr": "$.schedule.end_date"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "cast", "to": "date", "format": "yyyy-MM-dd"}
          ]
        },
        {
          "op": "date_diff",
          "unit": "days"
        }
      ]
    },
    {
      "target": "schedule.shifts_formatted",
      "type": "keyword",
      "input": [
        {"kind": "jsonpath", "expr": "$.schedule.shifts[*]"}
      ],
      "pipeline": [
        {
          "op": "map",
          "then": [
            {"op": "titlecase"}
          ]
        },
        {"op": "join", "sep": " + "}
      ]
    }
  ]
}
```

## 🔧 **Exemple 5 : Pipeline de transformation complexe**

### **Pipeline de nettoyage de données avec validation :**
```json
{
  "op": "map",
  "then": [
    {
      "op": "when",
      "cond": {"is_not_null": true},
      "then": [
        {"op": "trim"},
        {
          "op": "when",
          "cond": {"length": {"gt": 0}},
          "then": [
            {"op": "lower"},
            {
              "op": "when",
              "cond": {"contains": "email"},
              "then": [
                {"op": "validate_email"}
              ],
              "else": [
                {"op": "validate_text"}
              ]
            }
          ],
          "else": [
            {"op": "literal", "value": null}
          ]
        }
      ],
      "else": [
        {"op": "literal", "value": null}
      ]
    }
  ]
}
```

---

**🎯 Ces exemples démontrent la puissance et la flexibilité de la V2 pour gérer des cas d'usage complexes !**

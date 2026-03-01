"""
Mini ETL: PostgreSQL catalog schema → OpenSearch indexes.

Reads from the catalog schema in PostgreSQL and builds three denormalized
OpenSearch indexes matching the unic-dag production structure:
  - resource_centric (alias: resource_centric → resource_centric_re_0000)
  - table_centric    (alias: table_centric    → table_centric_re_0000)
  - variable_centric (alias: variable_centric → variable_centric_re_0000)

This is a dev-only seeding script. Production uses unic-dag (Spark ETL).
"""

import os
import sys
import time
from collections import defaultdict

import psycopg2
import psycopg2.extras
from opensearchpy import OpenSearch, helpers

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PG_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": int(os.environ.get("PGPORT", "5432")),
    "user": os.environ.get("PGUSER", "vincent"),
    "password": os.environ.get("PGPASSWORD", "vincent"),
    "dbname": os.environ.get("PGDATABASE", "unic_db"),
}

OS_HOST = os.environ.get("OPENSEARCH_HOST", "localhost")
OS_PORT = int(os.environ.get("OPENSEARCH_PORT", "9200"))

INDEX_SUFFIX = "_re_0000"

# ---------------------------------------------------------------------------
# OpenSearch index settings & mappings
# ---------------------------------------------------------------------------

LOWERCASE_NORMALIZER = {
    "analysis": {
        "normalizer": {
            "lowercase_normalizer": {
                "type": "custom",
                "filter": ["lowercase"],
            }
        }
    }
}

RESOURCE_CENTRIC_MAPPING = {
    "settings": {
        **LOWERCASE_NORMALIZER,
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index.mapping.nested_objects.limit": 100000,
    },
    "mappings": {
        "properties": {
            "rs_id": {"type": "integer"},
            "rs_code": {"type": "keyword"},
            "rs_name": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "rs_title": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "rs_type": {"type": "keyword"},
            "rs_description_en": {"type": "text"},
            "rs_description_fr": {"type": "text"},
            "rs_project_pi": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "rs_project_erb_id": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "rs_project_status": {"type": "keyword"},
            "rs_project_creation_date": {"type": "date"},
            "rs_project_completion_date": {"type": "date"},
            "rs_project_approval_date": {"type": "date"},
            "rs_project_approved": {"type": "boolean"},
            "rs_is_project": {"type": "boolean"},
            "rs_project_folder": {"type": "keyword"},
            "rs_system_database_type": {"type": "keyword"},
            "rs_system_collection_starting_year": {"type": "integer"},
            "rs_dict_current_version": {"type": "keyword"},
            "rs_last_update": {"type": "date"},
            "rs_analyst": {
                "type": "object",
                "properties": {
                    "analyst_id": {"type": "integer"},
                    "analyst_name": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                },
            },
            "stat_etl": {
                "type": "object",
                "properties": {
                    "project_count": {"type": "integer"},
                    "domain_count": {"type": "integer"},
                    "source_system_count": {"type": "integer"},
                    "variable_count": {"type": "integer"},
                    "table_count": {"type": "integer"},
                },
            },
            "tables": {
                "type": "nested",
                "properties": {
                    "tab_id": {"type": "integer"},
                    "tab_name": {"type": "keyword"},
                    "tab_label_en": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                    "tab_label_fr": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                },
            },
            "variables": {
                "type": "nested",
                "properties": {
                    "var_id": {"type": "integer"},
                    "var_name": {"type": "keyword"},
                    "var_label_en": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                    "var_label_fr": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                    "var_from_variables": {
                        "type": "nested",
                        "properties": {
                            "var_id": {"type": "integer"},
                            "var_name": {"type": "keyword"},
                            "published": {"type": "boolean"},
                        },
                    },
                    "var_from_source_systems": {
                        "type": "nested",
                        "properties": {
                            "rs_id": {"type": "integer"},
                            "rs_code": {"type": "keyword"},
                            "rs_name": {"type": "keyword"},
                            "published": {"type": "boolean"},
                        },
                    },
                },
            },
        }
    },
}

TABLE_CENTRIC_MAPPING = {
    "settings": {**LOWERCASE_NORMALIZER, "number_of_shards": 1, "number_of_replicas": 0},
    "mappings": {
        "properties": {
            "tab_id": {"type": "integer"},
            "tab_name": {"type": "keyword"},
            "tab_label_en": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "tab_label_fr": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "tab_domain": {"type": "keyword"},
            "tab_domain_en": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "tab_domain_fr": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "tab_entity_type": {"type": "keyword"},
            "tab_row_filter": {"type": "keyword", "index": False},
            "tab_created_at": {"type": "date"},
            "tab_last_update": {"type": "date"},
            "resource": {
                "type": "object",
                "properties": {
                    "rs_id": {"type": "integer"},
                    "rs_code": {"type": "keyword"},
                    "rs_name": {"type": "keyword"},
                    "rs_title": {"type": "keyword"},
                    "rs_type": {"type": "keyword"},
                    "rs_is_project": {"type": "boolean"},
                    "rs_description_en": {"type": "text"},
                    "rs_description_fr": {"type": "text"},
                },
            },
            "stat_etl": {
                "type": "object",
                "properties": {
                    "variable_count": {"type": "integer"},
                },
            },
            "variables": {
                "type": "nested",
                "properties": {
                    "var_id": {"type": "integer"},
                    "var_name": {"type": "keyword"},
                    "var_label_en": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                    "var_label_fr": {"type": "keyword", "normalizer": "lowercase_normalizer"},
                    "var_from_variables": {
                        "type": "nested",
                        "properties": {
                            "var_id": {"type": "integer"},
                            "var_name": {"type": "keyword"},
                            "published": {"type": "boolean"},
                        },
                    },
                    "var_from_source_systems": {
                        "type": "nested",
                        "properties": {
                            "rs_id": {"type": "integer"},
                            "rs_code": {"type": "keyword"},
                            "rs_name": {"type": "keyword"},
                            "published": {"type": "boolean"},
                        },
                    },
                },
            },
        }
    },
}

VARIABLE_CENTRIC_MAPPING = {
    "settings": {**LOWERCASE_NORMALIZER, "number_of_shards": 1, "number_of_replicas": 0},
    "mappings": {
        "properties": {
            "var_id": {"type": "integer"},
            "var_name": {"type": "keyword"},
            "var_label_en": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "var_label_fr": {"type": "keyword", "normalizer": "lowercase_normalizer"},
            "var_path": {"type": "keyword"},
            "var_value_type": {"type": "keyword"},
            "var_status": {"type": "keyword"},
            "var_derivation_algorithm": {"type": "keyword", "index": False},
            "var_notes": {"type": "keyword", "index": False},
            "var_created_at": {"type": "date"},
            "var_last_update": {"type": "date"},
            "resource": {
                "type": "object",
                "properties": {
                    "rs_id": {"type": "integer"},
                    "rs_code": {"type": "keyword"},
                    "rs_name": {"type": "keyword"},
                    "rs_title": {"type": "keyword"},
                    "rs_type": {"type": "keyword"},
                    "rs_is_project": {"type": "boolean"},
                    "rs_description_en": {"type": "text"},
                    "rs_description_fr": {"type": "text"},
                },
            },
            "table": {
                "type": "object",
                "properties": {
                    "tab_id": {"type": "integer"},
                    "tab_name": {"type": "keyword"},
                    "tab_label_en": {"type": "keyword"},
                    "tab_label_fr": {"type": "keyword"},
                    "tab_domain_en": {"type": "keyword"},
                    "tab_domain_fr": {"type": "keyword"},
                },
            },
            "var_from_source_systems": {
                "type": "nested",
                "properties": {
                    "rs_id": {"type": "integer"},
                    "rs_code": {"type": "keyword"},
                    "rs_name": {"type": "keyword"},
                    "published": {"type": "boolean"},
                },
            },
            "var_from_variables": {
                "type": "nested",
                "properties": {
                    "var_id": {"type": "integer"},
                    "var_name": {"type": "keyword"},
                    "published": {"type": "boolean"},
                    "resource": {
                        "type": "object",
                        "properties": {
                            "rs_id": {"type": "integer"},
                            "rs_code": {"type": "keyword"},
                            "rs_name": {"type": "keyword"},
                        },
                    },
                    "table": {
                        "type": "object",
                        "properties": {
                            "tab_id": {"type": "integer"},
                            "tab_name": {"type": "keyword"},
                        },
                    },
                },
            },
            "value_set": {
                "type": "object",
                "properties": {
                    "vs_id": {"type": "integer"},
                    "vs_name": {"type": "keyword"},
                    "vs_description_en": {"type": "text"},
                    "vs_description_fr": {"type": "text"},
                    "values": {
                        "type": "nested",
                        "properties": {
                            "vsval_code": {"type": "keyword"},
                            "vsval_label_en": {"type": "keyword"},
                            "vsval_label_fr": {"type": "keyword"},
                        },
                    },
                },
            },
        }
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def wait_for_pg(max_retries=30, delay=2):
    """Wait for PostgreSQL to be ready."""
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(**PG_CONFIG)
            conn.close()
            print("PostgreSQL is ready.")
            return
        except psycopg2.OperationalError:
            print(f"Waiting for PostgreSQL... ({i + 1}/{max_retries})")
            time.sleep(delay)
    print("ERROR: Could not connect to PostgreSQL.", file=sys.stderr)
    sys.exit(1)


def fmt_date(val):
    """Format a date/datetime value for OpenSearch ISO 8601, or return None."""
    if val is None:
        return None
    s = str(val)
    # PG timestamps: "2025-07-30 21:40:30.281000" → need "T" separator
    if " " in s and len(s) > 10:
        s = s.replace(" ", "T", 1)
    return s


def build_resource_obj(row):
    """Build the resource sub-object used in table_centric and variable_centric."""
    return {
        "rs_id": row["id"],
        "rs_code": row.get("code"),
        "rs_name": row.get("name"),
        "rs_title": row.get("title"),
        "rs_type": row.get("resource_type"),
        "rs_is_project": row.get("resource_type") == "research_project",
        "rs_description_en": row.get("description_en"),
        "rs_description_fr": row.get("description_fr"),
    }


# ---------------------------------------------------------------------------
# Data loading from PostgreSQL
# ---------------------------------------------------------------------------

def load_pg_data(cur):
    """Load all catalog data from PostgreSQL into dicts keyed by id."""

    # Resources
    cur.execute("SELECT * FROM catalog.resource WHERE publish_dictionary = true")
    resources = {r["id"]: dict(r) for r in cur.fetchall()}

    # Analysts (resource.project_analyst_id → analyst.id)
    cur.execute("SELECT * FROM catalog.analyst")
    analysts = {a["id"]: a for a in cur.fetchall()}
    analysts_by_resource = {}
    for rid, r in resources.items():
        aid = r.get("project_analyst_id")
        if aid is not None and aid in analysts:
            a = analysts[aid]
            analysts_by_resource[rid] = {"analyst_id": a["id"], "analyst_name": a.get("name")}

    # Dict tables
    cur.execute("SELECT * FROM catalog.dict_table")
    tables = {t["id"]: dict(t) for t in cur.fetchall()}

    # Variables
    cur.execute("SELECT * FROM catalog.variable")
    variables = {v["id"]: dict(v) for v in cur.fetchall()}

    # Value sets (variable.value_set_id → value_set.id)
    cur.execute("""
        SELECT vs.*, vsc.id as vsc_id, vsc.code as vsc_code,
               vsc.label_en as vsc_label_en, vsc.label_fr as vsc_label_fr
        FROM catalog.value_set vs
        LEFT JOIN catalog.value_set_code vsc ON vsc.value_set_id = vs.id
    """)
    # Build value_set_id -> {vs info + values[]}
    value_sets_by_id = {}
    for row in cur.fetchall():
        vsid = row["id"]
        if vsid not in value_sets_by_id:
            value_sets_by_id[vsid] = {
                "vs_id": vsid,
                "vs_name": row.get("name"),
                "vs_description_en": row.get("description_en"),
                "vs_description_fr": row.get("description_fr"),
                "values": [],
            }
        if row.get("vsc_id") is not None:
            value_sets_by_id[vsid]["values"].append({
                "vsval_code": row["vsc_code"],
                "vsval_label_en": row.get("vsc_label_en"),
                "vsval_label_fr": row.get("vsc_label_fr"),
            })

    # Map variable_id -> value_set (via variable.value_set_id)
    value_sets = {}
    for v in variables.values():
        vsid = v.get("value_set_id")
        if vsid is not None and vsid in value_sets_by_id:
            value_sets[v["id"]] = value_sets_by_id[vsid]

    # Group tables and variables by resource
    tables_by_resource = defaultdict(list)
    for t in tables.values():
        rid = t.get("resource_id")
        if rid is not None:
            tables_by_resource[rid].append(t)

    vars_by_table = defaultdict(list)
    for v in variables.values():
        tid = v.get("table_id")
        if tid is not None:
            vars_by_table[tid].append(v)

    vars_by_resource = defaultdict(list)
    for v in variables.values():
        tid = v.get("table_id")
        if tid is not None and tid in tables:
            rid = tables[tid].get("resource_id")
            if rid is not None:
                vars_by_resource[rid].append(v)

    return {
        "resources": resources,
        "analysts_by_resource": analysts_by_resource,
        "tables": tables,
        "variables": variables,
        "value_sets": value_sets,
        "tables_by_resource": tables_by_resource,
        "vars_by_table": vars_by_table,
        "vars_by_resource": vars_by_resource,
    }


# ---------------------------------------------------------------------------
# Build variable nested object (shared between resource_centric & table_centric)
# ---------------------------------------------------------------------------

def build_variable_nested(v, variables, resources, tables):
    """Build the nested variable object used in resource_centric and table_centric."""
    doc = {
        "var_id": v["id"],
        "var_name": v.get("name"),
        "var_label_en": v.get("label_en"),
        "var_label_fr": v.get("label_fr"),
    }

    # from_variable_id references
    from_var_ids = v.get("from_variable_id") or []
    if from_var_ids:
        from_vars = []
        for fv_id in from_var_ids:
            fv = variables.get(fv_id)
            if fv:
                from_vars.append({
                    "var_id": fv["id"],
                    "var_name": fv.get("name"),
                    "published": True,
                })
        if from_vars:
            doc["var_from_variables"] = from_vars

    # from_source_system_id references
    from_ss_ids = v.get("from_source_system_id") or []
    if from_ss_ids:
        from_ss = []
        for ss_id in from_ss_ids:
            ss = resources.get(ss_id)
            if ss:
                from_ss.append({
                    "rs_id": ss["id"],
                    "rs_code": ss.get("code"),
                    "rs_name": ss.get("name"),
                    "published": True,
                })
        if from_ss:
            doc["var_from_source_systems"] = from_ss

    return doc


# ---------------------------------------------------------------------------
# Build OpenSearch documents
# ---------------------------------------------------------------------------

def build_resource_centric_docs(data):
    """Build resource_centric index documents."""
    docs = []
    for rid, r in data["resources"].items():
        resource_tables = data["tables_by_resource"].get(rid, [])
        resource_vars = data["vars_by_resource"].get(rid, [])
        domains = set()
        for t in resource_tables:
            d = t.get("domain")
            if d:
                domains.add(d)

        doc = {
            "_id": rid,
            "rs_id": rid,
            "rs_code": r.get("code"),
            "rs_name": r.get("name"),
            "rs_title": r.get("title"),
            "rs_type": r.get("resource_type"),
            "rs_description_en": r.get("description_en"),
            "rs_description_fr": r.get("description_fr"),
            "rs_project_pi": r.get("project_principal_investigator"),
            "rs_project_erb_id": r.get("project_erb_id"),
            "rs_project_status": r.get("project_status"),
            "rs_project_creation_date": fmt_date(r.get("project_creation_date")),
            "rs_project_completion_date": fmt_date(r.get("project_completion_date")),
            "rs_project_approval_date": fmt_date(r.get("project_approval_date")),
            "rs_project_approved": r.get("project_approved"),
            "rs_is_project": r.get("resource_type") == "research_project",
            "rs_project_folder": r.get("project_folder"),
            "rs_system_database_type": r.get("system_database_type"),
            "rs_system_collection_starting_year": r.get("system_collection_starting_year"),
            "rs_dict_current_version": r.get("dict_current_version"),
            "rs_last_update": fmt_date(r.get("last_update")),
        }

        # Analyst
        analyst = data["analysts_by_resource"].get(rid)
        if analyst:
            doc["rs_analyst"] = analyst

        # Stats
        doc["stat_etl"] = {
            "project_count": 1 if r.get("resource_type") == "research_project" else 0,
            "domain_count": len(domains),
            "source_system_count": 0,
            "variable_count": len(resource_vars),
            "table_count": len(resource_tables),
        }

        # Nested tables
        doc["tables"] = [
            {
                "tab_id": t["id"],
                "tab_name": t.get("name"),
                "tab_label_en": t.get("label_en"),
                "tab_label_fr": t.get("label_fr"),
            }
            for t in resource_tables
        ]

        # Nested variables
        doc["variables"] = [
            build_variable_nested(v, data["variables"], data["resources"], data["tables"])
            for v in resource_vars
        ]

        docs.append(doc)

    return docs


def build_table_centric_docs(data):
    """Build table_centric index documents."""
    docs = []
    for tid, t in data["tables"].items():
        rid = t.get("resource_id")
        r = data["resources"].get(rid, {})
        table_vars = data["vars_by_table"].get(tid, [])

        doc = {
            "_id": tid,
            "tab_id": tid,
            "tab_name": t.get("name"),
            "tab_label_en": t.get("label_en"),
            "tab_label_fr": t.get("label_fr"),
            "tab_domain": t.get("domain"),
            "tab_domain_en": t.get("domain"),
            "tab_domain_fr": t.get("domain"),
            "tab_entity_type": t.get("entity_type"),
            "tab_row_filter": t.get("row_filter"),
            "tab_created_at": fmt_date(t.get("created_at")),
            "tab_last_update": fmt_date(t.get("last_update")),
            "resource": build_resource_obj(r) if r else None,
            "stat_etl": {
                "variable_count": len(table_vars),
            },
            "variables": [
                build_variable_nested(v, data["variables"], data["resources"], data["tables"])
                for v in table_vars
            ],
        }
        docs.append(doc)

    return docs


def build_variable_centric_docs(data):
    """Build variable_centric index documents."""
    docs = []
    for vid, v in data["variables"].items():
        tid = v.get("table_id")
        t = data["tables"].get(tid, {})
        rid = t.get("resource_id")
        r = data["resources"].get(rid, {})

        doc = {
            "_id": vid,
            "var_id": vid,
            "var_name": v.get("name"),
            "var_label_en": v.get("label_en"),
            "var_label_fr": v.get("label_fr"),
            "var_path": v.get("path"),
            "var_value_type": v.get("value_type"),
            "var_status": v.get("variable_status"),
            "var_derivation_algorithm": v.get("derivation_algorithm"),
            "var_notes": v.get("notes"),
            "var_created_at": fmt_date(v.get("created_at")),
            "var_last_update": fmt_date(v.get("last_update")),
            "resource": build_resource_obj(r) if r else None,
            "table": {
                "tab_id": tid,
                "tab_name": t.get("name"),
                "tab_label_en": t.get("label_en"),
                "tab_label_fr": t.get("label_fr"),
                "tab_domain_en": t.get("domain"),
                "tab_domain_fr": t.get("domain"),
            } if t else None,
        }

        # from_variable_id references (richer than nested version)
        from_var_ids = v.get("from_variable_id") or []
        if from_var_ids:
            from_vars = []
            for fv_id in from_var_ids:
                fv = data["variables"].get(fv_id)
                if fv:
                    fv_tid = fv.get("table_id")
                    fv_t = data["tables"].get(fv_tid, {})
                    fv_rid = fv_t.get("resource_id")
                    fv_r = data["resources"].get(fv_rid, {})
                    entry = {
                        "var_id": fv["id"],
                        "var_name": fv.get("name"),
                        "published": True,
                    }
                    if fv_r:
                        entry["resource"] = {
                            "rs_id": fv_r.get("id"),
                            "rs_code": fv_r.get("code"),
                            "rs_name": fv_r.get("name"),
                        }
                    if fv_t:
                        entry["table"] = {
                            "tab_id": fv_t.get("id"),
                            "tab_name": fv_t.get("name"),
                        }
                    from_vars.append(entry)
            if from_vars:
                doc["var_from_variables"] = from_vars

        # from_source_system_id references
        from_ss_ids = v.get("from_source_system_id") or []
        if from_ss_ids:
            from_ss = []
            for ss_id in from_ss_ids:
                ss = data["resources"].get(ss_id)
                if ss:
                    from_ss.append({
                        "rs_id": ss["id"],
                        "rs_code": ss.get("code"),
                        "rs_name": ss.get("name"),
                        "published": True,
                    })
            if from_ss:
                doc["var_from_source_systems"] = from_ss

        # Value set
        vs = data["value_sets"].get(vid)
        if vs:
            doc["value_set"] = vs

        docs.append(doc)

    return docs


# ---------------------------------------------------------------------------
# Index into OpenSearch
# ---------------------------------------------------------------------------

def create_and_load_index(os_client, index_name, alias_name, mapping, docs):
    """Create an index, bulk load documents, and set up an alias."""
    # Delete existing index if present
    if os_client.indices.exists(index=index_name):
        os_client.indices.delete(index=index_name)
        print(f"  Deleted existing index {index_name}")

    # Delete alias if it points somewhere else
    if os_client.indices.exists_alias(name=alias_name):
        os_client.indices.delete_alias(index="_all", name=alias_name)

    os_client.indices.create(index=index_name, body=mapping)
    print(f"  Created index {index_name}")

    if not docs:
        print(f"  WARNING: No documents to load for {index_name}")
    else:
        actions = [
            {"_index": index_name, "_id": doc.pop("_id"), "_source": doc}
            for doc in docs
        ]
        success, errors = helpers.bulk(os_client, actions, raise_on_error=False)
        print(f"  Loaded {success} documents into {index_name}")
        if errors:
            print(f"  WARNING: {len(errors)} errors during bulk load")
            for err in errors[:5]:
                print(f"    {err}")

    os_client.indices.put_alias(index=index_name, name=alias_name)
    print(f"  Created alias {alias_name} → {index_name}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Mini ETL: PostgreSQL → OpenSearch")
    print("=" * 60)

    # Wait for PG
    wait_for_pg()

    # Connect to PG
    conn = psycopg2.connect(**PG_CONFIG)
    conn.set_client_encoding("UTF8")
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Check that catalog schema exists
    cur.execute("""
        SELECT schema_name FROM information_schema.schemata
        WHERE schema_name = 'catalog'
    """)
    if not cur.fetchone():
        print("ERROR: catalog schema not found in database. Is the dump restored?", file=sys.stderr)
        sys.exit(1)

    print("\nLoading data from PostgreSQL...")
    data = load_pg_data(cur)
    print(f"  Resources: {len(data['resources'])}")
    print(f"  Tables:    {len(data['tables'])}")
    print(f"  Variables: {len(data['variables'])}")

    cur.close()
    conn.close()

    # Connect to OpenSearch
    os_client = OpenSearch(
        hosts=[{"host": OS_HOST, "port": OS_PORT}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False,
    )
    print(f"\nOpenSearch cluster: {os_client.info()['cluster_name']}")

    # Build and load resource_centric
    print("\n--- resource_centric ---")
    rc_docs = build_resource_centric_docs(data)
    create_and_load_index(
        os_client,
        f"resource_centric{INDEX_SUFFIX}",
        "resource_centric",
        RESOURCE_CENTRIC_MAPPING,
        rc_docs,
    )

    # Build and load table_centric
    print("\n--- table_centric ---")
    tc_docs = build_table_centric_docs(data)
    create_and_load_index(
        os_client,
        f"table_centric{INDEX_SUFFIX}",
        "table_centric",
        TABLE_CENTRIC_MAPPING,
        tc_docs,
    )

    # Build and load variable_centric
    print("\n--- variable_centric ---")
    vc_docs = build_variable_centric_docs(data)
    create_and_load_index(
        os_client,
        f"variable_centric{INDEX_SUFFIX}",
        "variable_centric",
        VARIABLE_CENTRIC_MAPPING,
        vc_docs,
    )

    print("\n" + "=" * 60)
    print("ETL complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

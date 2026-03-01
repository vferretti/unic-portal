/** A data dictionary table entry with its parent resource and ETL statistics. */
export interface DictTable {
  tab_id: number;
  tab_name: string;
  tab_domain: string | null;
  tab_domain_en: string | null;
  tab_domain_fr: string | null;
  resource: {
    rs_name: string;
    rs_type: string;
  } | null;
  stat_etl: {
    variable_count: number | null;
  } | null;
}

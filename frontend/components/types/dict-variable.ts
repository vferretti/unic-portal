/** A data dictionary variable entry with its parent resource, table, and source systems. */
export interface DictVariable {
  var_id: number;
  var_name: string;
  var_label_en: string | null;
  var_label_fr: string | null;
  var_value_type: string | null;
  resource: {
    rs_name: string;
    rs_type: string;
  } | null;
  table: {
    tab_name: string;
    tab_domain_en: string | null;
    tab_domain_fr: string | null;
  } | null;
  var_from_source_systems:
    | {
        rs_name: string;
      }[]
    | null;
}

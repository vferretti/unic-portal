/** A catalog resource (research project, source system, warehouse, or EQP). */
export interface Resource {
  rs_id: number;
  rs_code: string;
  rs_name: string;
  rs_title: string | null;
  rs_type: string;
  rs_description_fr: string | null;
  rs_description_en: string | null;
  rs_project_pi: string | null;
  rs_project_erb_id: string | null;
  rs_project_status: string | null;
  rs_project_creation_date: string | null;
  rs_project_completion_date: string | null;
  rs_project_approval_date: string | null;
  rs_project_approved: boolean | null;
  rs_is_project: boolean | null;
  rs_project_folder: string | null;
  rs_system_database_type: string | null;
  rs_system_collection_starting_year: number | null;
  rs_dict_current_version: string | null;
  rs_last_update: string | null;
  stat_etl: {
    project_count: number | null;
    domain_count: number | null;
    source_system_count: number | null;
    variable_count: number | null;
    table_count: number | null;
  } | null;
}

export type SortKey = keyof Resource;

package types

type Resource struct {
	ID                           int     `json:"rs_id"`
	Code                         string  `json:"rs_code"`
	Name                         string  `json:"rs_name"`
	Title                        *string `json:"rs_title"`
	Type                         string  `json:"rs_type"`
	DescriptionFr                *string `json:"rs_description_fr"`
	DescriptionEn                *string `json:"rs_description_en"`
	ProjectPI                    *string `json:"rs_project_pi"`
	ProjectErbId                 *string `json:"rs_project_erb_id"`
	ProjectStatus                *string `json:"rs_project_status"`
	ProjectCreationDate          *string `json:"rs_project_creation_date"`
	ProjectCompletionDate        *string `json:"rs_project_completion_date"`
	ProjectApprovalDate          *string `json:"rs_project_approval_date"`
	ProjectApproved              *bool   `json:"rs_project_approved"`
	IsProject                    *bool   `json:"rs_is_project"`
	ProjectFolder                *string `json:"rs_project_folder"`
	SystemDatabaseType           *string `json:"rs_system_database_type"`
	SystemCollectionStartingYear *int    `json:"rs_system_collection_starting_year"`
	DictCurrentVersion           *string  `json:"rs_dict_current_version"`
	LastUpdate                   *string  `json:"rs_last_update"`
	StatETL                      *StatETL `json:"stat_etl"`
}

type StatETL struct {
	ProjectCount      *int `json:"project_count"`
	DomainCount       *int `json:"domain_count"`
	SourceSystemCount *int `json:"source_system_count"`
	VariableCount     *int `json:"variable_count"`
	TableCount        *int `json:"table_count"`
}

type DictTable struct {
	ID         int                    `json:"tab_id"`
	Name       string                 `json:"tab_name"`
	Domain     *string                `json:"tab_domain"`
	DomainEn   *string                `json:"tab_domain_en"`
	DomainFr   *string                `json:"tab_domain_fr"`
	Resource   *DictTableResource     `json:"resource"`
	StatETL    *DictTableStatETL      `json:"stat_etl"`
}

type DictTableResource struct {
	Name string `json:"rs_name"`
	Type string `json:"rs_type"`
}

type DictTableStatETL struct {
	VariableCount *int `json:"variable_count"`
}

type DictVariable struct {
	ID                int                          `json:"var_id"`
	Name              string                       `json:"var_name"`
	LabelEn           *string                      `json:"var_label_en"`
	LabelFr           *string                      `json:"var_label_fr"`
	ValueType         *string                      `json:"var_value_type"`
	Resource          *DictVariableResource        `json:"resource"`
	Table             *DictVariableTable           `json:"table"`
	FromSourceSystems []DictVariableSourceSystem   `json:"var_from_source_systems"`
}

type DictVariableSourceSystem struct {
	Name string `json:"rs_name"`
}

type DictVariableResource struct {
	Name string `json:"rs_name"`
	Type string `json:"rs_type"`
}

type DictVariableTable struct {
	Name     string  `json:"tab_name"`
	DomainEn *string `json:"tab_domain_en"`
	DomainFr *string `json:"tab_domain_fr"`
}

type PaginationParams struct {
	PageIndex int
	PageSize  int
	SortField string
	SortOrder string
	Systems   []string
	Tables    []string
	Search    string
}

type PaginatedResponse[T any] struct {
	Data  []T `json:"data"`
	Total int `json:"total"`
}

type CatalogTypeStat struct {
	ResourceCount int `json:"resource_count"`
	TableCount    int `json:"table_count"`
	VariableCount int `json:"variable_count"`
}

type CatalogStats map[string]CatalogTypeStat

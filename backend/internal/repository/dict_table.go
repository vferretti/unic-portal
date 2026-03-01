package repository

import (
	"encoding/json"
	"fmt"

	"portal/internal/types"

	opensearchapi "github.com/opensearch-project/opensearch-go/v4/opensearchapi"
)

type DictTableDAO interface {
	ListTablesByResourceType(rsType string, params types.PaginationParams) ([]types.DictTable, int, error)
}

type DictTableRepository struct {
	client *opensearchapi.Client
}

func NewDictTableRepository(client *opensearchapi.Client) *DictTableRepository {
	return &DictTableRepository{client: client}
}

func (r *DictTableRepository) ListTablesByResourceType(rsType string, params types.PaginationParams) ([]types.DictTable, int, error) {
	must := []map[string]any{
		{"term": map[string]any{"resource.rs_type": rsType}},
	}
	if len(params.Systems) > 0 {
		must = append(must, map[string]any{
			"terms": map[string]any{"resource.rs_name": params.Systems},
		})
	}
	if len(params.Tables) > 0 {
		must = append(must, map[string]any{
			"terms": map[string]any{"tab_name": params.Tables},
		})
	}
	if params.Search != "" {
		pattern := "*" + params.Search + "*"
		must = append(must, map[string]any{
			"bool": map[string]any{
				"should": []map[string]any{
					{"wildcard": map[string]any{"tab_name": map[string]any{"value": pattern, "case_insensitive": true}}},
					{"wildcard": map[string]any{"resource.rs_name": map[string]any{"value": pattern, "case_insensitive": true}}},
					{"wildcard": map[string]any{"tab_domain": map[string]any{"value": pattern, "case_insensitive": true}}},
				},
				"minimum_should_match": 1,
			},
		})
	}
	query := map[string]any{
		"query": map[string]any{
			"bool": map[string]any{"must": must},
		},
	}

	sources, total, err := fetchPage(r.client, "table_centric", query, params)
	if err != nil {
		return nil, 0, err
	}

	tables := make([]types.DictTable, 0, len(sources))
	for _, src := range sources {
		var t types.DictTable
		if err := json.Unmarshal(src, &t); err != nil {
			return nil, 0, fmt.Errorf("failed to parse table document: %w", err)
		}
		tables = append(tables, t)
	}

	return tables, total, nil
}

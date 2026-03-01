package repository

import (
	"encoding/json"
	"fmt"

	"portal/internal/types"

	opensearchapi "github.com/opensearch-project/opensearch-go/v4/opensearchapi"
)

type DictVariableDAO interface {
	ListVariablesByResourceType(rsType string, params types.PaginationParams) ([]types.DictVariable, int, error)
}

type DictVariableRepository struct {
	client *opensearchapi.Client
}

func NewDictVariableRepository(client *opensearchapi.Client) *DictVariableRepository {
	return &DictVariableRepository{client: client}
}

func (r *DictVariableRepository) ListVariablesByResourceType(rsType string, params types.PaginationParams) ([]types.DictVariable, int, error) {
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
			"terms": map[string]any{"table.tab_name": params.Tables},
		})
	}
	if params.Search != "" {
		pattern := "*" + params.Search + "*"
		must = append(must, map[string]any{
			"bool": map[string]any{
				"should": []map[string]any{
					{"wildcard": map[string]any{"var_name": map[string]any{"value": pattern, "case_insensitive": true}}},
					{"wildcard": map[string]any{"var_label_en": map[string]any{"value": pattern, "case_insensitive": true}}},
					{"wildcard": map[string]any{"var_label_fr": map[string]any{"value": pattern, "case_insensitive": true}}},
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

	sources, total, err := fetchPage(r.client, "variable_centric", query, params)
	if err != nil {
		return nil, 0, err
	}

	variables := make([]types.DictVariable, 0, len(sources))
	for _, src := range sources {
		var v types.DictVariable
		if err := json.Unmarshal(src, &v); err != nil {
			return nil, 0, fmt.Errorf("failed to parse variable document: %w", err)
		}
		variables = append(variables, v)
	}

	return variables, total, nil
}

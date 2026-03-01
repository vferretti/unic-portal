package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"portal/internal/types"

	opensearchapi "github.com/opensearch-project/opensearch-go/v4/opensearchapi"
)

type ResourceDAO interface {
	ListResources() ([]types.Resource, error)
	ListResourcesByType(rsType string, params types.PaginationParams) ([]types.Resource, int, error)
	GetCatalogStats(systems []string, tables []string) (types.CatalogStats, error)
}

type ResourceRepository struct {
	client *opensearchapi.Client
}

func NewResourceRepository(client *opensearchapi.Client) *ResourceRepository {
	return &ResourceRepository{client: client}
}

func (r *ResourceRepository) ListResources() ([]types.Resource, error) {
	query := map[string]any{
		"query": map[string]any{
			"terms": map[string]any{
				"rs_type": []string{"eqp", "research_project"},
			},
		},
		"sort": []map[string]any{
			{"rs_name.keyword": map[string]any{"order": "asc", "unmapped_type": "keyword"}},
		},
	}

	sources, err := fetchAllHits(r.client, "resource_centric", query)
	if err != nil {
		return nil, err
	}

	resources := make([]types.Resource, 0, len(sources))
	for _, src := range sources {
		var res types.Resource
		if err := json.Unmarshal(src, &res); err != nil {
			return nil, fmt.Errorf("failed to parse resource document: %w", err)
		}
		resources = append(resources, res)
	}

	return resources, nil
}

func (r *ResourceRepository) ListResourcesByType(rsType string, params types.PaginationParams) ([]types.Resource, int, error) {
	must := []map[string]any{
		{"term": map[string]any{"rs_type": rsType}},
	}
	if len(params.Systems) > 0 {
		must = append(must, map[string]any{
			"terms": map[string]any{"rs_name": params.Systems},
		})
	}
	if params.Search != "" {
		pattern := "*" + params.Search + "*"
		must = append(must, map[string]any{
			"bool": map[string]any{
				"should": []map[string]any{
					{"wildcard": map[string]any{"rs_name": map[string]any{"value": pattern, "case_insensitive": true}}},
					{"wildcard": map[string]any{"rs_description_en": map[string]any{"value": pattern, "case_insensitive": true}}},
					{"wildcard": map[string]any{"rs_description_fr": map[string]any{"value": pattern, "case_insensitive": true}}},
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

	sources, total, err := fetchPage(r.client, "resource_centric", query, params)
	if err != nil {
		return nil, 0, err
	}

	resources := make([]types.Resource, 0, len(sources))
	for _, src := range sources {
		var res types.Resource
		if err := json.Unmarshal(src, &res); err != nil {
			return nil, 0, fmt.Errorf("failed to parse resource document: %w", err)
		}
		resources = append(resources, res)
	}

	return resources, total, nil
}

func (r *ResourceRepository) GetCatalogStats(systems []string, tables []string) (types.CatalogStats, error) {
	if len(tables) > 0 {
		return r.getCatalogStatsWithTableFilter(systems, tables)
	}
	return r.getCatalogStatsFromResources(systems)
}

func (r *ResourceRepository) getCatalogStatsFromResources(systems []string) (types.CatalogStats, error) {
	q := map[string]any{
		"size": 0,
		"aggs": map[string]any{
			"by_type": map[string]any{
				"terms": map[string]any{"field": "rs_type", "size": 50},
				"aggs": map[string]any{
					"total_tables":    map[string]any{"sum": map[string]any{"field": "stat_etl.table_count"}},
					"total_variables": map[string]any{"sum": map[string]any{"field": "stat_etl.variable_count"}},
				},
			},
		},
	}
	if len(systems) > 0 {
		q["query"] = map[string]any{
			"terms": map[string]any{"rs_name": systems},
		}
	}
	queryBytes, _ := json.Marshal(q)

	resp, err := r.client.Search(context.Background(), &opensearchapi.SearchReq{
		Indices: []string{"resource_centric"},
		Body:    strings.NewReader(string(queryBytes)),
	})
	if err != nil {
		return nil, fmt.Errorf("opensearch search failed: %w", err)
	}

	body, err := io.ReadAll(resp.Inspect().Response.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var result struct {
		Aggregations struct {
			ByType struct {
				Buckets []struct {
					Key            string `json:"key"`
					DocCount       int    `json:"doc_count"`
					TotalTables    struct{ Value float64 } `json:"total_tables"`
					TotalVariables struct{ Value float64 } `json:"total_variables"`
				} `json:"buckets"`
			} `json:"by_type"`
		} `json:"aggregations"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse opensearch response: %w", err)
	}

	stats := make(types.CatalogStats)
	for _, bucket := range result.Aggregations.ByType.Buckets {
		stats[bucket.Key] = types.CatalogTypeStat{
			ResourceCount: bucket.DocCount,
			TableCount:    int(bucket.TotalTables.Value),
			VariableCount: int(bucket.TotalVariables.Value),
		}
	}

	return stats, nil
}

func (r *ResourceRepository) getCatalogStatsWithTableFilter(systems []string, tables []string) (types.CatalogStats, error) {
	// Query table_centric for resource_count + table_count
	tableMust := []map[string]any{
		{"terms": map[string]any{"tab_name": tables}},
	}
	if len(systems) > 0 {
		tableMust = append(tableMust, map[string]any{
			"terms": map[string]any{"resource.rs_name": systems},
		})
	}
	tableQ := map[string]any{
		"size": 0,
		"query": map[string]any{
			"bool": map[string]any{"must": tableMust},
		},
		"aggs": map[string]any{
			"by_type": map[string]any{
				"terms": map[string]any{"field": "resource.rs_type", "size": 50},
				"aggs": map[string]any{
					"unique_resources": map[string]any{"cardinality": map[string]any{"field": "resource.rs_name"}},
				},
			},
		},
	}
	tableBytes, _ := json.Marshal(tableQ)

	// Query variable_centric for variable_count
	varMust := []map[string]any{
		{"terms": map[string]any{"table.tab_name": tables}},
	}
	if len(systems) > 0 {
		varMust = append(varMust, map[string]any{
			"terms": map[string]any{"resource.rs_name": systems},
		})
	}
	varQ := map[string]any{
		"size": 0,
		"query": map[string]any{
			"bool": map[string]any{"must": varMust},
		},
		"aggs": map[string]any{
			"by_type": map[string]any{
				"terms": map[string]any{"field": "resource.rs_type", "size": 50},
			},
		},
	}
	varBytes, _ := json.Marshal(varQ)

	// Execute both queries
	tableResp, err := r.client.Search(context.Background(), &opensearchapi.SearchReq{
		Indices: []string{"table_centric"},
		Body:    strings.NewReader(string(tableBytes)),
	})
	if err != nil {
		return nil, fmt.Errorf("opensearch table stats search failed: %w", err)
	}
	tableBody, err := io.ReadAll(tableResp.Inspect().Response.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read table stats response: %w", err)
	}

	varResp, err := r.client.Search(context.Background(), &opensearchapi.SearchReq{
		Indices: []string{"variable_centric"},
		Body:    strings.NewReader(string(varBytes)),
	})
	if err != nil {
		return nil, fmt.Errorf("opensearch variable stats search failed: %w", err)
	}
	varBody, err := io.ReadAll(varResp.Inspect().Response.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read variable stats response: %w", err)
	}

	// Parse table_centric results
	var tableResult struct {
		Aggregations struct {
			ByType struct {
				Buckets []struct {
					Key             string `json:"key"`
					DocCount        int    `json:"doc_count"`
					UniqueResources struct{ Value int } `json:"unique_resources"`
				} `json:"buckets"`
			} `json:"by_type"`
		} `json:"aggregations"`
	}
	if err := json.Unmarshal(tableBody, &tableResult); err != nil {
		return nil, fmt.Errorf("failed to parse table stats response: %w", err)
	}

	// Parse variable_centric results
	var varResult struct {
		Aggregations struct {
			ByType struct {
				Buckets []struct {
					Key      string `json:"key"`
					DocCount int    `json:"doc_count"`
				} `json:"buckets"`
			} `json:"by_type"`
		} `json:"aggregations"`
	}
	if err := json.Unmarshal(varBody, &varResult); err != nil {
		return nil, fmt.Errorf("failed to parse variable stats response: %w", err)
	}

	// Merge results
	stats := make(types.CatalogStats)
	for _, bucket := range tableResult.Aggregations.ByType.Buckets {
		stats[bucket.Key] = types.CatalogTypeStat{
			ResourceCount: bucket.UniqueResources.Value,
			TableCount:    bucket.DocCount,
		}
	}
	for _, bucket := range varResult.Aggregations.ByType.Buckets {
		s := stats[bucket.Key]
		s.VariableCount = bucket.DocCount
		stats[bucket.Key] = s
	}

	return stats, nil
}

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

const batchSize = 2000

// fetchAllHits uses search_after to paginate through all matching documents,
// bypassing the default 10k max_result_window limit.
// The baseQuery must include a "sort" field and a "query" field.
func fetchAllHits(client *opensearchapi.Client, index string, baseQuery map[string]any) ([]json.RawMessage, error) {
	baseQuery["size"] = batchSize

	var allSources []json.RawMessage

	for {
		queryBytes, err := json.Marshal(baseQuery)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal query: %w", err)
		}

		resp, err := client.Search(context.Background(), &opensearchapi.SearchReq{
			Indices: []string{index},
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
			Hits struct {
				Hits []struct {
					Source json.RawMessage `json:"_source"`
					Sort   []any          `json:"sort"`
				} `json:"hits"`
			} `json:"hits"`
		}
		if err := json.Unmarshal(body, &result); err != nil {
			return nil, fmt.Errorf("failed to parse opensearch response: %w", err)
		}

		hits := result.Hits.Hits
		for _, hit := range hits {
			allSources = append(allSources, hit.Source)
		}

		if len(hits) < batchSize {
			break
		}

		lastHit := hits[len(hits)-1]
		baseQuery["search_after"] = lastHit.Sort
	}

	return allSources, nil
}

// fetchPage retrieves a single page of results using from+size pagination.
// The baseQuery must include a "query" field. Sort is set from params.
func fetchPage(client *opensearchapi.Client, index string, baseQuery map[string]any, params types.PaginationParams) ([]json.RawMessage, int, error) {
	baseQuery["from"] = params.PageIndex * params.PageSize
	baseQuery["size"] = params.PageSize
	baseQuery["track_total_hits"] = true
	baseQuery["sort"] = []map[string]any{
		{params.SortField: map[string]any{"order": params.SortOrder, "unmapped_type": "keyword"}},
	}

	queryBytes, err := json.Marshal(baseQuery)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to marshal query: %w", err)
	}

	resp, err := client.Search(context.Background(), &opensearchapi.SearchReq{
		Indices: []string{index},
		Body:    strings.NewReader(string(queryBytes)),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("opensearch search failed: %w", err)
	}

	body, err := io.ReadAll(resp.Inspect().Response.Body)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to read response body: %w", err)
	}

	var result struct {
		Hits struct {
			Total struct {
				Value int `json:"value"`
			} `json:"total"`
			Hits []struct {
				Source json.RawMessage `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, 0, fmt.Errorf("failed to parse opensearch response: %w", err)
	}

	sources := make([]json.RawMessage, 0, len(result.Hits.Hits))
	for _, hit := range result.Hits.Hits {
		sources = append(sources, hit.Source)
	}

	return sources, result.Hits.Total.Value, nil
}

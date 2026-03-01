package database

import (
	"context"
	"fmt"
	"log"
	"os"

	opensearch "github.com/opensearch-project/opensearch-go/v4"
	opensearchapi "github.com/opensearch-project/opensearch-go/v4/opensearchapi"
)

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func NewOpenSearchClient() (*opensearchapi.Client, error) {
	host := getEnvOrDefault("OPENSEARCH_HOST", "localhost")
	port := getEnvOrDefault("OPENSEARCH_PORT", "9200")

	osCfg := opensearch.Config{
		Addresses: []string{fmt.Sprintf("http://%s:%s", host, port)},
	}

	if u := os.Getenv("OPENSEARCH_USER"); u != "" {
		osCfg.Username = u
		osCfg.Password = os.Getenv("OPENSEARCH_PASSWORD")
	}

	client, err := opensearchapi.NewClient(opensearchapi.Config{Client: osCfg})
	if err != nil {
		return nil, fmt.Errorf("failed to create opensearch client: %w", err)
	}

	_, err = client.Ping(context.Background(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to ping opensearch: %w", err)
	}

	log.Println("OpenSearch connection established")
	return client, nil
}

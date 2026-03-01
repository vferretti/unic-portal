package main

import (
	"log"

	"portal/internal/database"
	"portal/internal/repository"
	"portal/internal/server"

	_ "portal/docs"
)

// @title           UNIC Portal API
// @version         1.0
// @description     REST API for the UNIC data portal — catalog, resources, tables, variables.

// @host      localhost:8080
// @BasePath  /api
func main() {
	osClient, err := database.NewOpenSearchClient()
	if err != nil {
		log.Fatalf("failed to connect to opensearch: %v", err)
	}

	resourceRepo := repository.NewResourceRepository(osClient)
	dictTableRepo := repository.NewDictTableRepository(osClient)
	dictVariableRepo := repository.NewDictVariableRepository(osClient)

	r := server.SetupRouter(resourceRepo, dictTableRepo, dictVariableRepo)

	log.Println("server listening on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

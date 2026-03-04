package main

import (
	"log"

	"portal/internal/database"
	"portal/internal/repository"
	"portal/internal/server"
	"portal/internal/types"

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

	pgDB, err := database.NewPostgresDB()
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}

	if err := pgDB.AutoMigrate(&types.User{}, &types.CartItem{}); err != nil {
		log.Fatalf("failed to auto-migrate: %v", err)
	}

	resourceRepo := repository.NewResourceRepository(osClient)
	dictTableRepo := repository.NewDictTableRepository(osClient)
	dictVariableRepo := repository.NewDictVariableRepository(osClient)
	cartRepo := repository.NewCartRepository(pgDB)

	r := server.SetupRouter(resourceRepo, dictTableRepo, dictVariableRepo, cartRepo)

	log.Println("server listening on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

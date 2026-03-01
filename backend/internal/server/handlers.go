package server

import (
	"strconv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"portal/internal/repository"
	"portal/internal/types"
)

func SetupRouter(resourceRepo repository.ResourceDAO, dictTableRepo repository.DictTableDAO, dictVariableRepo repository.DictVariableDAO) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: false,
	}))

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := r.Group("/api")
	{
		api.GET("/resources", ListResourcesHandler(resourceRepo))
		api.GET("/catalog/resources", ListResourcesByTypeHandler(resourceRepo))
		api.GET("/catalog/tables", ListTablesByResourceTypeHandler(dictTableRepo))
		api.GET("/catalog/variables", ListVariablesByResourceTypeHandler(dictVariableRepo))
		api.GET("/catalog/stats", CatalogStatsHandler(resourceRepo))
	}

	return r
}

func parsePaginationParams(c *gin.Context, defaultSortField string) types.PaginationParams {
	pageIndex, _ := strconv.Atoi(c.DefaultQuery("page_index", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "25"))
	sortField := c.DefaultQuery("sort_field", defaultSortField)
	sortOrder := c.DefaultQuery("sort_order", "asc")
	systems := c.QueryArray("system")
	tables := c.QueryArray("table")
	search := c.Query("search")

	if pageSize < 1 {
		pageSize = 25
	}
	if pageSize > 200 {
		pageSize = 200
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc"
	}

	return types.PaginationParams{
		PageIndex: pageIndex,
		PageSize:  pageSize,
		SortField: sortField,
		SortOrder: sortOrder,
		Systems:   systems,
		Tables:    tables,
		Search:    search,
	}
}

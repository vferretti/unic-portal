package server

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"portal/internal/repository"
	"portal/internal/types"
)

// CatalogStatsHandler godoc
// @Summary      Catalog statistics
// @Description  Returns aggregate counts (resources, tables, variables) grouped by resource type
// @Tags         catalog
// @Produce      json
// @Param        system  query  []string  false  "Filter by source system names"
// @Param        table   query  []string  false  "Filter by table names"
// @Success      200  {object}  types.CatalogStats
// @Failure      500  {object}  types.ApiError
// @Router       /catalog/stats [get]
func CatalogStatsHandler(repo repository.ResourceDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		systems := c.QueryArray("system")
		tables := c.QueryArray("table")
		stats, err := repo.GetCatalogStats(systems, tables)
		if err != nil {
			log.Printf("catalog stats error: %v", err)
			HandleError(c, err)
			return
		}
		c.JSON(http.StatusOK, stats)
	}
}

// ListResourcesByTypeHandler godoc
// @Summary      List resources by type
// @Description  Returns paginated resources filtered by resource type
// @Tags         catalog
// @Produce      json
// @Param        type        query  string    true   "Resource type (research_project, eqp, warehouse, source_system)"
// @Param        page_index  query  int       false  "Page index"  default(0)
// @Param        page_size   query  int       false  "Page size"   default(25)
// @Param        sort_field  query  string    false  "Sort field"  default(rs_name.keyword)
// @Param        sort_order  query  string    false  "Sort order (asc or desc)"  default(asc)
// @Param        system      query  []string  false  "Filter by source system names"
// @Param        table       query  []string  false  "Filter by table names"
// @Param        search      query  string    false  "Full-text search query"
// @Success      200  {object}  types.PaginatedResponse[types.Resource]
// @Failure      400  {object}  types.ApiError
// @Failure      500  {object}  types.ApiError
// @Router       /catalog/resources [get]
func ListResourcesByTypeHandler(repo repository.ResourceDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		rsType := c.Query("type")
		if rsType == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing required query parameter: type"})
			return
		}
		params := parsePaginationParams(c, "rs_name.keyword")
		resources, total, err := repo.ListResourcesByType(rsType, params)
		if err != nil {
			log.Printf("query error: %v", err)
			HandleError(c, err)
			return
		}
		c.JSON(http.StatusOK, types.PaginatedResponse[types.Resource]{Data: resources, Total: total})
	}
}

// ListResourcesHandler godoc
// @Summary      List project resources
// @Description  Returns all resources of type research_project and eqp (unpaginated, sorted by name)
// @Tags         resources
// @Produce      json
// @Success      200  {array}   types.Resource
// @Failure      500  {object}  types.ApiError
// @Router       /resources [get]
func ListResourcesHandler(repo repository.ResourceDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		resources, err := repo.ListResources()
		if err != nil {
			log.Printf("query error: %v", err)
			HandleError(c, err)
			return
		}
		c.JSON(http.StatusOK, resources)
	}
}

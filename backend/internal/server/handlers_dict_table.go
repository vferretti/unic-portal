package server

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"portal/internal/repository"
	"portal/internal/types"
)

// ListTablesByResourceTypeHandler godoc
// @Summary      List tables by resource type
// @Description  Returns paginated dictionary tables filtered by resource type
// @Tags         catalog
// @Produce      json
// @Param        type        query  string    true   "Resource type"
// @Param        page_index  query  int       false  "Page index"  default(0)
// @Param        page_size   query  int       false  "Page size"   default(25)
// @Param        sort_field  query  string    false  "Sort field"  default(tab_name)
// @Param        sort_order  query  string    false  "Sort order (asc or desc)"  default(asc)
// @Param        system      query  []string  false  "Filter by source system names"
// @Param        table       query  []string  false  "Filter by table names"
// @Param        search      query  string    false  "Full-text search query"
// @Success      200  {object}  types.PaginatedResponse[types.DictTable]
// @Failure      400  {object}  types.ApiError
// @Failure      500  {object}  types.ApiError
// @Router       /catalog/tables [get]
func ListTablesByResourceTypeHandler(repo repository.DictTableDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		rsType := c.Query("type")
		if rsType == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing required query parameter: type"})
			return
		}
		params := parsePaginationParams(c, "tab_name")
		tables, total, err := repo.ListTablesByResourceType(rsType, params)
		if err != nil {
			log.Printf("query error: %v", err)
			HandleError(c, err)
			return
		}
		c.JSON(http.StatusOK, types.PaginatedResponse[types.DictTable]{Data: tables, Total: total})
	}
}

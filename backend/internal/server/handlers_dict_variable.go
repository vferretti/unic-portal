package server

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"portal/internal/repository"
	"portal/internal/types"
)

// ListVariablesByResourceTypeHandler godoc
// @Summary      List variables by resource type
// @Description  Returns paginated dictionary variables filtered by resource type
// @Tags         catalog
// @Produce      json
// @Param        type        query  string    true   "Resource type"
// @Param        page_index  query  int       false  "Page index"  default(0)
// @Param        page_size   query  int       false  "Page size"   default(25)
// @Param        sort_field  query  string    false  "Sort field"  default(var_name)
// @Param        sort_order  query  string    false  "Sort order (asc or desc)"  default(asc)
// @Param        system      query  []string  false  "Filter by source system names"
// @Param        table       query  []string  false  "Filter by table names"
// @Param        search      query  string    false  "Full-text search query"
// @Success      200  {object}  types.PaginatedResponse[types.DictVariable]
// @Failure      400  {object}  types.ApiError
// @Failure      500  {object}  types.ApiError
// @Router       /catalog/variables [get]
func ListVariablesByResourceTypeHandler(repo repository.DictVariableDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		rsType := c.Query("type")
		if rsType == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing required query parameter: type"})
			return
		}
		params := parsePaginationParams(c, "var_name")
		variables, total, err := repo.ListVariablesByResourceType(rsType, params)
		if err != nil {
			log.Printf("query error: %v", err)
			HandleError(c, err)
			return
		}
		c.JSON(http.StatusOK, types.PaginatedResponse[types.DictVariable]{Data: variables, Total: total})
	}
}

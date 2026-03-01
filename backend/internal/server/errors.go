package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"portal/internal/types"
)

func HandleError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, types.ApiError{
		Status:  http.StatusInternalServerError,
		Message: "Internal Server Error",
		Detail:  err.Error(),
	})
}

func HandleNotFoundError(c *gin.Context, entity string) {
	c.JSON(http.StatusNotFound, types.ApiError{
		Status:  http.StatusNotFound,
		Message: entity + " not found",
	})
}

func HandleValidationError(c *gin.Context, err error) {
	c.JSON(http.StatusBadRequest, types.ApiError{
		Status:  http.StatusBadRequest,
		Message: "Validation error",
		Detail:  err.Error(),
	})
}

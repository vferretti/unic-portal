package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"portal/internal/repository"
	"portal/internal/types"
)

const hardcodedEmail = "John.Smith.hsj@ssss.gouv.qc.ca"
const hardcodedName = "John Smith"

func getUser(cartRepo repository.CartDAO) (*types.User, error) {
	return cartRepo.GetOrCreateUser(hardcodedEmail, hardcodedName)
}

func ListCartItemsHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
			return
		}
		items, err := cartRepo.ListCartItems(user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list cart items"})
			return
		}
		count := int64(len(items))
		c.JSON(http.StatusOK, gin.H{"items": items, "count": count})
	}
}

func CartCountHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
			return
		}
		count, err := cartRepo.CountCartItems(user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count cart items"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"count": count})
	}
}

func AddCartItemsHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req types.AddCartItemsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
			return
		}
		if err := cartRepo.AddCartItems(user.ID, req.Items); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add cart items"})
			return
		}
		count, _ := cartRepo.CountCartItems(user.ID)
		c.JSON(http.StatusOK, gin.H{"success": true, "count": count})
	}
}

func RemoveCartItemsHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req types.RemoveCartItemsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
			return
		}
		if err := cartRepo.RemoveCartItems(user.ID, req.VarIDs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove cart items"})
			return
		}
		count, _ := cartRepo.CountCartItems(user.ID)
		c.JSON(http.StatusOK, gin.H{"success": true, "count": count})
	}
}

func ClearCartHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve user"})
			return
		}
		if err := cartRepo.ClearCart(user.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to clear cart"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "count": 0})
	}
}

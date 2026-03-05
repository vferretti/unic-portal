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

// ListCartItemsHandler godoc
// @Summary      List cart items
// @Description  Returns all variables in the current user's cart
// @Tags         cart
// @Produce      json
// @Success      200  {object}  types.CartListResponse
// @Failure      500  {object}  types.ApiError
// @Router       /cart/items [get]
func ListCartItemsHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to resolve user"})
			return
		}
		items, err := cartRepo.ListCartItems(user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to list cart items"})
			return
		}
		count := int64(len(items))
		c.JSON(http.StatusOK, types.CartListResponse{Items: items, Count: count})
	}
}

// CartCountHandler godoc
// @Summary      Get cart item count
// @Description  Returns the number of variables in the current user's cart
// @Tags         cart
// @Produce      json
// @Success      200  {object}  types.CartCountResponse
// @Failure      500  {object}  types.ApiError
// @Router       /cart/count [get]
func CartCountHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to resolve user"})
			return
		}
		count, err := cartRepo.CountCartItems(user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to count cart items"})
			return
		}
		c.JSON(http.StatusOK, types.CartCountResponse{Count: count})
	}
}

// AddCartItemsHandler godoc
// @Summary      Add items to cart
// @Description  Adds one or more variables to the current user's cart
// @Tags         cart
// @Accept       json
// @Produce      json
// @Param        body  body      types.AddCartItemsRequest  true  "Variables to add"
// @Success      200   {object}  types.CartMutationResponse
// @Failure      400   {object}  types.ApiError
// @Failure      500   {object}  types.ApiError
// @Router       /cart/items [post]
func AddCartItemsHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req types.AddCartItemsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, types.ApiError{Message: err.Error()})
			return
		}
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to resolve user"})
			return
		}
		if err := cartRepo.AddCartItems(user.ID, req.Items); err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to add cart items"})
			return
		}
		count, _ := cartRepo.CountCartItems(user.ID)
		c.JSON(http.StatusOK, types.CartMutationResponse{Success: true, Count: count})
	}
}

// RemoveCartItemsHandler godoc
// @Summary      Remove items from cart
// @Description  Removes one or more variables from the current user's cart by var_id
// @Tags         cart
// @Accept       json
// @Produce      json
// @Param        body  body      types.RemoveCartItemsRequest  true  "Variable IDs to remove"
// @Success      200   {object}  types.CartMutationResponse
// @Failure      400   {object}  types.ApiError
// @Failure      500   {object}  types.ApiError
// @Router       /cart/items [delete]
func RemoveCartItemsHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req types.RemoveCartItemsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, types.ApiError{Message: err.Error()})
			return
		}
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to resolve user"})
			return
		}
		if err := cartRepo.RemoveCartItems(user.ID, req.VarIDs); err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to remove cart items"})
			return
		}
		count, _ := cartRepo.CountCartItems(user.ID)
		c.JSON(http.StatusOK, types.CartMutationResponse{Success: true, Count: count})
	}
}

// ClearCartHandler godoc
// @Summary      Clear cart
// @Description  Removes all variables from the current user's cart
// @Tags         cart
// @Produce      json
// @Success      200  {object}  types.CartMutationResponse
// @Failure      500  {object}  types.ApiError
// @Router       /cart [delete]
func ClearCartHandler(cartRepo repository.CartDAO) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := getUser(cartRepo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to resolve user"})
			return
		}
		if err := cartRepo.ClearCart(user.ID); err != nil {
			c.JSON(http.StatusInternalServerError, types.ApiError{Message: "failed to clear cart"})
			return
		}
		c.JSON(http.StatusOK, types.CartMutationResponse{Success: true, Count: 0})
	}
}

package repository

import (
	"portal/internal/types"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CartDAO interface {
	GetOrCreateUser(email, name string) (*types.User, error)
	ListCartItems(userID uint) ([]types.CartItem, error)
	AddCartItems(userID uint, items []types.CartItemInput) error
	RemoveCartItems(userID uint, varIDs []int) error
	ClearCart(userID uint) error
	CountCartItems(userID uint) (int64, error)
}

type CartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) *CartRepository {
	return &CartRepository{db: db}
}

func (r *CartRepository) GetOrCreateUser(email, name string) (*types.User, error) {
	var user types.User
	result := r.db.Where("email = ?", email).First(&user)
	if result.Error == nil {
		return &user, nil
	}
	if result.Error != gorm.ErrRecordNotFound {
		return nil, result.Error
	}
	user = types.User{Email: email, Name: name}
	if err := r.db.Create(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *CartRepository) ListCartItems(userID uint) ([]types.CartItem, error) {
	var items []types.CartItem
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *CartRepository) AddCartItems(userID uint, items []types.CartItemInput) error {
	if len(items) == 0 {
		return nil
	}
	cartItems := make([]types.CartItem, len(items))
	for i, item := range items {
		cartItems[i] = types.CartItem{
			UserID:     userID,
			VarID:      item.VarID,
			VarName:    item.VarName,
			VarLabelEn: item.VarLabelEn,
			VarLabelFr: item.VarLabelFr,
			TabName:    item.TabName,
			RsName:     item.RsName,
		}
	}
	return r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&cartItems).Error
}

func (r *CartRepository) RemoveCartItems(userID uint, varIDs []int) error {
	return r.db.Where("user_id = ? AND var_id IN ?", userID, varIDs).Delete(&types.CartItem{}).Error
}

func (r *CartRepository) ClearCart(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&types.CartItem{}).Error
}

func (r *CartRepository) CountCartItems(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&types.CartItem{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

package types

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CartItem struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;uniqueIndex:idx_user_var" json:"user_id"`
	VarID      int       `gorm:"not null;uniqueIndex:idx_user_var" json:"var_id"`
	VarName    string    `json:"var_name"`
	VarLabelEn string    `json:"var_label_en"`
	VarLabelFr string    `json:"var_label_fr"`
	TabName    string    `json:"tab_name"`
	RsName     string    `json:"rs_name"`
	CreatedAt  time.Time `json:"created_at"`
}

type AddCartItemsRequest struct {
	Items []CartItemInput `json:"items" binding:"required"`
}

type CartItemInput struct {
	VarID      int    `json:"var_id" binding:"required"`
	VarName    string `json:"var_name"`
	VarLabelEn string `json:"var_label_en"`
	VarLabelFr string `json:"var_label_fr"`
	TabName    string `json:"tab_name"`
	RsName     string `json:"rs_name"`
}

type RemoveCartItemsRequest struct {
	VarIDs []int `json:"var_ids" binding:"required"`
}

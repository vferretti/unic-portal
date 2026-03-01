package types

type ApiError struct {
	Status  int    `json:"status,omitempty"`
	Message string `json:"message,omitempty"`
	Detail  any    `json:"detail,omitempty"`
}

export interface CartItem {
  id: number;
  user_id: number;
  var_id: number;
  var_name: string;
  var_label_en: string;
  var_label_fr: string;
  tab_name: string;
  rs_name: string;
  created_at: string;
}

export interface AddCartItemsRequest {
  items: {
    var_id: number;
    var_name: string;
    var_label_en: string;
    var_label_fr: string;
    tab_name: string;
    rs_name: string;
  }[];
}

export interface RemoveCartItemsRequest {
  var_ids: number[];
}

export interface CartResponse {
  items: CartItem[];
  count: number;
}

export interface CartCountResponse {
  count: number;
}

export interface CartMutationResponse {
  success: boolean;
  count: number;
}

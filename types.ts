export interface Product {
  id: string;
  brand: 'Onetouch' | 'Okamoto' | 'Durex';
  name: string;
  size: string; // e.g. "52mm"
  packSize: number; // pieces per box
  price: number;
  promoPrice?: number;
  imageKey: string;
  type: 'Condom' | 'Gel';
  features: readonly string[]; // e.g. ["Thin", "Strawberry"]
}

export interface CartItem extends Product {
  qty: number;
}

export interface Template {
  id: string;
  name: string;
  items: { productId: string; qty: number }[];
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface AdminCustomer {
  lineUserId: string;
  customerId: string;
  displayName: string;
  store: string;
  area: string;
  phone: string;
  defaultAddress: string;
  type: string;
  status: string;
}

export type SortOption = 'relevance' | 'priceLow' | 'priceHigh';

export interface OrderPayload {
  action: 'order' | 'admin_order';
  idToken: string;
  lineUserId: string;
  displayName: string;
  selectedCustomerId?: string;
  store: string;
  area: string;
  phone: string;
  address: string;
  cart: {
    SKU: string;
    Brand: string;
    Size: string;
    Name: string;
    qty: number;
  }[];
}

export interface NewAdminCustomer {
  displayName: string;
  store: string;
  area: string;
  phone: string;
  address: string;
}

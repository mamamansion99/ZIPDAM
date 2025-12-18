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

export type SortOption = 'relevance' | 'priceLow' | 'priceHigh';

export interface OrderPayload {
  idToken: string;
  cart: {
    brand: string;
    size: string;
    name: string;
    qty: number;
    price: number;
  }[];
}
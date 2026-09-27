export type ProductCategory = 'hand-bell' | 'hanging-bell' | 'jayagante';

/** A purchasable size of a product — bells are priced by weight. */
export interface ProductVariant {
  label: string; // e.g. "1.5 kg"
  size?: string; // e.g. "10 in tall · 5.5 in wide"
  price: number; // INR, whole rupees
  /** false = this weight is out of stock. Missing means in stock. */
  in_stock?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Lowest price (the "from" price). Kept in sync with `variants` when they exist. */
  price: number; // stored in INR, whole rupees
  category: ProductCategory;
  image: string;
  /** Smaller version for cards/grids; falls back to `image` when absent. */
  thumb?: string | null;
  /** Extra photos shown in the product page gallery (after `image`). */
  images?: string[];
  /** Short muted video clip, shown as the last item in the product page gallery. */
  video?: string | null;
  /** Weight/size options. Empty or missing = single price (`price`). */
  variants?: ProductVariant[];
  /** Short label shown on the product photo, e.g. "Stick included". */
  badge?: string | null;
  /** Kannada versions — fall back to the English fields when missing. */
  name_kn?: string | null;
  description_kn?: string | null;
  badge_kn?: string | null;
  /** false = the whole product is out of stock. Missing means in stock. */
  in_stock?: boolean;
  /** Shown in the home page's featured row. */
  featured?: boolean;
  /** Lower numbers are listed first. */
  sort_order?: number;
  is_visible: boolean;
  created_at?: string;
}

/** One line of a combo offer. */
export interface ComboItem {
  product_id: string;
  /** Weight label of the chosen variant ("" for single-price products). */
  variant?: string;
  qty: number;
}

export interface Combo {
  id: string;
  name: string;
  name_kn?: string | null;
  description: string;
  description_kn?: string | null;
  /** Optional photo; otherwise the included products' photos are shown. */
  image?: string | null;
  items: ComboItem[];
  /** Special combo price (INR). */
  price: number;
  in_stock?: boolean;
  sort_order?: number;
  is_visible: boolean;
  created_at?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  contact: string;
  message: string;
  product_name?: string | null;
  created_at?: string;
  status: 'new' | 'read';
}

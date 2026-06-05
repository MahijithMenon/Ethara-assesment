export type Product = {
  id: number;
  name: string;
  sku: string;
  price: string; // serialized as string from Pydantic Decimal
  quantity_in_stock: number;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type OrderSummary = {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: string;
  status: string;
  item_count: number;
  created_at: string;
};

export type Order = {
  id: number;
  customer_id: number;
  customer: Customer;
  total_amount: string;
  status: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  total_products: number;
  total_customers: number;
  total_orders: number;
  revenue: string;
  low_stock_threshold: number;
  low_stock_products: Array<{
    id: number;
    name: string;
    sku: string;
    quantity_in_stock: number;
  }>;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export const CACHE_TAGS = {
  products: "products",
  customers: "customers",
  orders: "orders",
  dashboard: "dashboard",
  product: (id: number | string) => `product-${id}`,
  customer: (id: number | string) => `customer-${id}`,
  order: (id: number | string) => `order-${id}`,
} as const;

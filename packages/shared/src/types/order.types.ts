export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalInCents: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  subtotalInCents: number;
  shippingInCents: number;
  taxInCents: number;
  discountInCents: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  trackingNumber: string | null;
  trackingCarrier: string | null;
  items: OrderItemDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDetail {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceInCents: number;
  totalPriceInCents: number;
}

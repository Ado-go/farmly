export type OrderStatus =
  | "PENDING"
  | "ACTIVE"
  | "CANCELED"
  | "COMPLETED"
  | "ONWAY"
  | "CONFIRMED"
  | string;

export type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  status: OrderStatus;
};

export type Buyer = {
  id?: number;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
};

export type PaymentMethod = "CARD" | "CASH" | string;

export type ContactInfo = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type DeliveryInfo = {
  city?: string | null;
  street?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type Order = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  orderType?: "STANDARD" | "PREORDER" | string;
  totalPrice: number;
  isPaid?: boolean;
  paymentMethod?: PaymentMethod;
  contact?: ContactInfo;
  delivery?: DeliveryInfo;
  buyer?: Buyer;
  items: OrderItem[];
};

export type EventInfo = {
  title?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
};

export type EventOrder = Order & {
  event: EventInfo | null;
};

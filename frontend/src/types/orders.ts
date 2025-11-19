export type OrderStatus =
  | "PENDING"
  | "ACTIVE"
  | "CANCELED"
  | "COMPLETED"
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
};

export type Order = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalPrice: number;
  buyer?: Buyer;
  items: OrderItem[];
};

export type EventInfo = {
  title?: string;
  street?: string;
  city?: string;
};

export type EventOrder = Order & {
  event: EventInfo;
};

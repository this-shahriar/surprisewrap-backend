export interface Order {
  products: string;
  userId: string;
  delivery_address: string;
  totalPrice: number;
  status: string;
  createdAt: number;
}

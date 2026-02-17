import { db } from './index';

export interface Order {
  id: string;
  customer_id: string;
  total: number;
}

export interface Customer {
  id: string;
  email: string;
}

export async function getRecentOrders(): Promise<Array<Order & { customer: Customer | null }>> {
  const orders = await db.query<Order>(
    'SELECT id, customer_id, total FROM orders ORDER BY id DESC LIMIT 50'
  );

  const customerIds = Array.from(new Set(orders.map((order) => order.customer_id)));

  if (customerIds.length === 0) {
    return orders.map((order) => ({ ...order, customer: null }));
  }

  const placeholders = customerIds.map((_, index) => `$${index + 1}`).join(', ');
  const customers = await db.query<Customer>(
    `SELECT id, email FROM customers WHERE id IN (${placeholders})`,
    customerIds
  );

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  return orders.map((order) => ({
    ...order,
    customer: customerById.get(order.customer_id) || null,
  }));
}

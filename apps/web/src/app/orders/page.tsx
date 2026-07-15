'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders.list().then((res) => setOrders(res.data.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order: any) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Status: {order.status}</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="font-semibold">Total: {formatPrice(order.total)}</p>
              <ul className="text-sm text-muted-foreground">
                {order.items.map((item: any) => (
                  <li key={item.id}>
                    {item.quantity} x {item.productName} @ {formatPrice(item.unitPrice)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

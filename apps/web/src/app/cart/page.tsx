'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.cart.get().then((res) => setCart(res.data)).finally(() => setLoading(false));
  }, []);

  async function updateQuantity(productId: string, quantity: number) {
    await fetchApi('/cart/items/' + productId, { method: 'PATCH', body: JSON.stringify({ quantity }) });
    const res = await api.cart.get();
    setCart(res.data);
  }

  async function remove(productId: string) {
    await fetchApi('/cart/items/' + productId, { method: 'DELETE' });
    const res = await api.cart.get();
    setCart(res.data);
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Loading cart...</div>;
  if (!cart?.items?.length) return <div className="container mx-auto px-4 py-8">Your cart is empty.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-24 w-24 rounded-lg bg-muted">
                  {item.product.images[0] && <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full rounded-lg object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.product.vendor?.storeName}</p>
                  <p className="mt-1">{formatPrice(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                    className="w-20"
                  />
                  <Button variant="ghost" onClick={() => remove(item.productId)}>
                    Remove
                  </Button>
                </div>
                <div className="font-semibold">{formatPrice(item.total)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{formatPrice(cart.shipping)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatPrice(cart.discount)}</span></div>
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrice(cart.total)}</span></div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/checkout')}>
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function fetchApi(input: string, init?: RequestInit) {
  return fetch(process.env.NEXT_PUBLIC_API_URL + input, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  }).then((r) => r.json());
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: '' });
  const [cart, setCart] = useState<any>(null);

  useEffect(() => {
    api.cart.get().then((r) => setCart(r.data)).catch(() => setCart(null));
  }, []);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.orders.create({ shippingAddress: address });
      const orders = res.data || [];
      if (!orders.length) throw new Error('No orders created');
      const order = orders[0];
      setOrderId(order.id);
      const payment = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/intent/${order.id}`, {
        method: 'POST',
        credentials: 'include',
      }).then((r) => r.json());
      setClientSecret(payment.data.clientSecret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!cart) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createOrder} className="space-y-4">
              <div><Label>Street</Label><Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>City</Label><Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required /></div>
                <div><Label>State</Label><Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>ZIP</Label><Input value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} required /></div>
                <div><Label>Country</Label><Input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} required /></div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {!clientSecret && <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating order...' : 'Continue to Payment'}</Button>}
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{formatPrice(cart.shipping)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatPrice(cart.discount)}</span></div>
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrice(cart.total)}</span></div>
          </CardContent>
        </Card>
      </div>

      {clientSecret && (
        <div className="mt-8">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm orderId={orderId!} />
          </Elements>
        </div>
      )}
    </div>
  );
}

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success?order=${orderId}` },
      redirect: 'if_required',
    });
    if (submitError) {
      setError(submitError.message || 'Payment failed');
    } else if (paymentIntent?.status === 'succeeded') {
      router.push(`/checkout/success?order=${orderId}`);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <PaymentElement />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={!stripe || loading}>{loading ? 'Processing...' : 'Pay Now'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

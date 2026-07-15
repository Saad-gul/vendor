import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data } = await api.orders.get(params.id).catch(() => null);
  if (!data) notFound();

  const order = data.data;

  const steps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const stepIndex = steps.indexOf(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b py-2">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatPrice(item.total)}</p>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold pt-4">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader><CardTitle>Tracking</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`} />
                  <span className={i <= stepIndex ? 'font-medium' : 'text-muted-foreground'}>{s}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Current status: <span className="font-semibold">{order.status}</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

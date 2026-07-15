'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader><CardTitle className="text-2xl">Payment Successful</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">Thank you for your order. Your order is being processed.</p>
        {orderId && <p className="font-medium">Order #{orderId.slice(0, 8)}</p>}
        <Link href="/orders">
          <Button className="w-full">View Orders</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

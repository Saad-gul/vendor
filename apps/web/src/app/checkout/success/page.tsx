import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SuccessContent } from './success-content';

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
      <Suspense fallback={<SuccessFallback />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

function SuccessFallback() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader><CardTitle className="text-2xl">Payment Successful</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Loading order details...</p>
        <Link href="/orders"><Button className="mt-4 w-full">View Orders</Button></Link>
      </CardContent>
    </Card>
  );
}

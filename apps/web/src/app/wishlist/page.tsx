'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, truncate } from '@/lib/utils';

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`, { credentials: 'include' })
      .then((r) => r.json())
      .then((r) => setItems(r.data?.items || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8">Loading wishlist...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Wishlist</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Your wishlist is empty.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item: any) => (
            <Card key={item.id} className="flex flex-col">
              <div className="aspect-square w-full bg-muted">
                {item.product.images[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{truncate(item.product.name, 40)}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-lg font-semibold">{formatPrice(item.product.price)}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/products/${item.product.slug}`} className="w-full">
                  <Button className="w-full">View Product</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

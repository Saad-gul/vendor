import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, truncate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { data } = await api.products.list().catch(() => ({ data: { data: [] } }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Products</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {data.data.map((product: any) => (
          <Card key={product.id} className="flex flex-col overflow-hidden">
            <div className="aspect-square w-full bg-muted">
              {product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{truncate(product.name, 40)}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.vendor?.storeName}</p>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">{truncate(product.shortDescription || product.description, 80)}</p>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <span className="font-semibold">{formatPrice(product.price)}</span>
              <Link href={`/products/${product.slug}`}>
                <Button size="sm">View</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

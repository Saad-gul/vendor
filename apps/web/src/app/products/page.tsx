import { api } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, truncate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = searchParams.q;
  const category = searchParams.category;
  const res = q
    ? await api.search.products(q, category ? { categoryId: category } : undefined).catch(() => ({ data: { data: [] } }))
    : await api.products.list(category ? { categoryId: category } : undefined).catch(() => ({ data: { data: [] } }));
  const products = res.data.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Products</h1>
      <form action="/products" method="get" className="mb-8 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search products..." className="max-w-md" />
        <Button type="submit">Search</Button>
      </form>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product: any) => (
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

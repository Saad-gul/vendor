import { api } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, truncate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams: { q?: string; category?: string; minPrice?: string; maxPrice?: string; sortBy?: string; sortOrder?: string } }) {
  const params: Record<string, string> = {};
  if (searchParams.q) params.q = searchParams.q;
  if (searchParams.category) params.categoryId = searchParams.category;
  if (searchParams.minPrice) params.minPrice = searchParams.minPrice;
  if (searchParams.maxPrice) params.maxPrice = searchParams.maxPrice;
  if (searchParams.sortBy) params.sortBy = searchParams.sortBy;
  if (searchParams.sortOrder) params.sortOrder = searchParams.sortOrder;

  const [productsRes, categoriesRes] = await Promise.all([
    searchParams.q
      ? api.search.products(searchParams.q, params).catch(() => ({ data: { data: [] } }))
      : api.products.list(params).catch(() => ({ data: { data: [] } })),
    api.categories.list().catch(() => ({ data: { data: [] } })),
  ]);

  const products = productsRes.data.data || [];
  const categories = categoriesRes.data.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Products</h1>
      <div className="mb-8 grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-5">
        <form action="/products" method="get" className="contents">
          <Input name="q" defaultValue={searchParams.q} placeholder="Search products..." />
          <select name="category" defaultValue={searchParams.category} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input name="minPrice" type="number" defaultValue={searchParams.minPrice} placeholder="Min price" />
          <Input name="maxPrice" type="number" defaultValue={searchParams.maxPrice} placeholder="Max price" />
          <div className="flex gap-2">
            <select name="sortBy" defaultValue={searchParams.sortBy || 'createdAt'} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="createdAt">Newest</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
            <select name="sortOrder" defaultValue={searchParams.sortOrder || 'desc'} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          <Button type="submit" className="md:col-span-5">Filter</Button>
        </form>
      </div>

      {products.length === 0 && <p className="text-muted-foreground">No products found.</p>}

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

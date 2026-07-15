import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Star } from 'lucide-react';
import { ProductActions } from './product-actions';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { data } = await api.products.get(params.slug).catch(() => null);
  if (!data) notFound();

  const product = data.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-lg text-muted-foreground">{product.vendor?.storeName}</p>
            <div className="mt-2 flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
          </div>
          <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
          <p className="text-muted-foreground">{product.description}</p>
          <ProductActions productId={product.id} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">Reviews</h2>
        {product.reviews?.length ? (
          <div className="grid gap-4">
            {product.reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.user.name || 'Anonymous'}</span>
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}

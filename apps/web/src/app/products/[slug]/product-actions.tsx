'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';

export function ProductActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  async function addToCart() {
    setAdding(true);
    try {
      await api.cart.add({ productId, quantity: 1 });
      router.push('/cart');
    } finally {
      setAdding(false);
    }
  }

  async function addToWishlist() {
    await api.wishlist.add(productId);
    router.push('/wishlist');
  }

  return (
    <div className="flex gap-3">
      <Button size="lg" onClick={addToCart} disabled={adding}>
        <ShoppingCart className="mr-2 h-4 w-4" />
        {adding ? 'Adding...' : 'Add to Cart'}
      </Button>
      <Button size="lg" variant="outline" onClick={addToWishlist}>
        <Heart className="mr-2 h-4 w-4" />
        Wishlist
      </Button>
    </div>
  );
}

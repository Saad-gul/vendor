'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

export function ReviewForm({ productId, onSubmit }: { productId: string; onSubmit: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.reviews.create({ productId, rating, comment });
      setComment('');
      setRating(5);
      onSubmit();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-4">
      <p className="font-medium">Write a Review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className="focus:outline-none">
            <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts..." required />
      <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Review'}</Button>
    </form>
  );
}

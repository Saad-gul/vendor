'use client';

import Link from 'next/link';
import { ModeToggle } from './mode-toggle';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Store } from 'lucide-react';

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Store className="h-6 w-6" />
          <span>Marketverse</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost">Products</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShoppingBag, Truck, Shield, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">
            Marketverse
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            The premium multi-vendor e-commerce platform for modern brands, vendors, and shoppers.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/products">
              <Button size="lg" className="gap-2">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Start Selling
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShoppingBag, title: 'Curated Products', desc: 'Browse thousands of products from verified vendors.' },
            { icon: Truck, title: 'Fast Shipping', desc: 'Reliable delivery and real-time order tracking.' },
            { icon: Shield, title: 'Secure Payments', desc: 'Stripe-powered checkout with buyer protection.' },
            { icon: Sparkles, title: 'AI Insights', desc: 'Smart recommendations and AI-powered analytics.' },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <f.icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

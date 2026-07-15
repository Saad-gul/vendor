'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VendorDashboard() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    api.analytics.vendor().then((res) => setStats(res.data)).catch(() => setStats({}));
  }, []);

  const cards = [
    { label: 'Total Revenue', value: stats.totalRevenue ?? '-' },
    { label: 'Total Orders', value: stats.totalOrders ?? '-' },
    { label: 'Total Products', value: stats.totalProducts ?? '-' },
    { label: 'Total Customers', value: stats.totalCustomers ?? '-' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <Button>Add Product</Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
